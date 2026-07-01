import type {
  Person,
  SchoolClass,
  Replacement,
  Absence,
  ScheduleTemplate,
} from "../types";
import { blockHours, classRunsInBlock, findSlot } from "./schedule";

export interface PersonStat {
  person: Person;
  substitutions: number;
  substituteHours: number;
  absences: number;
  absentHours: number;
}

export function personStats(
  people: Person[],
  replacements: Replacement[],
  absences: Absence[],
  schedule: ScheduleTemplate
): PersonStat[] {
  return people
    .map((person) => {
      const subs = replacements.filter((r) => r.substituteId === person.id);
      const substituteHours = subs.reduce((sum, r) => {
        const slot = findSlot(schedule, r.blockId);
        return sum + (slot ? blockHours(slot.block) : 0);
      }, 0);

      const abs = absences.filter((a) => a.personId === person.id);
      const absentHours = abs.reduce((sum, a) => {
        return (
          sum +
          a.blockIds.reduce((s, bid) => {
            const slot = findSlot(schedule, bid);
            return s + (slot ? blockHours(slot.block) : 0);
          }, 0)
        );
      }, 0);

      return {
        person,
        substitutions: subs.length,
        substituteHours,
        absences: abs.length,
        absentHours,
      };
    })
    .sort((a, b) => b.substitutions - a.substitutions);
}

export interface ClassStat {
  cls: SchoolClass;
  slotCount: number;
  requiredStaffHours: number;
  replacementsReceived: number;
}

export function classStats(
  classes: SchoolClass[],
  replacements: Replacement[],
  schedule: ScheduleTemplate
): ClassStat[] {
  return classes.map((cls) => {
    let slotCount = 0;
    let requiredStaffHours = 0;
    for (const d of schedule.days) {
      if (!d.enabled) continue;
      for (const block of d.blocks) {
        if (!classRunsInBlock(cls, block.id)) continue;
        slotCount += 1;
        requiredStaffHours += blockHours(block) * cls.requiredStaff;
      }
    }
    return {
      cls,
      slotCount,
      requiredStaffHours,
      replacementsReceived: replacements.filter((r) => r.classId === cls.id)
        .length,
    };
  });
}
