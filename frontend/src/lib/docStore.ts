// lib/docStore.ts
export interface Document {
  id: string;          // uuid or paper-id
  title: string;
  authors: string[];
  url: string;
}

const KEY = "docs-v1";

/* read – browser only */
export function loadDocs(): Document[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

/* write */
export function saveDocs(docs: Document[]) {
  localStorage.setItem(KEY, JSON.stringify(docs));
}
