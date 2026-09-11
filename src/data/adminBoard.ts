import type { InstitutionKind, PlacementKind } from "./mock";
import { institutions } from "./mock";

export const BOARD_COUNT = 14;
export const WALKTHROUGH_SHOWN = 3;
export const OPEN_PLACEMENTS = 41;

export interface BoardDesk {
  id: string;
  name: string;
  kind: InstitutionKind;
  kindLabel: string;
  walkthrough: boolean;
}

const restOfBoard: BoardDesk[] = [
  { id: "harbor", name: "Harbor Street Capital", kind: "asset-manager", kindLabel: "Asset manager", walkthrough: false },
  { id: "northline", name: "Northline Trust Co.", kind: "bank", kindLabel: "Bank", walkthrough: false },
  { id: "vale", name: "Vale Ridge Credit", kind: "bank", kindLabel: "Bank", walkthrough: false },
  { id: "aster", name: "Aster Municipal Desk", kind: "asset-manager", kindLabel: "Asset manager", walkthrough: false },
  { id: "keel", name: "Keel Partners", kind: "private-markets", kindLabel: "Private markets", walkthrough: false },
  { id: "silverfen", name: "Silverfen SMA", kind: "asset-manager", kindLabel: "Asset manager", walkthrough: false },
  { id: "piedmont", name: "Piedmont Private Bank", kind: "bank", kindLabel: "Bank", walkthrough: false },
  { id: "lantern", name: "Lantern Secondaries", kind: "private-markets", kindLabel: "Private markets", walkthrough: false },
  { id: "brook", name: "Brook & Hale Wealth", kind: "asset-manager", kindLabel: "Asset manager", walkthrough: false },
  { id: "cinder", name: "Cinder Point Lending", kind: "bank", kindLabel: "Bank", walkthrough: false },
  { id: "oriel", name: "Oriel Global Equity", kind: "asset-manager", kindLabel: "Asset manager", walkthrough: false },
];

export const payingBoard: BoardDesk[] = [
  ...institutions.map((firm) => ({
    id: firm.id,
    name: firm.name,
    kind: firm.kind,
    kindLabel: firm.kindLabel,
    walkthrough: true,
  })),
  ...restOfBoard,
];

if (payingBoard.length !== BOARD_COUNT) {
  throw new Error(`ADMIN DATA FAILURE: paying board must have ${BOARD_COUNT} desks, got ${payingBoard.length}.`);
}

if (payingBoard.filter((desk) => desk.walkthrough).length !== WALKTHROUGH_SHOWN) {
  throw new Error(`ADMIN DATA FAILURE: walkthrough desks must equal ${WALKTHROUGH_SHOWN}.`);
}

export const placementMix: { kind: PlacementKind; label: string; count: number; tone: "camel" | "sage" | "ink" }[] = [
  { kind: "strategy", label: "Strategy slots", count: 19, tone: "sage" },
  { kind: "bps", label: "Bps slots", count: 14, tone: "camel" },
  { kind: "special", label: "Special offers", count: 8, tone: "ink" },
];

if (placementMix.reduce((sum, row) => sum + row.count, 0) !== OPEN_PLACEMENTS) {
  throw new Error(`ADMIN DATA FAILURE: placement mix must sum to ${OPEN_PLACEMENTS}.`);
}

/** Illustrated weekly open placements — fixture series, not a warehouse. */
export const placementWeekly = [5, 6, 4, 7, 8, 6, 5];

export function desksByKind(): { kind: InstitutionKind; label: string; count: number; tone: "camel" | "sage" | "ink" }[] {
  const groups: Record<InstitutionKind, { label: string; tone: "camel" | "sage" | "ink" }> = {
    bank: { label: "Banks", tone: "camel" },
    "asset-manager": { label: "Asset managers", tone: "sage" },
    "private-markets": { label: "Private markets", tone: "ink" },
  };
  return (Object.keys(groups) as InstitutionKind[]).map((kind) => ({
    kind,
    label: groups[kind].label,
    tone: groups[kind].tone,
    count: payingBoard.filter((desk) => desk.kind === kind).length,
  }));
}
