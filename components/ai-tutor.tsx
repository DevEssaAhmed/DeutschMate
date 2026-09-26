"use client";

import { FormEvent, useRef, useState } from "react";
import { courseLessons } from "@/lib/curriculum";
import { UmlautBar } from "./umlaut-bar";
import { useProgress } from "./progress-provider";

const levels = ["A1", "A2", "B1", "B2", "C1"] as const;
type Level = (typeof levels)[number];
type Mode = "tutor" | "guided_practice" | "grammar_explain";
type Turn = { role: "user" | "assistant"; text: string };
type Starter = { text: string; mode: Mode };

const levelGuides: Record<Level, { focus: string; description: string; starters: Starter[] }> = {
  A1: {
    focus: "Build useful first sentences",
    description: "Practise introductions, everyday questions, articles and basic word order.",
    starters: [
      { text: "Practise introducing myself in German, one question at a time.", mode: "guided_practice" },
      { text: "Explain why we say “mit dem Zug”.", mode: "grammar_explain" },
    ],
  },
  A2: {
    focus: "Handle everyday exchanges",
    description: "Connect simple ideas, talk about past events and manage familiar situations.",
    starters: [
      { text: "Practise describing what I did last weekend.", mode: "guided_practice" },
      { text: "Help me choose between Perfekt and Präteritum.", mode: "grammar_explain" },
    ],
  },
  B1: {
    focus: "Explain experiences and opinions",
    description: "Give reasons, link sentences and speak or write with more independence.",
    starters: [
      { text: "Ask me to explain an opinion and help me improve the answer.", mode: "guided_practice" },
      { text: "Explain obwohl and trotzdem with useful examples.", mode: "grammar_explain" },
    ],
  },
  B2: {
    focus: "Argue with clarity and nuance",
    description: "Build stronger arguments, vary connectors and choose the right register.",
    starters: [
      { text: "Challenge me to defend a position on remote work.", mode: "guided_practice" },
      { text: "Show me how to make my German argument more precise.", mode: "tutor" },
    ],
  },
  C1: {
    focus: "Refine precision and style",
    description: "Work on subtle meaning, idiomatic phrasing and flexible formal or informal register.",
    starters: [
      { text: "Give me a nuanced debate prompt and critique my response.", mode: "guided_practice" },
      { text: "Explain the stylistic difference between two similar German phrasings.", mode: "grammar_explain" },
    ],
  },
};

function recentHistory(turns: Turn[]) {
  const selected: Turn[] = [];
  let totalLength = 0;
  for (const turn of turns.slice(-6).reverse()) {
    const text = turn.text.slice(0, 4000);
    if (totalLength + text.length > 12_000) break;
    selected.unshift({ role: turn.role, text });
    totalLength += text.length;
  }
  return selected;
}

export function AiTutor() {
  const progress = useProgress();
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const currentLesson = courseLessons.find((item) => item.id === progress.lastLessonId)
    ?? courseLessons.find((item) => !progress.completedLessons.includes(item.id));
  const level = selectedLevel ?? currentLesson?.level ?? "A1";
  const [mode, setMode] = useState<Mode>("tutor");
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [messages, setMessages] = useState<Turn[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const questionRef = useRef<HTMLTextAreaElement | null>(null);
  const guide = levelGuides[level];

  function startNewTopic() {
    setMessages([]);
    setQuestion("");
    setContext("");
    setError("");
    questionRef.current?.focus();
  }

  function insertChar(char: string) {
    const field = questionRef.current;
    if (!field) return;
    const start = field.selectionStart ?? question.length;
    const end = field.selectionEnd ?? question.length;
    setQuestion(question.slice(0, start) + char + question.slice(end));
    window.setTimeout(() => {
      field.focus();
      field.setSelectionRange(start + char.length, start + char.length);
    }, 0);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const asked = question.trim();
    if (!asked || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, level, text: asked, context, history: recentHistory(messages) }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Tutor request failed.");
      if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("The tutor returned an empty answer. Please try again.");
      setMessages((previous) => [...previous, { role: "user", text: asked } as Turn, { role: "assistant", text: data.reply } as Turn].slice(-12));
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tutor request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-workspace">
      <form className="ai-form card" onSubmit={submit}>
        <div className="ai-form-row">
          <label>
            <span>CEFR level</span>
            <select
              value={level}
              disabled={loading}
              onChange={(event) => {
                setSelectedLevel(event.target.value as Level);
                setMessages([]);
                setError("");
              }}
            >
              {levels.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Teaching mode</span>
            <select
              value={mode}
              disabled={loading}
              onChange={(event) => {
                setMode(event.target.value as Mode);
                setMessages([]);
                setError("");
              }}
            >
              <option value="tutor">Ask the tutor</option>
              <option value="guided_practice">Guided practice</option>
              <option value="grammar_explain">Grammar deep dive</option>
            </select>
          </label>
        </div>

        <div style={{ borderLeft: "3px solid var(--green)", paddingLeft: 12 }}>
          <strong>{level}: {guide.focus}</strong>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.84rem" }}>{guide.description}</p>
        </div>

        <label>
          <span>{messages.length ? "Your follow-up or practice answer" : "Your question or practice focus"}</span>
          <textarea
            ref={questionRef}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={12000}
            rows={7}
            placeholder={mode === "guided_practice" ? "Tell the coach what you want to practise, then respond to one step at a time." : "For example: Why is it ‘mit dem Zug’ instead of ‘mit den Zug’?"}
            required
          />
        </label>
        <UmlautBar onInsert={insertChar} />

        {messages.length === 0 && (
          <div style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">START WITH A FOCUS</span>
            {guide.starters.map((starter) => (
              <button
                key={starter.text}
                type="button"
                className="button secondary"
                disabled={loading}
                style={{ textAlign: "left", whiteSpace: "normal" }}
                onClick={() => {
                  setQuestion(starter.text);
                  setMode(starter.mode);
                  questionRef.current?.focus();
                }}
              >
                {starter.text}
              </button>
            ))}
          </div>
        )}

        <label>
          <span>Optional lesson context</span>
          <textarea
            value={context}
            onChange={(event) => setContext(event.target.value)}
            maxLength={5000}
            rows={3}
            placeholder="Paste the sentence, paragraph, or lesson context you are working on."
          />
        </label>

        <div className="ai-form-actions">
          <button className="button primary" type="submit" disabled={loading || !question.trim()}>
            {loading ? "Thinking…" : messages.length ? "Continue conversation" : mode === "guided_practice" ? "Start practice" : mode === "grammar_explain" ? "Explain properly" : "Ask DeutschMate"}
          </button>
          <small>Recent turns are sent to Gemini for context. This conversation stays in this browser tab.</small>
        </div>
      </form>

      <section className="ai-response card" aria-label="Tutor conversation">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <span className="eyebrow">DEUTSCHMATE TUTOR</span>
          {messages.length > 0 && (
            <button type="button" className="text-button" disabled={loading} onClick={startNewTopic}>New topic</button>
          )}
        </div>

        {messages.length === 0 && !loading && (
          <p style={{ margin: "16px 0 0" }}>Choose a focus or ask a question. The tutor will respond at your selected level and give you a useful next step.</p>
        )}

        {messages.length > 0 && (
          <div style={{ display: "grid", gap: 18, marginTop: 18 }}>
            {messages.map((message, index) => (
              <div key={index} style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                <span className="eyebrow">{message.role === "user" ? "YOU" : "TUTOR"}</span>
                {message.role === "user" ? (
                  <p style={{ whiteSpace: "pre-wrap", margin: "8px 0 0" }}>{message.text}</p>
                ) : (
                  <pre aria-live={index === messages.length - 1 ? "polite" : "off"}>{message.text}</pre>
                )}
              </div>
            ))}
          </div>
        )}

        {loading && <p role="status" style={{ margin: "16px 0 0" }}>The tutor is preparing a response…</p>}
        {error && <p className="ai-error" role="alert">{error}</p>}
      </section>
    </div>
  );
}
