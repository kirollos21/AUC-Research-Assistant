"use client";

import { useState, useEffect } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import "./Search.css";

interface Document {
  title: string;
  authors: string;
  year: string;
  source: string;
  url: string;
  abstract: string;
  score: number;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE_URL = "http://localhost:8000/api/v1/query/stream";

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError("");
    setResponse("");
    setDocuments([]);
    setStatus("");

    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setIsLoading(false);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.substring(6));
            switch (data.type) {
              case "status":
                setStatus(data.message);
                break;
              case "queries":
                // Ignore
                break;
              case "documents":
                setDocuments(data.documents);
                break;
              case "response_chunk":
                setResponse((prev) => prev + data.chunk);
                break;
              case "complete":
                setIsLoading(false);
                break;
              case "error":
                setError(data.message);
                setIsLoading(false);
                break;
            }
          }
        }
      }
    } catch (err) {
      setError("An error occurred with the connection.");
      setIsLoading(false);
    }
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <h1 className="search-title">Academic Research Assistant</h1>
        <p className="search-subtitle">
          Your AI-powered research partner
        </p>
      </div>

      <div className="search-interface">
        <div className="search-input-container">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your research query..."
            className="search-input"
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="search-btn primary"
            disabled={isLoading}
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {isLoading && status && (
          <div className="status-message">
            <p>{status}</p>
          </div>
        )}
      </div>

      <Tabs>
        <TabList>
          <Tab>Response</Tab>
          <Tab>Documents</Tab>
        </TabList>

        <TabPanel>
          <div className="response-panel">
            <pre>{response}</pre>
            {isLoading && <span className="cursor"></span>}
          </div>
        </TabPanel>
        <TabPanel>
          <div className="documents-panel">
            {documents.map((doc, index) => (
              <div key={index} className="document-card">
                <h4>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    {doc.title}
                  </a>
                </h4>
                <p>
                  <strong>Authors:</strong> {doc.authors}
                </p>
                <p>
                  <strong>Year:</strong> {doc.year}
                </p>
                <p>
                  <strong>Source:</strong> {doc.source}
                </p>
                <p>
                  <strong>Score:</strong> {doc.score}
                </p>
                <p>{doc.abstract}</p>
              </div>
            ))}
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
