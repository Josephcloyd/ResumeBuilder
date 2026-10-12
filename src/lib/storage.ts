import { clear as clearStore, createStore, del, get, set, values } from 'idb-keyval';
import type { Resume } from '../types/resume';
import { normalizeResume } from './defaults';

/** Resumes (including images as data URLs) are stored in IndexedDB. */
const resumeStore = createStore('resumeflow-db', 'resumes');
const CURRENT_KEY = 'resumeflow:currentId';

export async function saveResume(r: Resume) {
  await set(r.id, r, resumeStore);
}

export async function loadResume(id: string): Promise<Resume | null> {
  const r = await get<Resume>(id, resumeStore);
  return r ? normalizeResume(r) : null;
}

export async function deleteResume(id: string) {
  await del(id, resumeStore);
}

export async function listResumes(): Promise<Resume[]> {
  const all = await values<Resume>(resumeStore);
  return all.map(normalizeResume).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function clearAllResumeData() {
  await clearStore(resumeStore);
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith('resumeflow:')) localStorage.removeItem(key);
  }
}

/** Small UI config lives in localStorage. */
export const getCurrentId = () => localStorage.getItem(CURRENT_KEY);
export const setCurrentId = (id: string) => localStorage.setItem(CURRENT_KEY, id);

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
