"use client";
import { useState, useRef, useEffect } from "react";
import { Source } from "../types";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface ConversationalChatProps {
  repoId: string;
}

export default function ConversationalChat({
  repoId,
}: ConversationalChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setError("");

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    setLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId, question: userMessage }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();

      // Add assistant message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || "No answer provided",
          sources: data.sources || [],
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // Remove the user message if there was an error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-600 text-white p-4">
        <h2 className="text-2xl font-bold">Chat with Repository</h2>
        <p className="text-blue-100 text-sm">Ask questions about the codebase</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Start a conversation by asking a question about the repository.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-100 text-gray-900 rounded-bl-none"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-opacity-30 border-gray-400">
                  <p className="text-xs font-semibold mb-1">Sources:</p>
                  <div className="space-y-1">
                    {msg.sources.map((source, si) => (
                      <div
                        key={si}
                        className="text-xs bg-opacity-50 bg-gray-200 rounded p-1"
                      >
                        <p className="font-mono">{source.file}</p>
                        <p className="text-opacity-70">
                          Lines {source.startLine}-{source.endLine}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="bg-red-100 text-red-900 px-4 py-2 rounded-lg rounded-bl-none text-sm">
              Error: {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
