"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { loadChats } from "@/lib/chatStore";
import type { Chat } from "@/lib/chatStore";

export default function Sidebar() {
  const [chats, setChats] = useState<Chat[]>([]);
  const pathname = usePathname();
  const activeId = pathname?.split("/").pop();

  useEffect(() => {
    setChats(loadChats());
    // refresh the list if another tab updates storage
    const onStorage = (e: StorageEvent) => {
      if (e.key === "chats-v1") setChats(loadChats());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-r bg-slate-950">
      <h3 className="px-4 py-3 font-semibold text-white">recent chats</h3>
      {chats.map((c) => {
        const isActive = c.id === activeId;
        return (
          <Link
            key={c.id}
            href={`/chat/${c.id}`}
            className={`block truncate px-4 py-2 ${
              isActive
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-slate-800"
            }`}
            title={c.title}
          >
            {c.title || "untitled"}
          </Link>
        );
      })}
    </aside>
  );
}
