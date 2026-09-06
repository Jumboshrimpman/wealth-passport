import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  answerMockChat,
  chatSuggestions,
  greetingMessage,
  MOCK_ASSISTANT_LABEL,
  type ChatMessage,
} from "../data/chat";
import { useConsent } from "../context/ConsentContext";
import { useOfferDecisions } from "../context/OfferDecisionContext";
import { Badge } from "../components/ui";

let messageSeq = 0;

function nextMessageId(): string {
  messageSeq += 1;
  return `chat-${Date.now()}-${messageSeq}`;
}

export function Chat() {
  const consent = useConsent();
  const { decisions } = useOfferDecisions();
  const inputId = useId();
  const threadRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([greetingMessage()]);

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages]);

  function ask(text: string) {
    const user: ChatMessage = {
      id: nextMessageId(),
      role: "user",
      text,
      handled: true,
    };
    const reply = answerMockChat(text, { consentOn: consent.shared, decisions });
    const assistant: ChatMessage = {
      id: nextMessageId(),
      role: "assistant",
      text: reply.text,
      handled: reply.handled,
    };
    setMessages((current) => [...current, user, assistant]);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) {
      const reply = answerMockChat("", { consentOn: consent.shared, decisions });
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId(),
          role: "assistant",
          text: reply.text,
          handled: false,
        },
      ]);
      return;
    }
    setDraft("");
    ask(text);
  }

  return (
    <div className="chat-page">
      <header className="chat-intro">
        <p className="kicker">Client home · MOCK chat</p>
        <h1>Your WealthPass desk</h1>
        <p className="lede">
          Scripted answers from Whitmore fixtures only. There is no live model call. The holistic
          profile stays on <Link to="/passport">Passport</Link>.
        </p>
      </header>

      <section className="panel chat-shell" aria-label="Mock client chat">
        <div className="chat-thread" ref={threadRef} role="log" aria-live="polite">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`chat-bubble ${message.role} ${message.handled ? "" : "unhandled"}`.trim()}
            >
              {message.role === "assistant" ? (
                <p className="chat-meta">
                  <Badge tone={message.handled ? "verified" : "warn"} compact>
                    {MOCK_ASSISTANT_LABEL}
                  </Badge>
                </p>
              ) : (
                <p className="chat-meta">
                  <Badge compact>You</Badge>
                </p>
              )}
              <p className="chat-text">{message.text}</p>
            </article>
          ))}
        </div>

        <div className="chat-chips" role="group" aria-label="Suggested questions">
          {chatSuggestions.map((chip) => (
            <button key={chip.id} type="button" className="chat-chip" onClick={() => ask(chip.label)}>
              {chip.label}
            </button>
          ))}
        </div>

        <form className="chat-composer" onSubmit={onSubmit}>
          <label className="field-label" htmlFor={inputId}>
            <span>Ask the mock assistant</span>
            <input
              id={inputId}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Offers, verification, allocation, rollover…"
              autoComplete="off"
            />
          </label>
          <button type="submit" className="gate-submit">
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
