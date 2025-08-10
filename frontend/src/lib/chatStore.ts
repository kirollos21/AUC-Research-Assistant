export type Chat = {
  id: string;
  title: string;
  messages: { role: "user" | "assistant"; content: string }[];
  documents?: any[];          // ← add
};

const KEY = "ara-chat-history";

export function loadChats(): Chat[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveChats(chats: Chat[]) {
  localStorage.setItem(KEY, JSON.stringify(chats));
}
