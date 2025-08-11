'use client';

import { v4 as uuid } from "uuid";
import Link from "next/link";
import { loadDocs, saveDocs } from "@/lib/docStore";   // ★ new
import { loadChats, saveChats, Chat } from "@/lib/chatStore";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

export default function Search({
  initialMessages = [{ role: "system", content: "You are an academic assistant" }],
  initialDocuments = [],
  chatId = null,
}: {
  initialMessages?: { role: "user" | "assistant" | "system"; content: string }[];
  initialDocuments?: any[];
  chatId?: string | null;
}) {
// ─── page-level state ────────────────────────────────────────────
const [query,         setQuery]         = useState("");
const [response,      setResponse]      = useState("");
const [status,        setStatus]        = useState("");
const [error,         setError]         = useState("");
const [isLoading,     setIsLoading]     = useState(false);

const [documents,     setDocuments]     = useState<Document[]>(initialDocuments);
const [messages,      setMessages]      = useState(initialMessages);

const [citationStyle, setCitationStyle] = useState<"APA" | "MLA">("APA");
const [isDarkMode,    setIsDarkMode]    = useState(true);

// const [accessFilter,  setAccessFilter]  = useState<"" | "open" | "restricted">("");
// const [yearMin,       setYearMin]       = useState<number | "">("");
// const [yearMax,       setYearMax]       = useState<number | "">("");

const [chats,         setChats]         = useState<Chat[]>([]);   // will load later
const [activeId,      setActiveId]      = useState<string | null>(chatId);
const [composer, setComposer] = useState("");      // new message box
const taRef = useRef<HTMLTextAreaElement | null>(null);
const router = useRouter();
//const [autoApply, setAutoApply] = useState(true);         // auto-run filters
const hasUserAsked = messages.some(m => m.role === "user"); // did we ask anything yet?
const lastQueryRef = useRef<string>("");
const filterKey = `filters:${chatId ?? "home"}`;
const [isApplying, setIsApplying] = useState(false);
const [sidebarOpen, setSidebarOpen] = useState(true);
// ────────────────────────────────────────────────────────────────
const deleteChat = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();      // don't trigger the Link
  e.stopPropagation();     // don't bubble to the row

  const isDeletingActive = activeId === id;

  const next = chats.filter(x => x.id !== id);
  setChats(next);
  saveChats(next);

  // if we deleted the chat we're viewing, reset and go home
  if (isDeletingActive) {
    setActiveId(null);
    setMessages([{ role: "system", content: "You are an academic assistant" }]);
    setDocuments([]);
    setComposer("");
    setTimeout(() => router.replace("/"), 0); // defer navigation to avoid the Router warning
  }
};


function pruneEmptyChats(list: Chat[]) {
  // keep chats that have at least one non-system message
  return list.filter(c => (c.messages || []).some(m => m.role !== "system"));
}

function makeBlankState() {
  return [{ role: "system", content: "You are an academic assistant" }];
}


useEffect(() => {
  const all = loadChats();
  const cleaned = pruneEmptyChats(all);
  if (cleaned.length !== all.length) saveChats(cleaned);
  setChats(cleaned);
}, []);


useEffect(() => {
  if (chatId) {
    const all = loadChats();
    const c = all.find((x) => x.id === chatId) || null;
    setMessages(c?.messages ?? initialMessages);
    setDocuments(c?.documents ?? initialDocuments);
  } else {
    // brand new chat (no id yet)
    setMessages(initialMessages);
    setDocuments([]);
  }
  setActiveId(chatId ?? null);
  setResponse("");
  setStatus("");
  setComposer("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [chatId]);


  const MAX_DOCS = 10;
  const API_BASE_URL = "http://127.0.0.1:8000/v1/chat/completions";

// namespaced localStorage keys (per chat)
const scope = chatId ?? "home";
const LS = {
  access: `ra_access:${scope}`,
  yMin:   `ra_ymin:${scope}`,
  yMax:   `ra_ymax:${scope}`,
  auto:   `ra_auto:${scope}`,
};
const RESTORE_AUTO_ON_LOAD = false; // keep OFF when you return (set true if you prefer)

const [accessFilter, setAccessFilter] = useState<"" | "open" | "restricted">(() => {
  if (typeof window === "undefined") return "";
  const v = localStorage.getItem(LS.access);
  return v === "open" || v === "restricted" ? v : "";
});

const [yearMin, setYearMin] = useState<number | "">(() => {
  if (typeof window === "undefined") return "";
  const v = localStorage.getItem(LS.yMin);
  return v === null || v === "" ? "" : Number(v);
});

const [yearMax, setYearMax] = useState<number | "">(() => {
  if (typeof window === "undefined") return "";
  const v = localStorage.getItem(LS.yMax);
  return v === null || v === "" ? "" : Number(v);
});

const [autoApply, setAutoApply] = useState<boolean>(() => {
  if (typeof window === "undefined") return false;
  if (!RESTORE_AUTO_ON_LOAD) return false;            // come back with it OFF
  const v = localStorage.getItem(LS.auto);
  return v ? JSON.parse(v) : true;
});

// Persist filters (ADD THIS)
useEffect(() => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS.access, accessFilter);
  localStorage.setItem(LS.yMin,   yearMin === "" ? "" : String(yearMin));
  localStorage.setItem(LS.yMax,   yearMax === "" ? "" : String(yearMax));

}, [chatId, accessFilter, yearMin, yearMax]);

// Persist auto-apply (ADD THIS)
useEffect(() => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS.auto, JSON.stringify(autoApply));

}, [chatId, autoApply]);

useEffect(() => {
  if (!autoApply) return;
  if (!hasUserAsked) return;
  const t = setTimeout(() => { refreshDocs(); }, 600);
  return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [accessFilter, yearMin, yearMax, autoApply, hasUserAsked]);

useEffect(() => {
  if (typeof window === "undefined") return;
  const s = chatId ?? "home";

  const vAccess = localStorage.getItem(`ra_access:${s}`);
  setAccessFilter(vAccess === "open" || vAccess === "restricted" ? vAccess : "");

  const vMin = localStorage.getItem(`ra_ymin:${s}`);
  setYearMin(vMin === null || vMin === "" ? "" : Number(vMin));

  const vMax = localStorage.getItem(`ra_ymax:${s}`);
  setYearMax(vMax === null || vMax === "" ? "" : Number(vMax));

  if (RESTORE_AUTO_ON_LOAD) {
    const vAuto = localStorage.getItem(`ra_auto:${s}`);
    setAutoApply(vAuto ? JSON.parse(vAuto) : true);
  } else {
    setAutoApply(false);
  }
}, [chatId]);

  const toggleTheme = () => setIsDarkMode((v) => !v);

  const handleSend = async (forcedPrompt?: string) => {
  const text = composer.trim();
  if (!text) return;
  lastQueryRef.current = text;

  setIsLoading(true);
  setError("");
  setResponse("");
  setStatus("");
  let assistantText = "";
  let latestDocs: Document[] = []; // ← track docs from the stream

  try {
    // push user message
    const newMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setComposer(""); // clear box

    // build request
    const payload: any = {
      model: "gpt-3.5-turbo",
      messages: newMessages,
      stream: true,
      stream_events: true,
      max_results: 10,
      top_k: 10,
    };
    if (accessFilter) payload.access_filter = accessFilter;
    if (yearMin !== "") payload.year_min = yearMin;
    if (yearMax !== "") payload.year_max = yearMax;

    const res = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.body) throw new Error("No response body from backend");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const frames = buffer.split("\n\n");
      buffer = frames.pop()!;

      for (const f of frames) {
        if (!f.startsWith("data: ")) continue;
        const json = f.slice(6).trim();
        if (json === "[DONE]") {
          setStatus("");
          break;
        }
        const chunk = JSON.parse(json);
        const delta = chunk.choices[0].delta;

        // assistant text (stream)
        if (delta.content && !delta.content.startsWith("<event>")) {
          assistantText += delta.content;
          setResponse(assistantText);  // still shows the live bubble
        }

        // events: status / documents
        if (delta.content?.startsWith("<event>")) {
          const inner = delta.content.slice(7, -8);
          const trimmed = inner.trim();
            if (trimmed.startsWith("documents:")) {
              const docsJson = trimmed.replace(/^documents:\s*/i, "");
              try {
                const newDocs: Document[] = JSON.parse(docsJson);
                latestDocs = newDocs;          // ← keep for saving later
                setDocuments(newDocs);         // update UI tab count
                const merged = [...loadDocs(), ...newDocs].slice(-50);
                saveDocs(merged);
              } catch (e) {
                console.warn("Failed to parse documents payload:", docsJson, e);
              }
            } else {
              setStatus(trimmed.replace(/<[^>]+>/g, ""));
            }
        }
      }
    }

    // finished streaming -> persist assistant message and chat
    const assistantMsg = { role: "assistant" as const, content: assistantText };
    const fullThread   = [...newMessages, assistantMsg];

    /* if docs streaming happened, prefer those; else use state */
    const docsToSave = latestDocs.length ? latestDocs : documents;

    /* make a nice title from THIS user message */
    const makeTitle = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 60);
    const proposedTitle = makeTitle(text || "untitled");

    let updated: Chat[];
    if (activeId) {
      // update existing chat; rename only if still "untitled"
      updated = chats.map((c) => {
        if (c.id !== activeId) return c;
        const shouldRename =
          !c.title ||
          c.title.toLowerCase().startsWith("untitled");

        return {
          ...c,
          title: shouldRename ? proposedTitle : c.title,
          messages: fullThread,
          documents: docsToSave,
        };
      });
    } else {
      // first message creates the chat with a proper title
      const title = proposedTitle || "untitled";
      const newChat = { id: uuid(), title, messages: fullThread, documents: docsToSave };
      updated = [newChat, ...chats].slice(0, 20);
      setActiveId(newChat.id);
      router.push(`/chat/${newChat.id}`);
    }

    setChats(updated);
    saveChats(updated);

    setMessages(fullThread);
    setResponse("");

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
      cardBorder: "border-slate-800/60",
      text: "text-slate-100",
      textSecondary: "text-slate-200",
      textMuted: "text-slate-400",
      inputBg: "bg-slate-800",
      inputBorder: "border-slate-700",

      // Buttons / Tabs
      buttonBg: "bg-blue-600 hover:bg-blue-700",
      tabsBg:
        "bg-slate-800/70 rounded-xl ring-1 ring-slate-700 shadow-sm", // pill container
      tabActive:
        "data-[state=active]:bg-blue-600 data-[state=active]:text-white shadow", // active pill

      // Alerts
      errorBg: "bg-red-950/50 border-red-900/50",
      errorText: "text-red-300",
      statusBg: "bg-blue-950/50 border-blue-900/50",
      statusText: "text-blue-300",

      // Badges
      scoreBadge: "bg-blue-600/15 text-blue-300 border-blue-500/30",
      journalBadge: "border-emerald-500/30 text-emerald-300 bg-emerald-500/10",

      // Outline-style buttons & small pills
      buttonOutline:
        "bg-slate-800/40 text-slate-200 border-slate-700 hover:bg-slate-800/70 shadow-sm",
      pill: "bg-slate-800/60 text-slate-200 border border-slate-700/60",
    }
    :  {
          background: "bg-gray-100",
          cardBg: "bg-white",
          cardBorder: "border-gray-300",              // (kept for dark use below)
          text: "text-gray-900",
          textSecondary: "text-gray-800",
          textMuted: "text-gray-600",

          // make inputs & pills readable without harsh borders
          inputBg: "bg-gray-50",                       // was bg-white
          inputBorder: "border-gray-300",

          // buttons/tabs/slabs
          buttonBg: "bg-blue-600 hover:bg-blue-700",
          tabsBg: "bg-white/80 shadow-sm",             // subtle elevation instead of border
          tabActive: "data-[state=active]:bg-blue-600 data-[state=active]:text-white",

          errorBg: "bg-red-50",
          errorText: "text-red-700",
          statusBg: "bg-blue-50",
          statusText: "text-blue-700",

          scoreBadge: "bg-blue-50 text-blue-700",
          journalBadge: "bg-emerald-50 text-emerald-700",

          // NEW: gentle elevation helpers (used below)
          fieldShadow: "shadow-sm",                    // for inputs/textareas
          pill: "bg-white shadow-sm",                  // for small “chips” like conversation mode
          buttonOutline: "border-gray-300 text-gray-700 hover:bg-gray-100",
        }

  function Bubble({
  role,
  children,
  theme,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
  theme: typeof themeClasses;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 border ${
          isUser
            ? "bg-blue-600 text-white border-blue-500"
            : `${theme.cardBg} ${theme.cardBorder} ${theme.textSecondary}`
        }`}
      >
        {children}
      </div>
    </div>
  );
}
// Updates the Documents list using current filters WITHOUT adding a new message.
async function refreshDocs() {
  if (!hasUserAsked) return; // nothing to refresh if you haven't asked yet

  setError("");
  setStatus("Updating results…");
  setIsApplying(true);
  let latestDocs: Document[] = [];

  try {
    const payload: any = {
      model: "gpt-3.5-turbo",
      messages,                 // reuse existing thread
      stream: true,
      stream_events: true,
      max_results: 10,
      top_k: 10,
    };
    if (accessFilter) payload.access_filter = accessFilter;
    if (yearMin !== "") payload.year_min = yearMin;
    if (yearMax !== "") payload.year_max = yearMax;

    const res = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.body) throw new Error("No response body from backend");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop()!;

      for (const f of frames) {
        if (!f.startsWith("data: ")) continue;
        const json = f.slice(6).trim();
        if (json === "[DONE]") break;

        const chunk = JSON.parse(json);
        const delta = chunk.choices?.[0]?.delta;

        if (delta?.content?.startsWith("<event>")) {
          const inner = delta.content.slice(7, -8).trim();
          if (inner.startsWith("documents:")) {
            const docsJson = inner.replace(/^documents:\s*/i, "");
            try {
              const newDocs: Document[] = JSON.parse(docsJson);
              latestDocs = newDocs;
              setDocuments(newDocs);

              const merged = [...loadDocs(), ...newDocs].slice(-50);
              saveDocs(merged);
            } catch (e) {
              console.warn("Failed to parse documents payload:", docsJson, e);
            }
          } else {
            setStatus(inner.replace(/<[^>]+>/g, ""));
          }
        }
      }
    }

    if (activeId && latestDocs.length) {
      const updated = loadChats().map(c =>
        c.id === activeId ? { ...c, documents: latestDocs } : c
      );
      saveChats(updated);
      setChats(updated);
    }
  } catch (err) {
    console.error(err);
    setError("Could not update results for the current filters.");
  } finally {
    setStatus("");
    setIsApplying(false);
  }
}

  return (
      <>
    {/* Sidebar – style only */}
    <aside
      className={[
        "fixed inset-y-0 left-0 z-50 hidden md:flex w-[260px] flex-col",
        "bg-gradient-to-b from-slate-950 to-slate-900 border-r border-slate-800/60",
        "transition-all duration-500 ease-in-out will-change-transform will-change-opacity",
        sidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none",
      ].join(" ")}
    >
    <div className="px-3 pt-4 pb-2 flex items-center justify-between">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        recent chats
      </div>

      <button
        aria-label="Collapse sidebar"
        onClick={() => setSidebarOpen(false)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full
                   border border-slate-700/60 bg-slate-800/70 text-slate-200
                   hover:bg-slate-700"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
    <nav className="flex-1 overflow-y-auto px-2 slim-scrollbar">
      {chats.map((c) => {
        const isActive = activeId === c.id;

        return (
        <div
          key={c.id}
          className={[
            "group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
            isActive
              ? "bg-slate-800/80 text-white shadow-inner"
              : "text-slate-300 hover:bg-slate-800/50 hover:text-slate-100",
          ].join(" ")}
        >
          {/* Left: link area */}
          <Link href={`/chat/${c.id}`} className="min-w-0 flex items-center gap-2 flex-1">
            <MessageSquare
              className={[
                "h-4 w-4 shrink-0",
                isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300",
              ].join(" ")}
            />
            <span className="truncate">{c.title || "untitled"}</span>
          </Link>
          {/* Right: controls */}
          <div className="ml-2 flex items-center gap-2">
            {!!(c.documents?.length) && (
              <span className="rounded-full bg-slate-800/80 border border-slate-700 px-2 py-0.5 text-[10px] leading-4 text-slate-300">
                {Math.min(c.documents.length, 99)}
              </span>
            )}
            <button
              aria-label={`Delete "${c.title || "chat"}"`}
              onClick={deleteChat(c.id)}
              className="shrink-0 p-2 rounded-md opacity-80 hover:opacity-100 hover:bg-slate-700 focus:bg-slate-700 focus:outline-none"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        );
      })}
    </nav>
      {/* Optional: a visual New Chat button in the sidebar that reuses your header logic */}
      <div className="p-2 border-t border-slate-800/60">
        <button
          type="button"
          onClick={() => {
            const btn = document.querySelector<HTMLButtonElement>('button[data-new-chat]');
            btn?.click();
          }}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg
                     bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 shadow"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
      </div>
    </aside>

    {!sidebarOpen && (
      <button
        aria-label="Expand sidebar"
        onClick={() => setSidebarOpen(true)}
        className={[
          // position (slightly higher than before)
          "fixed left-3 top-2 z-[60]",
          // only show on md+ (matches sidebar)
          "hidden md:flex h-9 w-9 items-center justify-center",
          // style
          "rounded-full border border-slate-700/60 bg-slate-900/90 text-slate-200 shadow",
          "hover:bg-slate-800"
        ].join(" ")}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    )}
    <div
        className={[
          "w-full min-h-[calc(100vh-80px)] overflow-x-hidden",
          themeClasses.background,
          "px-4 pb-24 pt-6 transition-colors duration-300",
          "transition-[padding] duration-500 ease-in-out",
          sidebarOpen ? "md:pl-[260px]" : "md:pl-0",
        ].join(" ")}
    >

      <div className="relative z-10 mx-auto max-w-7xl space-y-6 pr-2">
        {/* Header */}
        <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-lg`}>
          <CardHeader className="text-center py-8 relative">
            <Button
              onClick={toggleTheme}
              size="sm"
              variant={isDarkMode ? "default" : "outline"}
              className={`absolute top-4 right-4 ${
                isDarkMode
                  ? "border border-white text-white hover:bg-white/10"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <CardTitle className={`text-4xl font-bold ${themeClasses.text}`}>
              Academic Research Assistant
            </CardTitle>
            <CardDescription className={`text-lg ${themeClasses.textSecondary} mt-2`}>
              Your AI-Powered Research Partner
            </CardDescription>
          </CardHeader>
        </Card>

        {/* New chat button */}
        <div className="flex justify-end mb-4">
          <button
            data-new-chat
            onClick={() => {
                setActiveId(null);
                setMessages(makeBlankState());
                setDocuments([]);
                setComposer("");
                router.push("/"); // blank page. If your blank route is different, change this.
            }}
            className="text-sm px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            + New chat
          </button>
        </div>

        {/* chat + documents */}
        <Card className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-lg`}>
          <CardContent className="pt-6 pb-4">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className={`${themeClasses.tabsBg} p-1 h-auto`}>
                <TabsTrigger
                  value="chat"
                  className={`${themeClasses.tabActive} ${themeClasses.textSecondary} rounded-lg px-6 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60`}
                >
                  💬 Chat
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className={`${themeClasses.tabActive} ${themeClasses.textSecondary} rounded-lg px-6 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60`}
                >
                  📄 Documents ({Math.min(documents.length, MAX_DOCS)})
                </TabsTrigger>
              </TabsList>

              {/* CHAT TAB */}
              <TabsContent value="chat" className="mt-6">
                {/* filters row (keeps your existing filters) */}
                {/* filters row */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <select
                    value={accessFilter}
                    onChange={(e) => setAccessFilter(e.target.value as "" | "open" | "restricted")}
                    className={`h-10 rounded-md px-3 ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-400`}
                    title="filter by access"
                  >
                    <option value="">All</option>
                    <option value="open">Open access</option>
                    <option value="restricted">Restricted</option>
                  </select>

                  <input
                    type="number"
                    min="1800"
                    max="2100"
                    value={yearMin}
                    placeholder="Min yr"
                    onChange={(e) => setYearMin(e.target.value ? +e.target.value : "")}
                    className={`w-24 h-10 rounded-md px-3 ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text} shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400`}
                  />
                  <input
                    type="number"
                    min="1800"
                    max="2100"
                    value={yearMax}
                    placeholder="Max yr"
                    onChange={(e) => setYearMax(e.target.value ? +e.target.value : "")}
                    className={`w-24 h-10 rounded-md px-3 ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text} shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400`}
                  />

                  <div className="ml-auto flex items-center gap-2">
                    <label className={`flex items-center gap-2 text-xs ${themeClasses.textMuted}`}>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={autoApply}
                        onChange={(e) => setAutoApply(e.target.checked)}
                      />
                      Auto-apply
                    </label>
                    {autoApply && isApplying && (
                      <Loader2 className="h-3 w-3 animate-spin opacity-70" />
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshDocs}
                      disabled={!hasUserAsked || isApplying}
                      className={`rounded-lg ${themeClasses.buttonOutline}`}
                      title={!hasUserAsked ? "Ask something first" : "Apply filters"}
                    >
                      {isApplying ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Applying…
                        </>
                      ) : (
                        "Apply"
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAccessFilter("");
                        setYearMin("");
                        setYearMax("");
                        setAutoApply(false); // optional

                        if (typeof window !== "undefined") {
                            localStorage.removeItem(LS.access);
                            localStorage.removeItem(LS.yMin);
                            localStorage.removeItem(LS.yMax);
                            localStorage.setItem(LS.auto, JSON.stringify(false));
                        }
                      }}
                      disabled={!hasUserAsked}
                      className={`border ${themeClasses.buttonOutline}`}
                      title="Reset filters"
                    >
                      Reset
                    </Button>
                        <span
                          className={`text-xs px-2 py-1 rounded border ${
                            isDarkMode
                              ? "bg-slate-800/60 text-slate-200 border-slate-700/60"
                              : "bg-white text-gray-700 border-gray-300"
                          }`}
                        >
                          conversation mode
                        </span>
                  </div>
                </div>


                {/* messages list */}
                <div className="mb-4 max-h-[45vh] overflow-y-auto pr-1">
                  {messages
                    .filter((m) => m.role !== "system")
                    .map((m, i) => (
                      <Bubble key={i} role={m.role as "user" | "assistant"} theme={themeClasses}>
                        {m.role === "assistant" ? (
                          <div className={`prose ${isDarkMode ? "prose-invert" : ""} max-w-none`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <span>{m.content}</span>
                        )}
                      </Bubble>
                    ))}

                  {/* live streaming bubble */}
                  {isLoading && response && (
                    <Bubble role="assistant" theme={themeClasses}>
                      <div className={`prose ${isDarkMode ? "prose-invert" : ""} max-w-none`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {response}
                        </ReactMarkdown>
                      </div>
                      {isLoading && (
                        <div className="mt-2 text-xs opacity-70">typing…</div>
                      )}
                    </Bubble>
                  )}
                </div>

                {/* quick prompts */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {["give me a 5-bullet summary", "key limitations", "best paper for beginners"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setComposer((c) => (c ? c + " " + t : t))}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                          isDarkMode
                            ? "border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                            : "border-blue-300 text-blue-700 hover:bg-blue-50"
                        }`}

                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* composer */}
                <div className="flex items-end gap-3">
                  <div className="relative flex-1">
                    <textarea
                      ref={taRef}
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                      placeholder="ask a question or continue the conversation (shift+enter = newline)"
                      className={`w-full resize-none leading-6 min-h-[44px] max-h-[180px] rounded-md px-3 py-2
                            border ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text}
                            shadow-sm placeholder:text-gray-400
                            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400`}

                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={isLoading}
                    className={`h-11 ${themeClasses.buttonBg} text-white font-semibold`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <SearchIcon className="mr-2 h-4 w-4" />
                        Send
                      </>
                    )}
                  </Button>
                </div>

                {error && (
                  <div className={`mt-4 rounded-lg ${themeClasses.errorBg} p-3`}>
                    <p className={`text-sm ${themeClasses.errorText}`}>{error}</p>
                  </div>
                )}
                {status && (
                  <div className={`mt-4 rounded-lg ${themeClasses.statusBg} p-3`}>
                    <p className={`text-sm ${themeClasses.statusText} flex items-center`}>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {status}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* DOCUMENTS TAB */}
              <TabsContent value="documents" className="mt-6">
                <div className="flex items-center justify-end mb-3">
                  <label className={`mr-2 text-xs ${themeClasses.textMuted}`}>Citation</label>
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value as "APA" | "MLA")}
                    className={`h-9 rounded-md px-2 ${themeClasses.inputBg} ${themeClasses.inputBorder} ${themeClasses.text}`}
                  >
                    <option value="APA">APA</option>
                    <option value="MLA">MLA</option>
                  </select>
                </div>

                {documents.length > 0 ? (
                  documents.slice(0, MAX_DOCS).map((doc, index) => (
                    <Card
                      key={index}
                      className={`${themeClasses.cardBg} ${themeClasses.cardBorder} shadow-lg hover:shadow-xl hover:border-blue-500/40 transition-all duration-300 group mb-4`}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle
                            className={`text-lg leading-tight ${themeClasses.text} group-hover:text-blue-600 transition-colors`}
                          >
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
                          <span><strong className={themeClasses.textSecondary}>Authors:</strong> {doc.authors}</span>
                          <Separator orientation="vertical" className={`h-4 ${isDarkMode ? "bg-slate-600" : "bg-gray-300"}`} />
                          <span><strong className={themeClasses.textSecondary}>Year:</strong> {doc.year}</span>
                          <Badge variant="outline" className={themeClasses.journalBadge}>{doc.source}</Badge>
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
                      <p className={`text-center ${themeClasses.textMuted}`}>No documents yet… run a chat first.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
