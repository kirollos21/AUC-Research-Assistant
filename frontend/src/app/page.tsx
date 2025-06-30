"use client";

import { useState } from "react";
import axios from "axios";
import "./page.css";

interface Author {
  name: string;
  affiliation?: string | null;
  orcid?: string | null;
}

// Define the paper type
interface Paper {
  id: string;
  title: string;
  abstract: string;
  authors: Author[];
  publication_date: string;
  url?: string;
  doi?: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [messageBox, setMessageBox] = useState<{
    show: boolean;
    type: string;
    content: any[];
  }>({
    show: false,
    type: "",
    content: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // API Base URL - Update this to match your backend URL
  const API_BASE_URL = "http://localhost:8000/api/v1/search/"; // Change this to your actual API URL

  // Ready-made test queries
  const testQueries = [
    "machine learning in healthcare",
    "climate change mitigation strategies",
    "quantum computing applications",
    "neural networks for natural language processing",
    "renewable energy storage solutions",
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}search_arxiv?s=${encodeURIComponent(query.trim())}`
      );
      console.log(response.data);

      setMessageBox({
        show: true,
        type: "search",
        content: (response.data as Paper[]) || [],
      });
    } catch (err) {
      console.error("Search API error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandQuery = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}query/expand?query=${encodeURIComponent(query.trim())}`
      );
      console.log(response.data);

      setMessageBox({
        show: true,
        type: "expand",
        content: response.data.expanded_queries || response.data || [],
      });
    } catch (err) {
      console.error("Expand API error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestQuery = (testQuery: string): void => {
    setQuery(testQuery);
    setMessageBox({ show: false, type: "", content: [] });
    setError("");
  };

  const closeMessageBox = () => {
    setMessageBox({ show: false, type: "", content: [] });
    setError("");
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <h1 className="search-title">Academic Research Assistant</h1>
        <p className="search-subtitle">
          Discover and expand your research queries
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
          <div className="search-buttons">
            <button
              onClick={handleSearch}
              className="search-btn primary"
              disabled={isLoading}
            >
              {isLoading && messageBox.type === "search"
                ? "Searching..."
                : "Search Papers"}
            </button>
            <button
              onClick={handleExpandQuery}
              className="search-btn secondary"
              disabled={isLoading}
            >
              {isLoading && messageBox.type === "expand"
                ? "Expanding..."
                : "Expand Query"}
            </button>
          </div>
        </div>

        <div className="test-queries">
          <h3>Try these sample queries:</h3>
          <div className="query-chips">
            {testQueries.map((testQuery, index) => (
              <button
                key={index}
                onClick={() => handleTestQuery(testQuery)}
                className="query-chip"
              >
                {testQuery}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
      </div>

      {messageBox.show && (
        <div className="message-box-overlay">
          <div className="message-box">
            <div className="message-header">
              <h3>
                {messageBox.type === "search"
                  ? "Search Results"
                  : "Expanded Queries"}
              </h3>
              <button onClick={closeMessageBox} className="close-btn">
                ×
              </button>
            </div>

            <div className="message-content">
              {messageBox.type === "expand" ? (
                <ul className="expanded-queries">
                  {messageBox.content.map((item, index) => (
                    <li key={index} className="query-item">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="papers-list">
                  {Array.isArray(messageBox.content) &&
                    messageBox.content.map((paper, index) => {
                      const authors =
                        paper.authors?.map((a: Author) => a.name).join(", ") ||
                        "Unknown Authors";

                      const year = paper.publication_date
                        ? new Date(paper.publication_date).getFullYear()
                        : "N/A";
                      const abstractSnippet =
                        paper.abstract?.slice(0, 150) + "...";

                      return (
                        <div key={index} className="paper-card">
                          <h4 className="paper-title">{paper.title}</h4>
                          <p className="paper-abstract">{abstractSnippet}</p>
                          <p className="paper-authors">
                            <strong>By:</strong> {authors} <span>({year})</span>
                          </p>
                          {paper.url && (
                            <a
                              href={paper.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="paper-link"
                            >
                              View Paper
                            </a>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}
