import type {
  Person,
  SchoolClass,
  Replacement,
  Absence,
  Locality,
  Settings,
  ID,
} from "../types";
import { haversineKm } from "./geo";
import { classRunsInBlock } from "./schedule";

export interface CandidateScore {
  person: Person;
  total: number; // 0..1
  availabilityScore: number;
  qualificationScore: number;
  fairnessScore: number;
  distanceScore: number;
  distanceKm?: number;
  isQualified: boolean;
  isOnContract: boolean; // regulär an diesem Block verfügbar
  substitutionCount: number;
  missingQualifications: string[];
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
function busyPersonIds(
  blockId: string,
  ctx: RecommendContext,
  excludeClassId?: ID
): Set<ID> {
  const busy = new Set<ID>();
  // Feste Lehrer einer Klasse, die in diesem Block läuft
  for (const cls of ctx.classes) {
    if (cls.id === excludeClassId) continue;
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

/** Wie oft ist die Person bereits eingesprungen? */
export function substitutionCountFor(
  personId: ID,
  replacements: Replacement[]
): number {
  return replacements.filter((r) => r.substituteId === personId).length;
}

/**
 * Bewertet alle möglichen Springer für einen Ausfall (Klasse + Block) und
 * liefert sie absteigend sortiert. Der erste Eintrag ist "die beste Wahl".
 */
export function recommendSubstitutes(
  targetClass: SchoolClass,
  blockId: string,
  absentPersonId: ID | undefined,
  ctx: RecommendContext
): CandidateScore[] {
  const { people, replacements, localities, settings } = ctx;
  const w = settings.weights;
  const busy = busyPersonIds(blockId, ctx, undefined);

  const classLoc = targetClass.localityId
    ? localities.find((l) => l.id === targetClass.localityId)
    : undefined;

  const reqQuals = targetClass.requiredQualifications ?? [];

  // Kandidatenpool
  const pool = people.filter(
    (p) =>
      p.active &&
      p.canSubstitute &&
      p.id !== absentPersonId &&
      !busy.has(p.id) &&
      !targetClass.teacherIds.includes(p.id)
  );

  // Vorberechnung für Normierung
  const counts = new Map<ID, number>();
  for (const p of pool)
    counts.set(p.id, substitutionCountFor(p.id, replacements));
  const maxCount = Math.max(1, ...[...counts.values()]);

  const scored: CandidateScore[] = pool.map((p) => {
    // Verfügbarkeit (weich): regulär an diesem Block eingeteilt?
    const onContract =
      p.availability.length === 0 ||
      p.availability.some((a) => a.blockId === blockId);
    const availabilityScore = onContract ? 1 : 0.3;

    // Qualifikation
    const missing = reqQuals.filter((q) => !p.qualifications.includes(q));
    const qualificationScore =
      reqQuals.length === 0
        ? 1
        : (reqQuals.length - missing.length) / reqQuals.length;

    // Faire Verteilung: weniger Einsätze = besser
    const count = counts.get(p.id) ?? 0;
    const fairnessScore = 1 - count / maxCount;

    // Distanz
    let distanceKm: number | undefined;
    let distanceScore = 0.5; // neutral, wenn keine Koordinaten
    if (classLoc && p.localityId) {
      const home = localities.find((l) => l.id === p.localityId);
      if (home) {
        distanceKm = haversineKm(home, classLoc);
        distanceScore =
          1 - Math.min(1, distanceKm / Math.max(1, settings.maxDistanceKm));
      }
    }

    const wSum = w.availability + w.qualification + w.fairness + w.distance || 1;
    const total =
      (w.availability * availabilityScore +
        w.qualification * qualificationScore +
        w.fairness * fairnessScore +
        w.distance * distanceScore) /
      wSum;

    return {
      person: p,
      total,
      availabilityScore,
      qualificationScore,
      fairnessScore,
      distanceScore,
      distanceKm,
      isQualified: missing.length === 0,
      isOnContract: onContract,
      substitutionCount: count,
      missingQualifications: missing,
    };
  });

  scored.sort((a, b) => b.total - a.total);
  return scored;
}
