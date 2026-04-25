"use client";
import { useState } from "react";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";

type Message = { role: string; text: string };

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  async function send() {
    if (!input.trim()) return;
    const next: Message[] = [...messages, { role: "user", text: input }];
    setMessages(next);
    setInput("");
    try {
      const r = await fetch(`${BASE}/api/public/junkerz/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await r.json();
      setMessages([
        ...next,
        { role: "assistant", text: (data as { reply?: string }).reply ?? "Sorry, can you repeat that?" },
      ]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", text: "Connection error. Try again in a sec." },
      ]);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-xl text-xl"
      >💬</button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-xl shadow-2xl flex flex-col">
      <div className="p-3 bg-emerald-600 text-white rounded-t-xl flex justify-between">
        <span>Junkerz Chat</span>
        <button onClick={() => setOpen(false)}>✕</button>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <span
              className={`inline-block px-3 py-2 rounded-lg ${
                m.role === "user" ? "bg-emerald-100" : "bg-slate-100"
              }`}
            >{m.text}</span>
          </div>
        ))}
      </div>
      <div className="p-2 border-t flex gap-1">
        <input
          className="flex-1 border rounded p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask a question..."
        />
        <button
          className="bg-emerald-600 text-white px-3 rounded"
          onClick={send}
        >Send</button>
      </div>
    </div>
  );
}
