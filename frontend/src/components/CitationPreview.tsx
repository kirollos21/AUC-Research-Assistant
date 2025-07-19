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

function formatAPA(authors: string, title: string, year: string, source: string, url: string) {
  return `${authors} (${year}). ${title}. ${source}. ${url}`;
}

function formatMLA(authors: string, title: string, year: string, source: string, url: string) {
  return `${authors}. "${title}." ${source}, ${year}. ${url}.`;
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
