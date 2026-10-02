import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  buildOfferBoard,
  countNewOffers,
  defaultFit,
  describeWealth,
  greetingLine,
} from "../../shared/marketplace.ts";
import type { RowAcceptance } from "../../shared/acceptOffer.ts";
import { answerQuestion } from "../data/assistantCopy";
import {
  bestPitchRecommendation,
  enrolledAssistantCopy,
  isAcceptIntent,
  isPhoneIntent,
  isPitchNavigation,
  isServiceMenu,
  matchServiceProduct,
  promptsFor,
  recommendationCopy,
  serviceRequestCopy,
  type AssistantPrompt,
  type PitchRecommendation,
} from "../data/assistantFlow";
import { useAcceptedOffers } from "./AcceptedOffersContext";
import { useClient } from "./ClientContext";
import { useDemo } from "./DemoContext";
import { useOffers } from "./OfferContext";
import { useServiceRequests } from "./ServiceRequestContext";

export interface AssistantMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
}

type Phase = "home" | "recommend" | "enrolled";

type AssistantContextValue = {
  greeting: string;
  messages: AssistantMessage[];
  prompts: AssistantPrompt[];
  servicesOpen: boolean;
  phoneOpen: boolean;
  closePhone: () => void;
  ask: (text: string) => void;
  minimized: boolean;
  setMinimized: (value: boolean) => void;
  expandNonce: number;
  spotlight: { rowKey: string; choiceId: string } | null;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

let messageSeq = 0;

function nextId(): string {
  messageSeq += 1;
  return `m-${messageSeq}`;
}

function acceptToken(clientId: string, key: string, row: RowAcceptance): string {
  return `${clientId}:${key}:${row.choiceId}`;
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { passport } = useClient();
  const { profile } = useDemo();
  const { eligible } = useOffers();
  const { accepted, beginSign } = useAcceptedOffers();
  const { note } = useServiceRequests();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [minimized, setMinimized] = useState(false);
  const [expandNonce, setExpandNonce] = useState(0);
  const [phase, setPhase] = useState<Phase>("home");
  const [recommendation, setRecommendation] = useState<PitchRecommendation | null>(null);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [threadClient, setThreadClient] = useState(passport.id);
  const announced = useRef<Set<string> | null>(null);

  if (announced.current === null) {
    announced.current = new Set(Object.entries(accepted).map(([key, row]) => acceptToken(passport.id, key, row)));
  }

  if (threadClient !== passport.id) {
    announced.current = new Set(Object.entries(accepted).map(([key, row]) => acceptToken(passport.id, key, row)));
    setThreadClient(passport.id);
    setMessages([]);
    setPhase("home");
    setRecommendation(null);
    setServicesOpen(false);
    setPhoneOpen(false);
  }

  const activeProfile = profile && profile.clientId === passport.id ? profile : null;
  const fit = useMemo(() => activeProfile?.fit ?? defaultFit(passport), [activeProfile, passport]);
  const wealth = useMemo(() => describeWealth(passport, activeProfile), [activeProfile, passport]);
  const board = useMemo(
    () =>
      buildOfferBoard(
        passport,
        fit,
        eligible.map((match) => match.institution),
      ),
    [eligible, fit, passport],
  );
  const greeting = greetingLine(passport.household.clientFirstName, wealth.total, countNewOffers(board));
  const pendingAccept = phase === "recommend" && recommendation != null && !accepted[recommendation.rowKey];

  useEffect(() => {
    const fresh: AssistantMessage[] = [];
    for (const [key, row] of Object.entries(accepted)) {
      const token = acceptToken(passport.id, key, row);
      if (announced.current?.has(token)) continue;
      announced.current?.add(token);
      fresh.push({ id: nextId(), role: "assistant", text: enrolledAssistantCopy(row) });
    }
    if (fresh.length === 0) return;
    setMessages((current) => [...current, ...fresh]);
    setPhase("enrolled");
    setServicesOpen(false);
    setRecommendation((current) => (current && accepted[current.rowKey] ? null : current));
  }, [accepted, passport.id]);

  const ask = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const user = { id: nextId(), role: "user" as const, text: trimmed };

      if (isPhoneIntent(trimmed)) {
        setPhoneOpen(true);
        setMessages((current) => [
          ...current,
          user,
          {
            id: nextId(),
            role: "assistant",
            text: "This is a demo of on-the-go access. Same thread, phone-sized. It is not a text message, and nothing is sent.",
          },
        ]);
        return;
      }

      if (isPitchNavigation(trimmed)) {
        const rec = bestPitchRecommendation(board);
        navigate("/offers");
        setMinimized(false);
        setExpandNonce((current) => current + 1);
        setServicesOpen(false);
        if (!rec) {
          setRecommendation(null);
          setPhase("home");
          setMessages((current) => [
            ...current,
            user,
            {
              id: nextId(),
              role: "assistant",
              text: "I don't see a pitch on an account yet. You can still tell me if you need another financial service.",
            },
          ]);
          return;
        }
        const existing = accepted[rec.rowKey];
        if (existing) {
          setRecommendation(null);
          setPhase("enrolled");
          setMessages((current) => [...current, user, { id: nextId(), role: "assistant", text: enrolledAssistantCopy(existing) }]);
          return;
        }
        setRecommendation(rec);
        setPhase("recommend");
        setMessages((current) => [...current, user, { id: nextId(), role: "assistant", text: recommendationCopy(rec) }]);
        return;
      }

      if (isAcceptIntent(trimmed)) {
        if (!recommendation || accepted[recommendation.rowKey]) {
          setMessages((current) => [
            ...current,
            user,
            {
              id: nextId(),
              role: "assistant",
              text: "Take me to your pitches first, and I can open the agreement for the strategy I recommend.",
            },
          ]);
          return;
        }
        beginSign(recommendation.rowKey, recommendation.choice);
        setMessages((current) => [
          ...current,
          user,
          {
            id: nextId(),
            role: "assistant",
            text: `Opening the client agreement for ${recommendation.choice.strategy} on ${recommendation.choice.accountName}.`,
          },
        ]);
        return;
      }

      const product = matchServiceProduct(trimmed);
      if (product) {
        const saved = note(product.id);
        setServicesOpen(false);
        setMessages((current) => [
          ...current,
          user,
          { id: nextId(), role: "assistant", text: serviceRequestCopy(saved.label, saved.already) },
        ]);
        return;
      }

      if (isServiceMenu(trimmed)) {
        setServicesOpen(true);
        setMessages((current) => [
          ...current,
          user,
          {
            id: nextId(),
            role: "assistant",
            text: "Which of these should I note? I'll reach back out once there's an offer. This is a demo request, not a live product.",
          },
        ]);
        return;
      }

      const reply = answerQuestion(trimmed, { client: passport, board, wealth });
      setMessages((current) => [...current, user, { id: nextId(), role: "assistant", text: reply }]);
    },
    [accepted, beginSign, board, navigate, note, passport, recommendation, wealth],
  );

  const closePhone = useCallback(() => setPhoneOpen(false), []);
  const prompts = promptsFor({ pendingAccept, enrolled: phase === "enrolled" });
  const spotlight = pendingAccept && recommendation ? { rowKey: recommendation.rowKey, choiceId: recommendation.choice.id } : null;

  const value = useMemo(
    () => ({
      greeting,
      messages,
      prompts,
      servicesOpen,
      phoneOpen,
      closePhone,
      ask,
      minimized,
      setMinimized,
      expandNonce,
      spotlight,
    }),
    [ask, closePhone, expandNonce, greeting, messages, minimized, phoneOpen, prompts, servicesOpen, spotlight],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const value = useContext(AssistantContext);
  if (!value) throw new Error("useAssistant must be used inside AssistantProvider.");
  return value;
}
