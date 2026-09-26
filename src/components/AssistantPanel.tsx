import { useEffect, useRef, useState } from "react";
import { useAssistant } from "../context/AssistantContext";

export function AssistantPanel({ variant }: { variant: "home" | "dock" | "mini" }) {
  const { greeting, messages, prompts, ask } = useAssistant();
  const [draft, setDraft] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages]);

  function submit(text: string) {
    ask(text);
    setDraft("");
  }

  return (
    <div className={`assistant-panel ${variant}`}>
      {variant === "home" ? <h1>{greeting}</h1> : <p className="assistant-greeting">{greeting}</p>}
      <div className="assistant-thread" ref={threadRef} role="log" aria-live="polite" tabIndex={0}>
        {messages.map((message) => (
          <p key={message.id} className={message.role === "user" ? "from-you" : "from-assistant"}>
            {message.text}
          </p>
        ))}
      </div>
      {variant !== "mini" ? (
        <div className="assistant-prompts">
          {prompts.map((prompt) => (
            <button key={prompt.id} type="button" onClick={() => submit(prompt.label)}>
              {prompt.label}
            </button>
          ))}
        </div>
      ) : null}
      <form
        className="assistant-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
      >
        <label className="sr-only" htmlFor={`ask-${variant}`}>
          Ask about strategies, pitches, accounts, financials, or the household
        </label>
        <input
          id={`ask-${variant}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Which strategies do I qualify for?"
          autoComplete="off"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
