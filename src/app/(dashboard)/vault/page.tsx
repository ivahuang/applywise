"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { theme } from "@/lib/theme/tokens";
import { Send, Plus, Sparkles, MessageCircle, Archive, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────

interface Atom {
  id: string;
  content: string;
  summary: string | null;
  contentEn: string | null;
  category: string;
  abilityTags: string[];
  qualityTags: string[];
  keywords: string[];
  timeframe: string | null;
  source: string;
  createdAt: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ── Tag colors ────────────────────────────────────────────

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  leadership: { bg: "#FAEEDA", text: "#633806" },
  technical: { bg: "#EEEDFE", text: "#3C3489" },
  communication: { bg: "#E1F5EE", text: "#085041" },
  analytical: { bg: "#E6F1FB", text: "#0C447C" },
  creative: { bg: "#FBEAF0", text: "#72243E" },
  resilience: { bg: "#EAF3DE", text: "#27500A" },
  cross_cultural: { bg: "#F1EFE8", text: "#444441" },
  social_impact: { bg: "#FAECE7", text: "#712B13" },
  academic: { bg: "#E6F1FB", text: "#0C447C" },
  work: { bg: "#FAEEDA", text: "#633806" },
  extracurricular: { bg: "#E1F5EE", text: "#085041" },
  personal: { bg: "#FBEAF0", text: "#72243E" },
  achievement: { bg: "#EEEDFE", text: "#3C3489" },
};

function getTagColor(tag: string): React.CSSProperties {
  const c = TAG_COLORS[tag] || { bg: "#F1EFE8", text: "#444441" }; return { background: c.bg, color: c.text };
}

const CATEGORY_LABELS: Record<string, string> = {
  academic: "学术",
  work: "工作/实习",
  extracurricular: "课外活动",
  personal: "个人经历",
  achievement: "成就",
};

// ── Main page ─────────────────────────────────────────────

export default function VaultPage() {
  const [atoms, setAtoms] = useState<Atom[]>([]);
  const [view, setView] = useState<"chat" | "atoms">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [quickInput, setQuickInput] = useState("");
  const [sending, setSending] = useState(false);
  const [savingQuick, setSavingQuick] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load atoms on mount
  useEffect(() => {
    fetch("/api/atoms")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAtoms(data); })
      .catch(() => {});
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reload atoms after extraction
  const refreshAtoms = useCallback(() => {
    fetch("/api/atoms")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAtoms(data); })
      .catch(() => {});
  }, []);

  // ── Brain chat ──────────────────────────────────────────

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/brain/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        if (data.atomsExtracted > 0) {
          refreshAtoms();
        }
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ ${data.error}` },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ 网络错误，请稍后再试。" },
      ]);
    } finally {
      setSending(false);
    }
  };

  // ── Quick capture ───────────────────────────────────────

  const saveQuickCapture = async () => {
    const text = quickInput.trim();
    if (!text || savingQuick) return;

    setSavingQuick(true);
    try {
      const res = await fetch("/api/atoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          summary: text.length > 50 ? text.slice(0, 47) + "..." : text,
          category: "personal",
          source: "manual",
          abilityTags: [],
          qualityTags: [],
          keywords: [],
        }),
      });

      if (res.ok) {
        setQuickInput("");
        refreshAtoms();
      }
    } catch {
      // silent fail
    } finally {
      setSavingQuick(false);
    }
  };

  // ── Handle enter key ────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  };

  // ── Render ──────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>
          Material Vault
        </div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ fontFamily: "Georgia, serif", color: theme.text }}
        >
          素材库
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
          和Brain对话，发现你的故事。
        </p>
      </div>

      {/* Quick capture — always visible */}
      <div
        className="flex gap-2 mb-6 p-3 rounded-lg border"
        style={{ background: theme.card, borderColor: theme.border }}
      >
        <Sparkles size={16} style={{ color: theme.accent, marginTop: 2, flexShrink: 0 }} />
        <textarea
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, saveQuickCapture)}
          placeholder="灵感速记：突然想到的经历、感悟、技能... 按Enter保存"
          rows={1}
          className="flex-1 resize-none text-sm outline-none"
          style={{
            background: "transparent",
            color: theme.text,
            lineHeight: 1.6,
          }}
        />
        <button
          onClick={saveQuickCapture}
          disabled={!quickInput.trim() || savingQuick}
          className="self-end p-1.5 rounded-md transition-opacity"
          style={{
            background: theme.accent,
            color: "#fff",
            opacity: !quickInput.trim() || savingQuick ? 0.4 : 1,
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* View toggle */}
      <div
        className="flex rounded-md overflow-hidden border mb-4"
        style={{ borderColor: theme.border, display: "inline-flex" }}
      >
        <button
          onClick={() => setView("chat")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all"
          style={{
            background: view === "chat" ? theme.card : "transparent",
            color: view === "chat" ? theme.text : theme.textMuted,
            fontWeight: view === "chat" ? 600 : 400,
          }}
        >
          <MessageCircle size={13} />
          Brain 对话
        </button>
        <button
          onClick={() => setView("atoms")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all"
          style={{
            background: view === "atoms" ? theme.card : "transparent",
            color: view === "atoms" ? theme.text : theme.textMuted,
            fontWeight: view === "atoms" ? 600 : 400,
          }}
        >
          <Archive size={13} />
          素材 ({atoms.length})
        </button>
      </div>

      {/* ── Chat view ──────────────────────────────────── */}
      {view === "chat" && (
        <div
          className="border rounded-lg overflow-hidden flex flex-col"
          style={{
            borderColor: theme.border,
            height: "calc(100vh - 340px)",
            minHeight: 400,
          }}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: theme.bg }}>
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">🧠</div>
                <div className="text-sm font-medium mb-1" style={{ color: theme.text }}>
                  开始和Brain对话
                </div>
                <div className="text-xs" style={{ color: theme.textMuted }}>
                  聊聊你的背景、经历、兴趣... Brain会帮你发现隐藏的素材
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {[
                    "我在XX大学读XX专业",
                    "我暑假做了一个实习",
                    "我对XX方向很感兴趣",
                    "我不确定申请什么项目",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setInput(prompt);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-1.5 rounded-full text-xs border transition-colors"
                      style={{
                        borderColor: theme.border,
                        color: theme.textSecondary,
                        background: theme.card,
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[80%] rounded-xl px-4 py-2.5 text-sm"
                  style={{
                    background: msg.role === "user" ? theme.accent : theme.card,
                    color: msg.role === "user" ? "#fff" : theme.text,
                    lineHeight: 1.7,
                    borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                    borderBottomLeftRadius: msg.role === "assistant" ? 4 : 16,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div
                  className="rounded-xl px-4 py-2.5 text-sm"
                  style={{ background: theme.card, color: theme.textMuted }}
                >
                  <span className="inline-flex gap-1">
                    <span className="animate-pulse">·</span>
                    <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>·</span>
                    <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>·</span>
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div
            className="border-t p-3 flex gap-2"
            style={{ borderColor: theme.border, background: theme.card }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, sendMessage)}
              placeholder="聊点什么..."
              rows={1}
              className="flex-1 resize-none text-sm outline-none rounded-lg px-3 py-2"
              style={{
                background: theme.bg,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                lineHeight: 1.6,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="self-end p-2 rounded-lg transition-opacity"
              style={{
                background: theme.accent,
                color: "#fff",
                opacity: !input.trim() || sending ? 0.4 : 1,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Atoms view ─────────────────────────────────── */}
      {view === "atoms" && (
        <div className="space-y-3">
          {atoms.length === 0 && (
            <div
              className="text-center py-12 rounded-lg border"
              style={{ borderColor: theme.border, background: theme.card }}
            >
              <div className="text-2xl mb-2">📦</div>
              <div className="text-sm" style={{ color: theme.textSecondary }}>
                还没有素材。和Brain对话或用速记添加。
              </div>
            </div>
          )}

          {atoms.map((atom) => (
            <div
              key={atom.id}
              className="border rounded-lg p-4"
              style={{ borderColor: theme.border, background: theme.card }}
            >
              {/* Category + timeframe */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={getTagColor(atom.category)}
                >
                  {CATEGORY_LABELS[atom.category] || atom.category}
                </span>
                {atom.timeframe && (
                  <span className="text-[10px]" style={{ color: theme.textMuted }}>
                    {atom.timeframe}
                  </span>
                )}
                <span className="text-[10px] ml-auto" style={{ color: theme.textMuted }}>
                  {atom.source === "conversation" ? "🧠 对话提取" : "✏️ 手动添加"}
                </span>
              </div>

              {/* Content */}
              <div className="text-sm mb-2" style={{ color: theme.text, lineHeight: 1.7 }}>
                {atom.content}
              </div>

              {/* English version */}
              {atom.contentEn && (
                <div
                  className="text-xs mb-2 italic"
                  style={{ color: theme.textSecondary, lineHeight: 1.6 }}
                >
                  {atom.contentEn}
                </div>
              )}

              {/* Tags */}
              {atom.abilityTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {atom.abilityTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={getTagColor(tag)}
                    >
                      {tag.replace("_", " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
