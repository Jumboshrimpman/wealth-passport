import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  buildOfferBook,
  countNewOffers,
  defaultFit,
  describeWealth,
  greetingLine,
} from "../../shared/marketplace.ts";
import { answerQuestion, STARTER_PROMPTS } from "../data/assistantCopy";
import { useClient } from "./ClientContext";
import { useDemo } from "./DemoContext";
import { useOffers } from "./OfferContext";

export interface AssistantMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
}

type AssistantContextValue = {
  greeting: string;
  messages: AssistantMessage[];
  prompts: typeof STARTER_PROMPTS;
  ask: (text: string) => void;
  minimized: boolean;
  setMinimized: (value: boolean) => void;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

let messageSeq = 0;

function nextId(): string {
  messageSeq += 1;
  return `m-${messageSeq}`;
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const { passport } = useClient();
  const { profile } = useDemo();
  const { eligible } = useOffers();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [minimized, setMinimized] = useState(false);

  const activeProfile = profile && profile.clientId === passport.id ? profile : null;
  const fit = useMemo(() => activeProfile?.fit ?? defaultFit(passport), [activeProfile, passport]);
  const wealth = useMemo(() => describeWealth(passport, activeProfile), [activeProfile, passport]);
  const book = useMemo(() => buildOfferBook(passport, fit), [fit, passport]);
  const greeting = greetingLine(
    passport.household.clientFirstName,
    wealth.total,
    countNewOffers(book, eligible.length),
  );

  useEffect(() => {
    setMessages([]);
  }, [passport.id]);

  const ask = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const reply = answerQuestion(trimmed, {
        client: passport,
        book,
        wealth,
        institutions: eligible,
      });
      setMessages((current) => [
        ...current,
        { id: nextId(), role: "user", text: trimmed },
        { id: nextId(), role: "assistant", text: reply },
      ]);
    },
    [book, eligible, passport, wealth],
  );

  const value = useMemo(
    () => ({ greeting, messages, prompts: STARTER_PROMPTS, ask, minimized, setMinimized }),
    [ask, greeting, messages, minimized],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const value = useContext(AssistantContext);
  if (!value) throw new Error("useAssistant must be used inside AssistantProvider.");
  return value;
}
