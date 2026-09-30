import { roleActsForClient, type EnrolleeRole } from "./householdContext.ts";

/** Screens in the demo enroll wizard. Optional context stays a handful of steps. */
export type DemoEnrollStep =
  | "fork"
  | "agent"
  | "agent-run"
  | "agent-pause"
  | "behalf"
  | "connect"
  | "returned"
  | "fundrise"
  | "coinbase"
  | "kalshi"
  | "other"
  | "irs"
  | "contact"
  | "household"
  | "estate"
  | "life"
  | "restrictions"
  | "preferences"
  | "risk"
  | "balance"
  | "motive"
  | "focus"
  | "lpoa";

const SELF_TAIL: DemoEnrollStep[] = [
  "connect",
  "returned",
  "fundrise",
  "coinbase",
  "kalshi",
  "other",
  "irs",
  "contact",
  "household",
  "estate",
  "life",
  "restrictions",
  "preferences",
  "risk",
  "balance",
  "motive",
  "focus",
  "lpoa",
];

/** The client path stays under twenty screens, including the existing connectors. */
export function selfEnrollSteps(role: EnrolleeRole, includeLife: boolean): DemoEnrollStep[] {
  const steps: DemoEnrollStep[] = ["fork"];
  if (roleActsForClient(role)) steps.push("behalf");
  for (const step of SELF_TAIL) {
    if (step === "life" && !includeLife) continue;
    steps.push(step);
  }
  return steps;
}

export function agentEnrollSteps(role: EnrolleeRole): DemoEnrollStep[] {
  const steps: DemoEnrollStep[] = ["fork"];
  if (roleActsForClient(role)) steps.push("behalf");
  steps.push("agent", "agent-run", "agent-pause");
  return steps;
}

export function enrollProgress(step: DemoEnrollStep, steps: readonly DemoEnrollStep[]): number {
  const index = steps.indexOf(step);
  if (index <= 0 || steps.length < 2) return 0;
  return Math.round((index / (steps.length - 1)) * 100);
}

/**
 * Gaps the assistant asks on one screen. The step-by-step wizard stays available
 * as a fallback; this list is the default progress.
 */
export const ASSISTANT_CHECKLIST = [
  "custodian",
  "irs",
  "restrictions",
  "preferences",
  "contact",
  "household",
  "estate",
  "risk",
  "balance",
  "motive",
  "focus",
  "lpoa",
] as const;

export type AssistantGap = (typeof ASSISTANT_CHECKLIST)[number];

export function assistantProgress(done: Readonly<Record<AssistantGap, boolean>>): number {
  const finished = ASSISTANT_CHECKLIST.filter((gap) => done[gap]).length;
  return Math.round((finished / ASSISTANT_CHECKLIST.length) * 100);
}
