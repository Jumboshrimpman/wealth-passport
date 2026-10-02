import { useState } from "react";
import { SERVICE_PRODUCTS } from "../data/assistantFlow";
import { useAssistant } from "../context/AssistantContext";

/** Demo of the same assistant on a phone. Not a text message and not an app. */
export function PhoneDemoSheet() {
  const { phoneOpen, closePhone, greeting, messages, prompts, servicesOpen, typing, ask } = useAssistant();
  const [draft, setDraft] = useState("");
  if (!phoneOpen) return null;

  function submit(text: string) {
    ask(text);
    setDraft("");
  }

  return (
    <div className="phone-demo-backdrop" role="presentation" onClick={closePhone}>
      <div
        className="phone-demo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-demo-title"
        data-testid="phone-demo"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="phone-demo-bar">
          <div>
            <p id="phone-demo-title">WealthPass</p>
            <p>Demo of on-the-go access. Not a text and not an app.</p>
          </div>
          <button type="button" className="text-button" onClick={closePhone}>
            Close
          </button>
        </header>
        <div className="sms-thread" role="log">
          <p className="sms-bubble them">{greeting}</p>
          {messages.map((message) => (
            <p key={message.id} className={message.role === "user" ? "sms-bubble you" : "sms-bubble them"}>
              {message.text}
            </p>
          ))}
          {typing ? (
            <p className="sms-bubble them is-typing" data-testid="assistant-typing">
              Typing…
            </p>
          ) : null}
        </div>
        {servicesOpen ? (
          <div className="sms-replies">
            {SERVICE_PRODUCTS.map((product) => (
              <button key={product.id} type="button" onClick={() => submit(product.label)}>
                {product.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="sms-replies">
            {prompts.map((prompt) => (
              <button key={prompt.id} type="button" onClick={() => submit(prompt.label)}>
                {prompt.label}
              </button>
            ))}
          </div>
        )}
        <form
          className="sms-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit(draft);
          }}
        >
          <label className="sr-only" htmlFor="sms-draft">
            Demo message
          </label>
          <input
            id="sms-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Message"
            autoComplete="off"
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
