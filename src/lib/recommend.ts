import type {
  Person,
  SchoolClass,
  Replacement,
  Absence,
  Locality,
  Settings,
  ID,
  PersonBlock,
} from "../types";
import { haversineKm } from "./geo";
import { classRunsInBlock } from "./schedule";

export interface CandidateScore {
  person: Person;
  total: number; // 0..1
  availabilityScore: number;
  distanceScore: number;
  distanceKm?: number;
  fromLocalityId?: string; // wo die Person in diesem Block ist
  isPlanned: boolean; // Verfügbarkeit im eigenen Plan bestätigt
  substitutionCount: number; // nur informativ (für Statistik)
}

export interface RecommendContext {
  people: Person[];
  classes: SchoolClass[];
  replacements: Replacement[];
  absences: Absence[];
  localities: Locality[];
  settings: Settings;
}

/** Personen, die in diesem Block bereits gebunden sind (hart ausgeschlossen). */
function busyPersonIds(blockId: string, ctx: RecommendContext): Set<ID> {
  const busy = new Set<ID>();
  // Feste Lehrer einer Klasse, die in diesem Block läuft
  for (const cls of ctx.classes) {
    if (!classRunsInBlock(cls, blockId)) continue;
    for (const tid of cls.teacherIds) busy.add(tid);
  }
  // Bereits als Ersatz eingeteilt in diesem Block
  for (const r of ctx.replacements) {
    if (r.blockId === blockId) busy.add(r.substituteId);
  }
  // In diesem Block abwesend gemeldet
  for (const a of ctx.absences) {
    if (a.blockIds.includes(blockId)) busy.add(a.personId);
  }
  return busy;
}

export function substitutionCountFor(
  personId: ID,
  replacements: Replacement[]
): number {
  return replacements.filter((r) => r.substituteId === personId).length;
}

function blockEntry(p: Person, blockId: string): PersonBlock | undefined {
  return p.schedule?.find((s) => s.blockId === blockId);
}

/**
 * Bewertet alle möglichen Springer für einen Ausfall (Klasse + Block) und
 * liefert sie absteigend sortiert. Bewertung ausschließlich nach:
 *   1. Verfügbarkeit (eigener Stundenplan — belegte Blöcke fallen raus)
 *   2. Distanz vom aktuellen Aufenthaltsort zur Schule in Not
 */
export function recommendSubstitutes(
  targetClass: SchoolClass,
  blockId: string,
  absentPersonId: ID | undefined,
  ctx: RecommendContext
): CandidateScore[] {
  const { people, localities, settings } = ctx;
  const w = settings.weights;
  const busy = busyPersonIds(blockId, ctx);

  const classLoc = targetClass.localityId
    ? localities.find((l) => l.id === targetClass.localityId)
    : undefined;

  // Kandidaten: dürfen einspringen, aktiv, nicht die abwesende Person,
  // nicht anderweitig gebunden, im eigenen Plan an diesem Block nicht belegt.
  const pool = people.filter((p) => {
    if (!p.active || !p.canSubstitute) return false;
    if (p.id === absentPersonId) return false;
    if (busy.has(p.id)) return false;
    if (targetClass.teacherIds.includes(p.id)) return false;
    const entry = blockEntry(p, blockId);
    if (entry?.busy) return false; // im eigenen Plan als belegt markiert
    return true;
  });

  const wSum = w.availability + w.distance || 1;

  const scored: CandidateScore[] = pool.map((p) => {
    const entry = blockEntry(p, blockId);

    // Verfügbarkeit: im eigenen Plan bestätigt frei = 1, sonst unbekannt = 0.6
    const isPlanned = !!entry && !entry.busy;
    const availabilityScore = isPlanned ? 1 : 0.6;

    // Aufenthaltsort in diesem Block: Plan-Ort, sonst Basis/Wohnort
    const fromLocalityId = entry?.localityId ?? p.localityId;
    let distanceKm: number | undefined;
    let distanceScore = 0.5; // neutral, wenn keine Koordinaten
    if (classLoc && fromLocalityId) {
      const from = localities.find((l) => l.id === fromLocalityId);
      if (from) {
        distanceKm = haversineKm(from, classLoc);
        distanceScore =
          1 - Math.min(1, distanceKm / Math.max(1, settings.maxDistanceKm));
      }
    }

    const total =
      (w.availability * availabilityScore + w.distance * distanceScore) / wSum;

    return {
      person: p,
      total,
      availabilityScore,
      distanceScore,
      distanceKm,
      fromLocalityId,
      isPlanned,
      substitutionCount: substitutionCountFor(p.id, ctx.replacements),
    };
  });

  scored.sort((a, b) => b.total - a.total);
  return scored;
}
