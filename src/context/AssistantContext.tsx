import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  isAppIntent,
  isMoreInfoIntent,
  isPhoneIntent,
  isPitchNavigation,
  isServiceMenu,
  matchServiceProduct,
  promptsFor,
  recommendationCopy,
  recommendationDetailCopy,
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
  openPhone: () => void;
  appInviteOpen: boolean;
  dismissAppInvite: () => void;
  openAppInvite: () => void;
  typing: boolean;
  ask: (text: string) => void;
  minimized: boolean;
  setMinimized: (value: boolean) => void;
  expandNonce: number;
  spotlight: { rowKey: string; choiceId: string } | null;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

const TYPING_MS = 720;
const APP_INVITE_KEY = "wealthpass-app-invite-dismissed";

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
  const location = useLocation();
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
  const [appInviteOpen, setAppInviteOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [threadClient, setThreadClient] = useState(passport.id);
  const announced = useRef<Set<string> | null>(null);
  const pitchSpoken = useRef(false);
  const typingHolds = useRef(0);

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
    pitchSpoken.current = false;
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

  const holdTyping = useCallback(() => {
    typingHolds.current += 1;
    setTyping(true);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      typingHolds.current = Math.max(0, typingHolds.current - 1);
      setTyping(typingHolds.current > 0);
    };
  }, []);

  const reveal = useCallback(
    (assistantText: string) => {
      const release = holdTyping();
      window.setTimeout(() => {
        setMessages((current) => [...current, { id: nextId(), role: "assistant", text: assistantText }]);
        release();
      }, TYPING_MS);
    },
    [holdTyping],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        if (sessionStorage.getItem(APP_INVITE_KEY) === "1") return;
      } catch {
        // Show the invite when storage is unavailable.
      }
      setAppInviteOpen(true);
    }, 500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const pending: { token: string; text: string }[] = [];
    for (const [key, row] of Object.entries(accepted)) {
      const token = acceptToken(passport.id, key, row);
      if (announced.current?.has(token)) continue;
      pending.push({ token, text: enrolledAssistantCopy(row) });
    }
    if (pending.length === 0) return;
    let live = true;
    const release = holdTyping();
    const timer = window.setTimeout(() => {
      if (!live) return;
      for (const item of pending) announced.current?.add(item.token);
      setMessages((current) => [
        ...current,
        ...pending.map((item) => ({ id: nextId(), role: "assistant" as const, text: item.text })),
      ]);
      setPhase("enrolled");
      setServicesOpen(false);
      setRecommendation((current) => (current && accepted[current.rowKey] ? null : current));
      release();
    }, TYPING_MS);
    return () => {
      live = false;
      window.clearTimeout(timer);
      release();
    };
  }, [accepted, holdTyping, passport.id]);

  const introducePitch = useCallback(() => {
    if (pitchSpoken.current) return;
    const rec = bestPitchRecommendation(board);
    navigate("/offers");
    setMinimized(false);
    setExpandNonce((current) => current + 1);
    setServicesOpen(false);
    pitchSpoken.current = true;
    if (!rec) {
      setRecommendation(null);
      setPhase("home");
      reveal("No pitch on an account yet. You can still ask for another service.");
      return;
    }
    const existing = accepted[rec.rowKey];
    if (existing) {
      setRecommendation(null);
      setPhase("enrolled");
      reveal(enrolledAssistantCopy(existing));
      return;
    }
    setRecommendation(rec);
    setPhase("recommend");
    reveal(recommendationCopy(rec));
  }, [accepted, board, navigate, reveal]);

  useEffect(() => {
    if (location.pathname !== "/offers") return;
    introducePitch();
  }, [introducePitch, location.pathname]);

  const ask = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const user = { id: nextId(), role: "user" as const, text: trimmed };
      setMessages((current) => [...current, user]);

      if (isAppIntent(trimmed)) {
        setAppInviteOpen(true);
        reveal("Demo invite to manage assets on the go. No store listing yet.");
        return;
      }

      if (isPhoneIntent(trimmed)) {
        setPhoneOpen(true);
        reveal("Demo of on-the-go access. Same thread, phone-sized. Nothing is sent.");
        return;
      }

      if (isPitchNavigation(trimmed)) {
        introducePitch();
        return;
      }

      if (isMoreInfoIntent(trimmed)) {
        if (!recommendation || accepted[recommendation.rowKey]) {
          reveal("Open your pitches first, and I can say more about the recommendation.");
          return;
        }
        reveal(recommendationDetailCopy(recommendation));
        return;
      }

      if (isAcceptIntent(trimmed)) {
        if (!recommendation || accepted[recommendation.rowKey]) {
          reveal("Open your pitches first. Then I can open the agreement.");
          return;
        }
        beginSign(recommendation.rowKey, recommendation.choice);
        reveal(`Opening the agreement for ${recommendation.choice.strategy} on ${recommendation.choice.accountName}.`);
        return;
      }

      const product = matchServiceProduct(trimmed);
      if (product) {
        const saved = note(product.id);
        setServicesOpen(false);
        reveal(serviceRequestCopy(saved.label, saved.already));
        return;
      }

      if (isServiceMenu(trimmed)) {
        setServicesOpen(true);
        reveal("Which should I note? I'll reach out when there's an offer. Demo only.");
        return;
      }

      reveal(answerQuestion(trimmed, { client: passport, board, wealth }));
    },
    [accepted, beginSign, board, introducePitch, note, passport, recommendation, reveal, wealth],
  );

  const closePhone = useCallback(() => setPhoneOpen(false), []);
  const openPhone = useCallback(() => setPhoneOpen(true), []);
  const openAppInvite = useCallback(() => setAppInviteOpen(true), []);
  const dismissAppInvite = useCallback(() => {
    try {
      sessionStorage.setItem(APP_INVITE_KEY, "1");
    } catch {
      // Closing still hides it for this view.
    }
    setAppInviteOpen(false);
  }, []);
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
      openPhone,
      appInviteOpen,
      dismissAppInvite,
      openAppInvite,
      typing,
      ask,
      minimized,
      setMinimized,
      expandNonce,
      spotlight,
    }),
    [
      appInviteOpen,
      ask,
      closePhone,
      dismissAppInvite,
      expandNonce,
      greeting,
      messages,
      minimized,
      openAppInvite,
      openPhone,
      phoneOpen,
      prompts,
      servicesOpen,
      spotlight,
      typing,
    ],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const value = useContext(AssistantContext);
  if (!value) throw new Error("useAssistant must be used inside AssistantProvider.");
  return value;
}
