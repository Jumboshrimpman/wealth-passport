import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  answerMockChat,
  chatSuggestions,
  greetingMessage,
  MOCK_ASSISTANT_LABEL,
  UNHANDLED_CHAT_REPLY,
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
  const threadRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([greetingMessage()]);

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages]);

  function ask(label: string) {
    const user: ChatMessage = {
      id: nextMessageId(),
      role: "user",
      text: label,
      handled: true,
    };
    const reply = answerMockChat(label, { consentOn: consent.shared, decisions });
    const assistant: ChatMessage = {
      id: nextMessageId(),
      role: "assistant",
      text: reply.text,
      handled: reply.handled,
    };
    setMessages((current) => [...current, user, assistant]);
  }

  return (
    <div className="chat-page">
      <header className="chat-intro">
        <p className="kicker">Client home · MOCK chat</p>
        <h1>Your WealthPass desk</h1>
        <p className="lede">
          Suggested questions only — each chip has a preloaded fixture reply. There is no text box
          and no live model. “Ask me anything” means tap a suggestion. The holistic profile stays
          on <Link to="/passport">Passport</Link>.
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
        <p className="tiny muted chat-limit">{UNHANDLED_CHAT_REPLY}</p>
      </section>
    </div>
  );
}
