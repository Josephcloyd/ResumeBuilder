import { create } from 'zustand';
import { produce, type Draft } from 'immer';
import type { Resume, Section, SectionType, TemplateId } from '../types/resume';
import {
  cloneSection,
  createBlankResume,
  createSampleResumes,
  createSection,
  isLegacyBundledResume,
  normalizeResume,
  uid,
} from '../lib/defaults';
import * as storage from '../lib/storage';
import { templateById } from '../lib/constants';

const HISTORY_LIMIT = 100;
const COALESCE_MS = 700;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface ResumeState {
  resume: Resume;
  loaded: boolean;
  past: Resume[];
  future: Resume[];
  lastEditAt: number;
  lastEditKey: string;
  saveStatus: SaveStatus;
  library: Resume[];

  init: () => Promise<void>;
  /** Apply an immer recipe to the resume (undoable). */
  update: (recipe: (d: Draft<Resume>) => void, key?: string) => void;
  undo: () => void;
  redo: () => void;

  updateSection: (id: string, recipe: (s: Draft<Section>) => void, key?: string) => void;
  addSection: (type: SectionType) => string;
  removeSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  moveSection: (from: number, to: number) => void;
  applyTemplate: (id: TemplateId) => void;
  setPageCount: (n: number) => void;

  saveNow: () => Promise<void>;
  saveAs: (title: string) => Promise<void>;
  newResume: (title?: string) => Promise<void>;
  openResume: (id: string) => Promise<void>;
  importResume: (data: unknown) => Promise<void>;
  refreshLibrary: () => Promise<void>;
  duplicateInLibrary: (id: string) => Promise<void>;
  renameInLibrary: (id: string, title: string) => Promise<void>;
  deleteFromLibrary: (id: string) => Promise<void>;
  clearAllLocalData: () => Promise<void>;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;

export const useResumeStore = create<ResumeState>((set, get) => {
  const scheduleSave = () => {
    clearTimeout(saveTimer);
    set({ saveStatus: 'saving' });
    saveTimer = setTimeout(() => void get().saveNow(), 800);
  };

  const commit = (next: Resume, key: string, undoable = true) => {
    const { resume, past, lastEditAt, lastEditKey } = get();
    if (next === resume) return;
    const now = Date.now();
    const coalesce = key !== '' && key === lastEditKey && now - lastEditAt < COALESCE_MS;
    set({
      resume: next,
      past: !undoable || coalesce ? past : [...past.slice(-HISTORY_LIMIT + 1), resume],
      future: undoable ? [] : get().future,
      lastEditAt: now,
      lastEditKey: key,
    });
    scheduleSave();
  };

  return {
    resume: createBlankResume(),
    loaded: false,
    past: [],
    future: [],
    lastEditAt: 0,
    lastEditKey: '',
    saveStatus: 'idle',
    library: [],

    init: async () => {
      let r: Resume | null = null;
      try {
        const currentId = storage.getCurrentId();
        let all = await storage.listResumes();
        const obsoleteSamples = all.filter(isLegacyBundledResume);
        if (obsoleteSamples.length) {
          await Promise.all(obsoleteSamples.map((resume) => storage.deleteResume(resume.id)));
          all = all.filter((resume) => !isLegacyBundledResume(resume));
        }
        if (!all.length) {
          all = createSampleResumes();
          await Promise.all(all.map(storage.saveResume));
        }
        r = all.find((resume) => resume.id === currentId) ?? all[0] ?? null;
      } catch (e) {
        console.error('Failed to load saved resumes', e);
      }
      if (!r) {
        const samples = createSampleResumes();
        await Promise.all(samples.map((sample) => storage.saveResume(sample).catch(() => undefined)));
        r = samples[0];
      }
      storage.setCurrentId(r.id);
      set({ resume: r, loaded: true, saveStatus: 'saved', past: [], future: [] });
      void get().refreshLibrary();
    },

    update: (recipe, key = '') => {
      const next = produce(get().resume, (d) => {
        recipe(d);
        d.updatedAt = Date.now();
      });
      commit(next, key);
    },

    undo: () => {
      const { past, future, resume } = get();
      if (!past.length) return;
      const prev = past[past.length - 1];
      set({ resume: prev, past: past.slice(0, -1), future: [resume, ...future], lastEditKey: '' });
      scheduleSave();
    },
    redo: () => {
      const { past, future, resume } = get();
      if (!future.length) return;
      const next = future[0];
      set({ resume: next, past: [...past, resume], future: future.slice(1), lastEditKey: '' });
      scheduleSave();
    },

    updateSection: (id, recipe, key) => {
      get().update((d) => {
        const s = d.sections.find((x) => x.id === id);
        if (s) recipe(s);
      }, key ?? '');
    },
    addSection: (type) => {
      const s = createSection(type);
      get().update((d) => {
        d.sections.push(s as Draft<Section>);
      });
      return s.id;
    },
    removeSection: (id) =>
      get().update((d) => {
        d.sections = d.sections.filter((s) => s.id !== id);
      }),
    duplicateSection: (id) =>
      get().update((d) => {
        const idx = d.sections.findIndex((s) => s.id === id);
        if (idx < 0) return;
        const copy = cloneSection(JSON.parse(JSON.stringify(d.sections[idx])) as Section);
        d.sections.splice(idx + 1, 0, copy as Draft<Section>);
      }),
    moveSection: (from, to) =>
      get().update((d) => {
        if (to < 0 || to >= d.sections.length) return;
        const [s] = d.sections.splice(from, 1);
        d.sections.splice(to, 0, s);
      }),
    applyTemplate: (id) =>
      get().update((d) => {
        const t = templateById(id);
        d.design.template = id;
        d.layout.columns = t.columns;
        if (t.headingAlignment) d.layout.headingAlignment = t.headingAlignment;
        Object.assign(d.fonts, t.fonts);
        if (t.accent) d.design.accentColor = t.accent;
        else if (['#111827', '#1E3A8A'].includes(d.design.accentColor)) d.design.accentColor = '#2563EB';
      }),
    setPageCount: (n) => {
      if (get().resume.pageCount === n) return;
      // not undoable, cosmetic metadata
      set({ resume: { ...get().resume, pageCount: n } });
    },

    saveNow: async () => {
      clearTimeout(saveTimer);
      set({ saveStatus: 'saving' });
      try {
        const r = get().resume;
        await storage.saveResume(r);
        storage.setCurrentId(r.id);
        set({ saveStatus: 'saved' });
        void get().refreshLibrary();
      } catch (e) {
        console.error(e);
        set({ saveStatus: 'error' });
      }
    },
    saveAs: async (title) => {
      await get().saveNow();
      const copy = produce(get().resume, (d) => {
        d.id = uid();
        d.title = title;
        d.createdAt = Date.now();
        d.updatedAt = Date.now();
      });
      set({ resume: copy, past: [], future: [] });
      await get().saveNow();
    },
    newResume: async (title) => {
      await get().saveNow();
      const r = createBlankResume(title || 'Untitled Resume');
      set({ resume: r, past: [], future: [] });
      await get().saveNow();
    },
    openResume: async (id) => {
      if (id === get().resume.id) return;
      await get().saveNow();
      const r = await storage.loadResume(id);
      if (!r) return;
      storage.setCurrentId(r.id);
      set({ resume: r, past: [], future: [], saveStatus: 'saved' });
    },
    importResume: async (data) => {
      await get().saveNow();
      const r = normalizeResume(data);
      r.id = uid();
      r.updatedAt = Date.now();
      set({ resume: r, past: [], future: [] });
      await get().saveNow();
    },
    refreshLibrary: async () => {
      try {
        set({ library: await storage.listResumes() });
      } catch {
        /* ignore */
      }
    },
    duplicateInLibrary: async (id) => {
      const src = id === get().resume.id ? get().resume : await storage.loadResume(id);
      if (!src) return;
      const copy: Resume = { ...structuredClone(src), id: uid(), title: `${src.title} (Copy)`, createdAt: Date.now(), updatedAt: Date.now() };
      await storage.saveResume(copy);
      await get().refreshLibrary();
    },
    renameInLibrary: async (id, title) => {
      if (id === get().resume.id) {
        get().update((d) => {
          d.title = title;
        });
        await get().saveNow();
        return;
      }
      const r = await storage.loadResume(id);
      if (!r) return;
      r.title = title;
      r.updatedAt = Date.now();
      await storage.saveResume(r);
      await get().refreshLibrary();
    },
    deleteFromLibrary: async (id) => {
      await storage.deleteResume(id);
      if (id === get().resume.id) {
        const rest = await storage.listResumes();
        const next = rest[0] ?? createBlankResume();
        set({ resume: next, past: [], future: [] });
        await get().saveNow();
      }
      await get().refreshLibrary();
    },
    clearAllLocalData: async () => {
      clearTimeout(saveTimer);
      await storage.clearAllResumeData();
      const samples = createSampleResumes();
      await Promise.all(samples.map(storage.saveResume));
      const activeSample = samples[0];
      storage.setCurrentId(activeSample.id);
      set({
        resume: activeSample,
        library: samples,
        past: [],
        future: [],
        saveStatus: 'saved',
        lastEditKey: '',
        lastEditAt: 0,
      });
    },
  };
});

/** Find a section by id with a typed result. */
export function useSection<T extends Section>(id: string): T | undefined {
  return useResumeStore((s) => s.resume.sections.find((x) => x.id === id) as T | undefined);
}
