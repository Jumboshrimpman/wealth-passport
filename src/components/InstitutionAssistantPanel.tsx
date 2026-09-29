import { useLayoutEffect, useRef, useState } from "react";
import { useInstitutional } from "../context/InstitutionalContext";

export function InstitutionAssistantPanel({ variant }: { variant: "home" | "dock" }) {
  const { greeting, messages, prompts, ask } = useInstitutional();
  const [draft, setDraft] = useState("");
  const [showJump, setShowJump] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  const ignoreScroll = useRef(false);

  useLayoutEffect(() => {
    const node = threadRef.current;
    if (!node || messages.length === 0) return;
    if (!followRef.current) {
      setShowJump(true);
      return;
    }
    const latest = node.querySelector<HTMLElement>("[data-latest]");
    if (!latest) return;
    ignoreScroll.current = true;
    const top = latest.offsetTop - node.offsetTop;
    node.scrollTop = Math.max(0, top - 4);
    setShowJump(false);
    requestAnimationFrame(() => {
      ignoreScroll.current = false;
    });
  }, [messages]);

  function onScroll() {
    if (ignoreScroll.current) return;
    const node = threadRef.current;
    if (!node) return;
    const latest = node.querySelector<HTMLElement>("[data-latest]");
    if (!latest) {
      followRef.current = true;
      setShowJump(false);
      return;
    }
    const latestTop = latest.offsetTop - node.offsetTop;
    const viewTop = node.scrollTop;
    const viewBottom = viewTop + node.clientHeight;
    const startVisible = latestTop >= viewTop - 8 && latestTop <= viewBottom - 24;
    const nearEnd = node.scrollHeight - viewBottom < 48;
    followRef.current = startVisible || nearEnd;
    setShowJump(!followRef.current);
  }

  function jumpToLatest() {
    const node = threadRef.current;
    if (!node) return;
    const latest = node.querySelector<HTMLElement>("[data-latest]");
    followRef.current = true;
    setShowJump(false);
    if (!latest) {
      node.scrollTop = 0;
      return;
    }
    const top = latest.offsetTop - node.offsetTop;
    node.scrollTop = Math.max(0, top - 4);
  }

  function submit(text: string) {
    ask(text);
    setDraft("");
  }

  return (
    <div className={`assistant-panel ${variant}`}>
      {variant === "home" ? <h1>{greeting}</h1> : <p className="assistant-greeting">{greeting}</p>}
      <div className="assistant-thread" ref={threadRef} role="log" aria-live="polite" tabIndex={0} onScroll={onScroll}>
        {messages.map((message, index) => (
          <p
            key={message.id}
            className={message.role === "user" ? "from-you" : "from-assistant"}
            data-latest={index === messages.length - 1 ? "true" : undefined}
          >
            {message.text}
          </p>
        ))}
      </div>
      {showJump ? (
        <button type="button" className="assistant-jump" onClick={jumpToLatest}>
          Jump to latest
        </button>
      ) : null}
      <div className="assistant-prompts">
        {prompts.map((prompt) => (
          <button key={prompt.id} type="button" onClick={() => submit(prompt.label)}>
            {prompt.label}
          </button>
        ))}
      </div>
      <form
        className="assistant-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
      >
        <label className="sr-only" htmlFor={`desk-ask-${variant}`}>
          Ask which households fit, what went out, or to upload a strategy or draft a pitch
        </label>
        <input
          id={`desk-ask-${variant}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Which households fit this desk?"
          autoComplete="off"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
