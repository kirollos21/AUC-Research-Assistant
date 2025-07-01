"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Search as SearchIcon, Loader2, ExternalLink, Star } from "lucide-react";

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
    } catch {
      setError("An error occurred with the connection.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">
              Academic Research Assistant
            </CardTitle>
            <CardDescription className="text-lg">
              Your AI-powered research partner
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Search Interface */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your research query..."
                  className="pl-10"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="min-w-[120px]"
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
              <div className="mt-4 rounded-md bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {isLoading && status && (
              <div className="mt-4 rounded-md bg-muted p-4">
                <p className="text-sm text-muted-foreground">{status}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {(response || documents.length > 0) && (
          <Tabs defaultValue="response" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="response">AI Response</TabsTrigger>
              <TabsTrigger value="documents">
                Documents ({documents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="response" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5" />
                    <span>AI Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {response ? (
                    <div className="prose max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {response}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No response yet...</p>
                  )}
                  {isLoading && (
                    <div className="mt-4 flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Generating response...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              {documents.length > 0 ? (
                documents.map((doc, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg leading-tight">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {doc.title}
                          </a>
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            Score: {doc.score.toFixed(2)}
                          </Badge>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span><strong>Authors:</strong> {doc.authors}</span>
                        <Separator orientation="vertical" className="h-4" />
                        <span><strong>Year:</strong> {doc.year}</span>
                        <Separator orientation="vertical" className="h-4" />
                        <Badge variant="outline">{doc.source}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="leading-relaxed">{doc.abstract}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No documents found yet...</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
