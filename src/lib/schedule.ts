import type { ScheduleTemplate, TimeBlock, SchoolClass } from "../types";

export const DAY_NAMES = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];
export const DAY_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export interface Slot {
  day: number;
  block: TimeBlock;
}

/** Alle aktiven Blöcke des Stundenplans als flache, geordnete Liste. */
export function allSlots(schedule: ScheduleTemplate): Slot[] {
  const slots: Slot[] = [];
  for (const d of schedule.days) {
    if (!d.enabled) continue;
    for (const block of d.blocks) {
      slots.push({ day: d.day, block });
    }
  }
  return slots;
}

/** Findet einen Block anhand seiner id und liefert Tag + Block. */
export function findSlot(
  schedule: ScheduleTemplate,
  blockId: string
): Slot | undefined {
  for (const d of schedule.days) {
    for (const block of d.blocks) {
      if (block.id === blockId) return { day: d.day, block };
    }
  }
  return undefined;
}

/** Dauer eines Blocks in Stunden (z.B. 08:00–12:00 = 4). */
export function blockHours(block: TimeBlock): number {
  const [sh, sm] = block.start.split(":").map(Number);
  const [eh, em] = block.end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  return Math.max(0, mins / 60);
}

export function slotLabel(slot: Slot): string {
  return `${DAY_SHORT[slot.day]} ${slot.block.start}–${slot.block.end}`;
}

/** Läuft die Klasse in diesem Block? Leere activeBlockIds = alle Blöcke. */
export function classRunsInBlock(cls: SchoolClass, blockId: string): boolean {
  if (!cls.activeBlockIds || cls.activeBlockIds.length === 0) return true;
  return cls.activeBlockIds.includes(blockId);
}
