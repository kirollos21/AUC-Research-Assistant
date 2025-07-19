'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';

interface CitationPreviewProps {
  style: 'APA' | 'MLA';
  authors: string;
  title: string;
  year: string;
  source: string;
  url: string;
}

function formatAuthorsForAPA(authors: string): string {
  // APA format: Last, Initials - "First Middle Last" -> "Last, F. M."
  return authors.split(', ').map(author => {
    const nameParts = author.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0]; // Single name, return as is
    }
    
    const lastName = nameParts[nameParts.length - 1];
    const initials = nameParts.slice(0, -1).map(part => part.charAt(0) + '.').join(' ');
    return `${lastName}, ${initials}`;
  }).join(', ');
}

function formatAuthorsForMLA(authors: string): string {
  // MLA format: First author "Last, First", other authors "First Last"
  const authorList = authors.split(', ');
  if (authorList.length === 0) return '';
  if (authorList.length === 1) return authorList[0];
  
  const firstAuthor = authorList[0];
  const otherAuthors = authorList.slice(1);
  
  // Format first author as "Last, First"
  const firstAuthorParts = firstAuthor.trim().split(' ');
  const firstAuthorFormatted = firstAuthorParts.length > 1 
    ? `${firstAuthorParts[firstAuthorParts.length - 1]}, ${firstAuthorParts.slice(0, -1).join(' ')}`
    : firstAuthor;
  
  // Other authors remain as "First Last"
  const otherAuthorsFormatted = otherAuthors.join(', ');
  
  return `${firstAuthorFormatted}, ${otherAuthorsFormatted}`;
}

function formatAPA(authors: string, title: string, year: string, source: string, url: string) {
  // APA format: Author, A. A., Author, B. B., & Author, C. C. (Year). Title of work. Source. URL
  const apaAuthors = formatAuthorsForAPA(authors);
  return `${apaAuthors} (${year}). ${title}. ${source}. ${url}`;
}

function formatMLA(authors: string, title: string, year: string, source: string, url: string) {
  // MLA format: Author, A. A., Author, B. B., and Author, C. C. "Title of Work." Source, Year, URL.
  const mlaAuthors = formatAuthorsForMLA(authors);
  return `${mlaAuthors}. "${title}." ${source}, ${year}, ${url}.`;
}

export default function CitationPreview({
  style,
  authors,
  title,
  year,
  source,
  url,
}: CitationPreviewProps) {
  const text = style === 'APA'
    ? formatAPA(authors, title, year, source, url)
    : formatMLA(authors, title, year, source, url);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-start space-x-2">
      <div className="flex-1">
        <span className="font-medium">Citation ({style}):</span>
        <p className="text-sm text-gray-700 mt-1">{text}</p>
      </div>
      <button onClick={handleCopy} className="p-1 hover:bg-gray-200 rounded">
        <Copy className="h-5 w-5 text-gray-600" />
      </button>
      {copied && <span className="text-sm text-green-600">Copied!</span>}
    </div>
  );
}
