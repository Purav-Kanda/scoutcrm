// Tailwind's JIT compiler only picks up class names it can see as full
// literal strings in source — `bg-${accent}-100` would silently fail to
// generate CSS. So instead of building class names dynamically from
// LEAD_STAGES[].accent, every color variant is spelled out here and
// looked up by key. Add a new accent color in both this file and
// LEAD_STAGES if a stage's color needs to change.

export type StageAccent =
  | "slate"
  | "sky"
  | "amber"
  | "violet"
  | "indigo"
  | "emerald"
  | "rose";

interface StageColorSet {
  dot: string; // small solid dot, e.g. in column headers
  chipBg: string; // pill/badge background
  chipText: string; // pill/badge text
  chipBorder: string; // pill/badge border
  cardBorder: string; // left accent border on lead cards
  ring: string; // focus/active ring
}

export const STAGE_COLORS: Record<StageAccent, StageColorSet> = {
  slate: {
    dot: "bg-slate-400",
    chipBg: "bg-slate-100",
    chipText: "text-slate-700",
    chipBorder: "border-slate-200",
    cardBorder: "border-l-slate-300",
    ring: "ring-slate-300",
  },
  sky: {
    dot: "bg-sky-400",
    chipBg: "bg-sky-50",
    chipText: "text-sky-700",
    chipBorder: "border-sky-200",
    cardBorder: "border-l-sky-300",
    ring: "ring-sky-300",
  },
  amber: {
    dot: "bg-amber-400",
    chipBg: "bg-amber-50",
    chipText: "text-amber-700",
    chipBorder: "border-amber-200",
    cardBorder: "border-l-amber-300",
    ring: "ring-amber-300",
  },
  violet: {
    dot: "bg-violet-400",
    chipBg: "bg-violet-50",
    chipText: "text-violet-700",
    chipBorder: "border-violet-200",
    cardBorder: "border-l-violet-300",
    ring: "ring-violet-300",
  },
  indigo: {
    dot: "bg-indigo-400",
    chipBg: "bg-indigo-50",
    chipText: "text-indigo-700",
    chipBorder: "border-indigo-200",
    cardBorder: "border-l-indigo-300",
    ring: "ring-indigo-300",
  },
  emerald: {
    dot: "bg-emerald-400",
    chipBg: "bg-emerald-50",
    chipText: "text-emerald-700",
    chipBorder: "border-emerald-200",
    cardBorder: "border-l-emerald-300",
    ring: "ring-emerald-300",
  },
  rose: {
    dot: "bg-rose-400",
    chipBg: "bg-rose-50",
    chipText: "text-rose-700",
    chipBorder: "border-rose-200",
    cardBorder: "border-l-rose-300",
    ring: "ring-rose-300",
  },
};
