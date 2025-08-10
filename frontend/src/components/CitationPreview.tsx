"use client";

import { useState } from "react";
import { Copy, ChevronDown, ChevronUp } from "lucide-react";

interface CitationPreviewProps {
  style: "APA" | "MLA";
  authors: string;
  title: string;
  year: string;
  source: string;
  url: string;
  mode?: "light" | "dark";
}

function formatAuthorsForAPA(authors: string): string {
  return authors
    .split(", ")
    .map((author) => {
      const nameParts = author.trim().split(" ");
      if (nameParts.length === 1) return nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      const initials = nameParts
        .slice(0, -1)
        .map((part) => part.charAt(0) + ".")
        .join(" ");
      return `${lastName}, ${initials}`;
    })
    .join(", ");
}

function formatAuthorsForMLA(authors: string): string {
  const authorList = authors.split(", ");
  if (authorList.length === 0) return "";
  if (authorList.length === 1) return authorList[0];

  const firstAuthor = authorList[0];
  const otherAuthors = authorList.slice(1);
  const parts = firstAuthor.trim().split(" ");
  const formattedFirst =
    parts.length > 1
      ? `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(" ")}`
      : firstAuthor;

  return `${formattedFirst}, ${otherAuthors.join(", ")}`;
}

function formatAPA(
  authors: string,
  title: string,
  year: string,
  source: string,
  url: string
) {
  const apaAuthors = formatAuthorsForAPA(authors);
  return `${apaAuthors} (${year}). ${title}. ${source}. ${url}`;
}

function formatMLA(
  authors: string,
  title: string,
  year: string,
  source: string,
  url: string
) {
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
  mode = "light", // default to light
}: CitationPreviewProps) {
  const text =
    style === "APA"
      ? formatAPA(authors, title, year, source, url)
      : formatMLA(authors, title, year, source, url);

  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const bgColor = mode === "dark" ? "bg-gray-800" : "bg-white";
  const borderColor = mode === "dark" ? "border-gray-700" : "border-gray-200";
  const textColor = mode === "dark" ? "text-white" : "text-gray-900";
  const citationTextColor = mode === "dark" ? "text-gray-300" : "text-gray-700";
  const hoverCopyBg =
    mode === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200";
  const iconColor = mode === "dark" ? "text-gray-300" : "text-gray-600";
  const copiedColor = mode === "dark" ? "text-green-400" : "text-green-600";

  return (
    <div className={`mt-4 p-4 rounded-lg border ${bgColor} ${borderColor}`}>
      {/* Header */}
      <div
        className={`flex justify-between items-center cursor-pointer ${textColor}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium">Citation ({style})</span>
        {isOpen ? (
          <ChevronUp className={`w-4 h-4 ${iconColor}`} />
        ) : (
          <ChevronDown className={`w-4 h-4 ${iconColor}`} />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="mt-2 flex items-start space-x-2">
          <p className={`text-sm flex-1 ${citationTextColor}`}>{text}</p>
          <button onClick={handleCopy} className={`p-1 rounded ${hoverCopyBg}`}>
            <Copy className={`h-5 w-5 ${iconColor}`} />
          </button>
          {copied && <span className={`text-sm ${copiedColor}`}>Copied!</span>}
        </div>
      )}
    </div>
  );
}
