import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { SEEDED_PASSPORTS } from "../../shared/seed/index.ts";
import { useAssistant } from "./AssistantContext";
import {
  anonymizeBook,
  applyDecisions,
  blankPitch,
  blankStrategy,
  CANNED_STRATEGY_FILE,
  deskGreeting,
  deskReply,
  DESK_PROMPTS,
  FIRM,
  listingDecision,
  newYorkPitch,
  openStrategyForEdit,
  PITCH_SEND_USD,
  planPitchSend,
  recommendationsFor,
  refFor,
  seedCharges,
  seedPitches,
  seedStrategies,
  strategyFromUpload,
  type AnonClient,
  type DeskCharge,
  type DeskPitch,
  type ListingStatus,
  type OwnedStrategy,
  type StrategyProfileDraft,
} from "../institution/desk";

export interface DeskMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
}

type InstitutionalContextValue = {
  email: string;
  billing: string;
  sendPrice: number;
  book: AnonClient[];
  strategies: OwnedStrategy[];
  pitches: DeskPitch[];
  charges: DeskCharge[];
  greeting: string;
  messages: DeskMessage[];
  prompts: typeof DESK_PROMPTS;
  ask: (text: string) => void;
  activeStrategyId: string | null;
  openStrategy: (id: string | null) => void;
  startUpload: (filename: string) => void;
  startManual: () => void;
  updateDraft: (id: string, patch: Partial<StrategyProfileDraft>) => void;
  openRecommendations: (id: string) => void;
  decideRecommendation: (strategyId: string, recId: string, decision: "accept" | "decline") => void;
  submitStrategy: (id: string) => void;
  editStrategyAgain: (id: string) => void;
  editListedStrategy: (id: string) => void;
  saveListedStrategy: (id: string) => void;
  removeStrategy: (id: string) => void;
  editorFocus: number;
  preferCreate: boolean;
  clearPreferCreate: () => void;
  activePitchId: string | null;
  openPitch: (id: string | null) => void;
  updatePitch: (id: string, patch: Partial<DeskPitch>) => void;
  startPitch: () => void;
  sendPitch: (pitchId: string, clientIds: string | readonly string[]) => { ok: boolean };
};

const InstitutionalContext = createContext<InstitutionalContextValue | null>(null);

let seq = 0;
function uid(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

export function InstitutionalProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { setMinimized } = useAssistant();
  const book = useMemo(() => anonymizeBook(SEEDED_PASSPORTS), []);
  const [strategies, setStrategies] = useState<OwnedStrategy[]>(seedStrategies);
  const [pitches, setPitches] = useState<DeskPitch[]>(seedPitches);
  const [charges, setCharges] = useState<DeskCharge[]>(seedCharges);
  const [messages, setMessages] = useState<DeskMessage[]>([]);
  const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null);
  const [preferCreate, setPreferCreate] = useState(false);
  const [activePitchId, setActivePitchId] = useState<string | null>(null);
  const [editorFocus, setEditorFocus] = useState(0);
  const timers = useRef<number[]>([]);
  const strategiesRef = useRef(strategies);
  strategiesRef.current = strategies;

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) window.clearTimeout(timer);
    };
  }, []);

  const greeting = useMemo(() => deskGreeting(book, pitches), [book, pitches]);

  const ask = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const result = deskReply(trimmed, { book, pitches });
      setMessages((current) => [
        ...current,
        { id: uid("m"), role: "user", text: trimmed },
        { id: uid("m"), role: "assistant", text: result.text },
      ]);
      if (result.effect === "upload-strategy") {
        const id = uid("strategy");
        const owned = strategyFromUpload(CANNED_STRATEGY_FILE, id);
        setStrategies((current) => [
          {
            ...owned,
            status: "recommendations",
            recommendations: recommendationsFor(owned.draft),
          },
          ...current,
        ]);
        setActiveStrategyId(id);
        setPreferCreate(true);
        setMinimized(false);
        navigate("/institution/strategies");
      }
      if (result.effect === "draft-ny-pitch") {
        const id = uid("pitch");
        setPitches((current) => [newYorkPitch(id), ...current]);
        setActivePitchId(id);
        setMinimized(false);
        navigate("/institution/pitches");
      }
    },
    [book, navigate, pitches, setMinimized],
  );

  const startUpload = useCallback(
    (filename: string) => {
      const id = uid("strategy");
      setStrategies((current) => [strategyFromUpload(filename, id), ...current]);
      setActiveStrategyId(id);
      setPreferCreate(true);
      navigate("/institution/strategies");
    },
    [navigate],
  );

  const startManual = useCallback(() => {
    const id = uid("strategy");
    setStrategies((current) => [blankStrategy(id), ...current]);
    setActiveStrategyId(id);
    setPreferCreate(true);
    navigate("/institution/strategies");
  }, [navigate]);

  const updateDraft = useCallback((id: string, patch: Partial<StrategyProfileDraft>) => {
    setStrategies((current) =>
      current.map((strategy) =>
        strategy.id === id ? { ...strategy, draft: { ...strategy.draft, ...patch, id: strategy.draft.id } } : strategy,
      ),
    );
  }, []);

  const openRecommendations = useCallback((id: string) => {
    setStrategies((current) =>
      current.map((strategy) => {
        if (strategy.id !== id) return strategy;
        return {
          ...strategy,
          status: "recommendations",
          recommendations: recommendationsFor(strategy.draft),
          decisions: {},
        };
      }),
    );
    setActiveStrategyId(id);
  }, []);

  const decideRecommendation = useCallback((strategyId: string, recId: string, decision: "accept" | "decline") => {
    setStrategies((current) =>
      current.map((strategy) =>
        strategy.id === strategyId
          ? { ...strategy, decisions: { ...strategy.decisions, [recId]: decision } }
          : strategy,
      ),
    );
  }, []);

  const finishReview = useCallback((id: string) => {
    const timer = window.setTimeout(() => {
      setStrategies((current) =>
        current.map((strategy) => {
          if (strategy.id !== id || strategy.status !== "under-review" || strategy.resumeStatus) return strategy;
          return { ...strategy, status: listingDecision(strategy.draft) };
        }),
      );
    }, 1600);
    timers.current.push(timer);
  }, []);

  const submitStrategy = useCallback(
    (id: string) => {
      setStrategies((current) =>
        current.map((strategy) => {
          if (strategy.id !== id) return strategy;
          return {
            ...strategy,
            draft: applyDecisions(strategy.draft, strategy.recommendations, strategy.decisions),
            status: "under-review",
            resumeStatus: undefined,
          };
        }),
      );
      setActiveStrategyId((current) => (current === id ? null : current));
      finishReview(id);
    },
    [finishReview],
  );

  const focusEditor = useCallback((id: string) => {
    setActiveStrategyId(id);
    setPreferCreate(true);
    setEditorFocus((current) => current + 1);
  }, []);

  const editStrategyAgain = useCallback(
    (id: string) => {
      setStrategies((current) =>
        current.map((strategy) => (strategy.id === id ? openStrategyForEdit({ ...strategy, status: "recommendations" }) : strategy)),
      );
      focusEditor(id);
    },
    [focusEditor],
  );

  const editListedStrategy = useCallback(
    (id: string) => {
      const known = strategiesRef.current.some((strategy) => strategy.id === id);
      if (!known) return;
      setStrategies((current) => current.map((strategy) => (strategy.id === id ? openStrategyForEdit(strategy) : strategy)));
      focusEditor(id);
    },
    [focusEditor],
  );

  const saveListedStrategy = useCallback(
    (id: string) => {
      const existing = strategiesRef.current.find((strategy) => strategy.id === id);
      const restored: ListingStatus | undefined = existing?.resumeStatus;
      setStrategies((current) =>
        current.map((strategy) => {
          if (strategy.id !== id) return strategy;
          const status = strategy.resumeStatus ?? "editing";
          return { ...strategy, status, resumeStatus: undefined };
        }),
      );
      setActiveStrategyId((current) => (current === id ? null : current));
      if (restored === "under-review") finishReview(id);
    },
    [finishReview],
  );

  const removeStrategy = useCallback((id: string) => {
    setStrategies((current) => current.filter((strategy) => strategy.id !== id));
    setActiveStrategyId((current) => (current === id ? null : current));
  }, []);

  const clearPreferCreate = useCallback(() => setPreferCreate(false), []);

  const updatePitch = useCallback((id: string, patch: Partial<DeskPitch>) => {
    setPitches((current) => current.map((pitch) => (pitch.id === id ? { ...pitch, ...patch, id: pitch.id } : pitch)));
  }, []);

  const startPitch = useCallback(() => {
    const id = uid("pitch");
    setPitches((current) => [blankPitch(id), ...current]);
    setActivePitchId(id);
    navigate("/institution/pitches");
  }, [navigate]);

  const sendPitch = useCallback(
    (pitchId: string, clientIds: string | readonly string[]) => {
      const ids = typeof clientIds === "string" ? [clientIds] : clientIds;
      const pitch = pitches.find((item) => item.id === pitchId);
      if (!pitch) return { ok: false };
      const plan = planPitchSend(pitch, ids, book);
      if (!plan) return { ok: false };
      setPitches((current) => current.map((item) => (item.id === pitchId ? plan.pitch : item)));
      if (plan.addedClientIds.length > 0) {
        const refs = plan.addedClientIds
          .map((id) => refFor(book, id))
          .filter((ref): ref is string => Boolean(ref));
        const label =
          refs.length === 1 ? `Pitch sent · ${refs[0]}` : `Pitch sent · ${refs.length} households`;
        setCharges((current) => [{ id: uid("chg"), when: "Sep 29", label, amount: PITCH_SEND_USD }, ...current]);
      }
      return { ok: true };
    },
    [book, pitches],
  );

  const value = useMemo<InstitutionalContextValue>(
    () => ({
      email: FIRM.email,
      billing: FIRM.billing,
      sendPrice: PITCH_SEND_USD,
      book,
      strategies,
      pitches,
      charges,
      greeting,
      messages,
      prompts: DESK_PROMPTS,
      ask,
      activeStrategyId,
      openStrategy: setActiveStrategyId,
      startUpload,
      startManual,
      updateDraft,
      openRecommendations,
      decideRecommendation,
      submitStrategy,
      editStrategyAgain,
      editListedStrategy,
      saveListedStrategy,
      removeStrategy,
      editorFocus,
      preferCreate,
      clearPreferCreate,
      activePitchId,
      openPitch: setActivePitchId,
      updatePitch,
      startPitch,
      sendPitch,
    }),
    [
      activePitchId,
      activeStrategyId,
      ask,
      book,
      charges,
      decideRecommendation,
      clearPreferCreate,
      editListedStrategy,
      editStrategyAgain,
      editorFocus,
      greeting,
      messages,
      openRecommendations,
      pitches,
      preferCreate,
      removeStrategy,
      saveListedStrategy,
      sendPitch,
      startManual,
      startPitch,
      startUpload,
      strategies,
      submitStrategy,
      updateDraft,
      updatePitch,
    ],
  );

  return <InstitutionalContext.Provider value={value}>{children}</InstitutionalContext.Provider>;
}

export function useInstitutional() {
  const value = useContext(InstitutionalContext);
  if (!value) throw new Error("useInstitutional must be used inside InstitutionalProvider.");
  return value;
}
