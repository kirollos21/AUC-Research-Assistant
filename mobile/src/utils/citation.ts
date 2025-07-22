import { DocumentResult } from '@/types';

export const citationFormats = {
  APA: (doc: DocumentResult): string => {
    const authors = doc.authors || 'Unknown Authors';
    const year = doc.year || 'n.d.';
    const title = doc.title || 'Unknown Title';
    const source = doc.source || 'Unknown Source';
    const url = doc.url || '';

    return `${authors}. (${year}). ${title}. ${source}. ${url}`;
  },

  MLA: (doc: DocumentResult): string => {
    const authors = doc.authors || 'Unknown Authors';
    const title = doc.title || 'Unknown Title';
    const source = doc.source || 'Unknown Source';
    const year = doc.year || 'n.d.';
    const url = doc.url || '';

    return `${authors}. "${title}." ${source}, ${year}, ${url}.`;
  },
};

export const generateCitation = (doc: DocumentResult, style: 'APA' | 'MLA'): string => {
  return citationFormats[style](doc);
}; 