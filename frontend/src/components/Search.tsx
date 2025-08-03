'use client';

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Search as SearchIcon,
  Loader2,
  ExternalLink,
  Star,
  Moon,
  Sun,
} from "lucide-react";
import CitationPreview from "@/components/CitationPreview";

interface Document {
  title: string;
  authors: string;
  year: string;
  source: string;
  url: string;
  abstract: string;
  score: number;
  access?: "open" | "restricted";
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [citationStyle, setCitationStyle] = useState<"APA" | "MLA">("APA");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [accessFilter, setAccessFilter] = useState<"" | "open" | "restricted">("");

  const MAX_DOCS = 10;
  const API_BASE_URL = "http://127.0.0.1:8000/api/v1/query/stream";

  const toggleTheme = () => setIsDarkMode((v) => !v);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError("");
    setResponse("");
    setDocuments([]);
    setStatus("");

    try {
      const payload: any = {
        query: query.trim(),
        max_results: 10,
        top_k: 10,
      };
      if (accessFilter) payload.access_filter = accessFilter;

      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.body) throw new Error("No response body from backend");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let doneReading = false;
      while (!doneReading) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.substring(6));

          switch (data.type) {
            case "status":
              setStatus(data.message);
              break;
            case "documents":
              setDocuments((prev) => [...prev, ...data.documents]);
              break;
            case "response_chunk":
              setResponse((prev) => prev + data.chunk);
              break;
            case "complete":
              setStatus("");
              doneReading = true;
              break;
            case "error":
              setStatus("");
              setError(data.message);
              doneReading = true;
              break;
          }

          if (doneReading) break;
        }
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred with the connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const themeClasses = isDarkMode
    ? {
        background: "bg-slate-950",
        cardBg: "bg-slate-900/90",
        cardBorder: "border-slate-700/50",
        text: "text-slate-100",
        textSecondary: "text-slate-300",
        textMuted: "text-slate-400",
        inputBg: "bg-slate-800",
        inputBorder: "border-slate-600",
        buttonBg: "bg-blue-600 hover:bg-blue-700",
        tabsBg: "bg-slate-800/60",
        tabActive: "data-[state=active]:bg-blue-600",
        errorBg: "bg-red-950/50 border-red-800/50",
        errorText: "text-red-300",
        statusBg: "bg-blue-950/50 border-blue-800/50",
        statusText: "text-blue-300",
        scoreBadge: "bg-blue-600/20 text-blue-300 border-blue-500/30",
        journalBadge: "border-emerald-500/30 text-emerald-300 bg-emerald-500/10",
      }
    : {
        background: "bg-gray-50",
        cardBg: "bg-white",
        cardBorder: "border-gray-200",
        text: "text-gray-900",
        textSecondary: "text-gray-700",
        textMuted: "text-gray-500",
        inputBg: "bg-white",
        inputBorder: "border-gray-300",
        buttonBg: "bg-blue-600 hover:bg-blue-700",
        tabsBg: "bg-gray-100",
        tabActive:
          "data-[state=active]:bg-blue-600 data-[state=active]:text-white",
        errorBg: "bg-red-50 border-red-200",
        errorText: "text-red-700",
        statusBg: "bg-blue-50 border-blue-200",
        statusText: "text-blue-700",
        scoreBadge: "bg-blue-100 text-blue-700 border-blue-300",
        journalBadge: "border-emerald-300 text-emerald-700 bg-emerald-50",
      };

  return (
    <div className={`min-h-screen ${themeClasses.background} p-4 transition-colors duration-300`}>
      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-lg`}>
          <CardHeader className="text-center py-8 relative">
            <Button
              onClick={toggleTheme}
              size="sm"
              variant="default"
              className={`absolute top-4 right-4 border ${
                isDarkMode ? "border-white text-white hover:bg-white/10" : themeClasses.cardBorder
              }`}
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-white" /> : <Moon className="h-4 w-4" />}
            </Button>

            <CardTitle className={`text-4xl font-bold ${themeClasses.text}`}>
              Academic Research Assistant
            </CardTitle>
            <CardDescription className={`text-lg ${themeClasses.textSecondary} mt-2`}>
              Your AI-powered research partner
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Search */}
        <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-lg hover:shadow-xl transition-all duration-300`}>
          <CardContent className="pt-8 pb-6">
            <div className="flex space-x-3">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-500" />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your research query..."
                  className={`pl-12 h-12 ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text} placeholder:${themeClasses.textMuted} focus:border-blue-500 focus:ring-blue-500/20 text-base`}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>

              {/* Access filter */}
              <select
                value={accessFilter}
                onChange={(e) =>
                  setAccessFilter(e.target.value as "" | "open" | "restricted")
                }
                className={`h-12 rounded-md px-3 ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text}`}
                title="Filter by access"
              >
                <option value="">All</option>
                <option value="open">Open access</option>
                <option value="restricted">Restricted</option>
              </select>

              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className={`min-w-[140px] h-12 ${themeClasses.buttonBg} text-white font-semibold shadow-lg transition-all duration-300`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className={`mt-4 rounded-lg ${themeClasses.errorBg} p-4`}>
                <p className={`text-sm ${themeClasses.errorText}`}>{error}</p>
              </div>
            )}

            {status && (
              <div className={`mt-4 rounded-lg ${themeClasses.statusBg} p-4`}>
                <p className={`text-sm ${themeClasses.statusText} flex items-center`}>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {status}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {(response || documents.length > 0) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <Tabs defaultValue="response" className="flex-1">
                <TabsList className={`${themeClasses.tabsBg} ${themeClasses.cardBorder} p-1 h-auto`}>
                  <TabsTrigger value="response" className={`${themeClasses.tabActive} ${themeClasses.textSecondary} px-6 py-3 font-medium transition-all duration-200`}>
                    🤖 AI Response
                  </TabsTrigger>
                  <TabsTrigger value="documents" className={`${themeClasses.tabActive} ${themeClasses.textSecondary} px-6 py-3 font-medium transition-all duration-200`}>
                    📄 Documents ({Math.min(documents.length, MAX_DOCS)})
                  </TabsTrigger>
                </TabsList>

                {/* Citation style selector */}
                <div className="flex items-center space-x-3 mt-4">
                  <span className={`${themeClasses.textMuted} text-sm font-medium`}>Citation style:</span>
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value as "APA" | "MLA")}
                    className={`${themeClasses.inputBg} ${themeClasses.inputBorder} rounded-lg px-3 py-2 ${themeClasses.text} text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                  >
                    <option value="APA">APA</option>
                    <option value="MLA">MLA</option>
                  </select>
                </div>

                {/* AI response */}
                <TabsContent value="response" className="space-y-4 mt-6">
                  <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-lg`}>
                    <CardHeader className={`${themeClasses.cardBorder} border-b`}>
                      <CardTitle className="flex items-center space-x-3 text-blue-600">
                        <Star className="h-5 w-5" />
                        <span>AI Analysis</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {response ? (
                        <div className={`prose ${isDarkMode ? "prose-invert" : ""} prose-blue max-w-none ${themeClasses.textSecondary}`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {response}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className={themeClasses.textMuted}>No response yet...</p>
                      )}
                      {isLoading && (
                        <div className="mt-4 flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          <span className="text-sm text-blue-600">Generating response...</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Documents */}
                <TabsContent value="documents" className="space-y-4 mt-6">
                  {documents.length > 0 ? (
                    documents.map((doc, index) => (
                      <Card key={index} className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-lg hover:shadow-xl hover:border-blue-300 transition-all duration-300 group`}>
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between gap-4">
                            <CardTitle className={`text-lg leading-tight ${themeClasses.text} group-hover:text-blue-600 transition-colors`}>
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {doc.title}
                              </a>
                            </CardTitle>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <Badge className={`${themeClasses.scoreBadge} hover:bg-blue-600/30`}>
                                Score: {doc.score.toFixed(2)}
                              </Badge>

                              {doc.access && (
                                <Badge
                                  variant="outline"
                                  className={
                                    doc.access === "open"
                                      ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                                      : "border-amber-500/40 text-amber-300 bg-amber-500/10"
                                  }
                                  title={doc.access === "open" ? "Open access" : "Restricted"}
                                >
                                  {doc.access === "open" ? "Open access" : "Restricted"}
                                </Badge>
                              )}

                              <Button variant="outline" size="sm" asChild className={`${themeClasses.cardBorder} hover:border-blue-500 hover:bg-blue-500/10`}>
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className={`h-3 w-3 ${themeClasses.textMuted}`} />
                                </a>
                              </Button>
                            </div>
                          </div>

                          <div className={`flex flex-wrap gap-3 text-sm ${themeClasses.textMuted} mt-3`}>
                            <span>
                              <strong className={themeClasses.textSecondary}>Authors:</strong> {doc.authors}
                            </span>
                            <Separator orientation="vertical" className={`h-4 ${isDarkMode ? "bg-slate-600" : "bg-gray-300"}`} />
                            <span>
                              <strong className={themeClasses.textSecondary}>Year:</strong> {doc.year}
                            </span>
                            <Badge variant="outline" className={themeClasses.journalBadge}>
                              {doc.source}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          <p className={`leading-relaxed ${themeClasses.textSecondary}`}>{doc.abstract}</p>
                        </CardContent>

                        <CitationPreview
                          authors={doc.authors}
                          title={doc.title}
                          year={doc.year || "n.d."}
                          source={doc.source}
                          url={doc.url}
                          style={citationStyle}
                          mode={isDarkMode ? "dark" : "light"}
                        />
                      </Card>
                    ))
                  ) : (
                    <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-lg`}>
                      <CardContent className="pt-6">
                        <p className={`text-center ${themeClasses.textMuted}`}>No documents found yet...</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
