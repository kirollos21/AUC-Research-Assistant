// app/chat/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Search from "@/components/Search";
import { loadChats } from "@/lib/chatStore";
import type { Chat } from "@/lib/chatStore";

export default function ChatPage() {
  const { id } = useParams() as { id: string };
  const [chat, setChat] = useState<Chat | null>(null);

  useEffect(() => {
    const all = loadChats();
    setChat(all.find((c) => c.id === id) ?? null);
  }, [id]);

  if (!chat) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-slate-400">
        Chat not found – maybe it was cleared from storage.
      </div>
    );
  }

  return (
    <Search
      initialMessages={chat.messages}
      initialDocuments={chat.documents}
      chatId={chat.id}
    />
  );
}
