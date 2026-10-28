import { create } from 'zustand';

export type View = 'builder' | 'resumes' | 'templates';
export type EditorTab = 'content' | 'design' | 'score';
export type ZoomMode = 'custom' | 'fitPage' | 'fitWidth';
export type Theme = 'light' | 'dark';

export interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface UIState {
  view: View;
  editorTab: EditorTab;
  mobilePane: 'editor' | 'preview';
  zoom: number;
  zoomMode: ZoomMode;
  theme: Theme;
  exportOpen: boolean;
  saveAsOpen: boolean;
  newOpen: boolean;
  toasts: Toast[];
  confirm: (ConfirmOptions & { resolve: (v: boolean) => void }) | null;
  /** section accordion currently open in the editor */
  openSectionId: string | null;

  setView: (v: View) => void;
  setEditorTab: (t: EditorTab) => void;
  setMobilePane: (p: 'editor' | 'preview') => void;
  setZoom: (z: number, mode?: ZoomMode) => void;
  setZoomMode: (m: ZoomMode) => void;
  toggleTheme: () => void;
  setExportOpen: (v: boolean) => void;
  setSaveAsOpen: (v: boolean) => void;
  setNewOpen: (v: boolean) => void;
  toast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
  ask: (o: ConfirmOptions) => Promise<boolean>;
  closeConfirm: (v: boolean) => void;
  setOpenSection: (id: string | null) => void;
}

const savedZoom = Number(localStorage.getItem('resumeflow:zoom')) || 0;
const savedMode = (localStorage.getItem('resumeflow:zoomMode') as ZoomMode) || 'fitWidth';
// public/theme-init.js sets data-theme before first paint; mirror it here
const initialTheme: Theme =
  document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

export const useUI = create<UIState>((set, get) => ({
  view: 'resumes',
  editorTab: 'content',
  mobilePane: 'editor',
  zoom: savedZoom || 80,
  zoomMode: savedMode,
  theme: initialTheme,
  exportOpen: false,
  saveAsOpen: false,
  newOpen: false,
  toasts: [],
  confirm: null,
  openSectionId: 'personal',

  setView: (view) => set({ view }),
  setEditorTab: (editorTab) => set({ editorTab }),
  setMobilePane: (mobilePane) => set({ mobilePane }),
  setZoom: (z, mode = 'custom') => {
    const zoom = Math.round(Math.min(200, Math.max(25, z)));
    localStorage.setItem('resumeflow:zoom', String(zoom));
    localStorage.setItem('resumeflow:zoomMode', mode);
    set({ zoom, zoomMode: mode });
  },
  setZoomMode: (zoomMode) => {
    localStorage.setItem('resumeflow:zoomMode', zoomMode);
    set({ zoomMode });
  },
  toggleTheme: () => {
    const theme: Theme = get().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1C1C1C' : '#2F5446');
    try {
      localStorage.setItem('resumeflow:theme', theme);
    } catch {
      // storage unavailable (private mode) — theme still applies for this session
    }
    set({ theme });
  },
  setExportOpen: (exportOpen) => set({ exportOpen }),
  setSaveAsOpen: (saveAsOpen) => set({ saveAsOpen }),
  setNewOpen: (newOpen) => set({ newOpen }),
  toast: (message, tone = 'success') => {
    const id = Date.now() + Math.random();
    set({ toasts: [...get().toasts, { id, message, tone }] });
    setTimeout(() => get().dismissToast(id), 3200);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  ask: (o) =>
    new Promise<boolean>((resolve) => {
      set({ confirm: { ...o, resolve } });
    }),
  closeConfirm: (v) => {
    get().confirm?.resolve(v);
    set({ confirm: null });
  },
  setOpenSection: (openSectionId) => set({ openSectionId }),
}));
