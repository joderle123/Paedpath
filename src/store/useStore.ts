import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type {
  AppData,
  Person,
  SchoolClass,
  Absence,
  Replacement,
  Locality,
  Settings,
  ScheduleTemplate,
  Weights,
} from "../types";
import { seedData } from "../data/seed";

interface StoreState extends AppData {
  // Personen
  addPerson: (p: Omit<Person, "id">) => Person;
  updatePerson: (id: string, patch: Partial<Person>) => void;
  removePerson: (id: string) => void;
  // Klassen
  addClass: (c: Omit<SchoolClass, "id">) => SchoolClass;
  updateClass: (id: string, patch: Partial<SchoolClass>) => void;
  removeClass: (id: string) => void;
  // Abwesenheiten
  addAbsence: (a: Omit<Absence, "id" | "createdAt">) => Absence;
  removeAbsence: (id: string) => void;
  // Ersatz
  addReplacement: (r: Omit<Replacement, "id" | "createdAt">) => Replacement;
  removeReplacement: (id: string) => void;
  clearReplacementsFor: (classId: string, blockId: string) => void;
  // Ortschaften
  addLocality: (l: Locality) => void;
  // Einstellungen
  updateSettings: (patch: Partial<Settings>) => void;
  updateWeights: (patch: Partial<Weights>) => void;
  setSchedule: (schedule: ScheduleTemplate) => void;
  setSchoolTypes: (t: string[]) => void;
  // Datenverwaltung
  exportJson: () => string;
  importJson: (raw: string) => { ok: boolean; error?: string };
  resetToSeed: () => void;
}

const initial = seedData();

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initial,

      addPerson: (p) => {
        const person: Person = { ...p, id: uuid() };
        set((s) => ({ people: [...s.people, person] }));
        return person;
      },
      updatePerson: (id, patch) =>
        set((s) => ({
          people: s.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removePerson: (id) =>
        set((s) => ({
          people: s.people.filter((p) => p.id !== id),
          classes: s.classes.map((c) => ({
            ...c,
            teacherIds: c.teacherIds.filter((t) => t !== id),
          })),
          absences: s.absences.filter((a) => a.personId !== id),
          replacements: s.replacements.filter(
            (r) => r.substituteId !== id && r.absentPersonId !== id
          ),
        })),

      addClass: (c) => {
        const cls: SchoolClass = { ...c, id: uuid() };
        set((s) => ({ classes: [...s.classes, cls] }));
        return cls;
      },
      updateClass: (id, patch) =>
        set((s) => ({
          classes: s.classes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeClass: (id) =>
        set((s) => ({
          classes: s.classes.filter((c) => c.id !== id),
          replacements: s.replacements.filter((r) => r.classId !== id),
        })),

      addAbsence: (a) => {
        const absence: Absence = {
          ...a,
          id: uuid(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ absences: [...s.absences, absence] }));
        return absence;
      },
      removeAbsence: (id) =>
        set((s) => ({ absences: s.absences.filter((a) => a.id !== id) })),

      addReplacement: (r) => {
        const rep: Replacement = {
          ...r,
          id: uuid(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          // pro (Klasse, Block) nur einen Ersatz je absenter Person zulassen
          replacements: [
            ...s.replacements.filter(
              (x) =>
                !(
                  x.classId === r.classId &&
                  x.blockId === r.blockId &&
                  x.absentPersonId === r.absentPersonId
                )
            ),
            rep,
          ],
        }));
        return rep;
      },
      removeReplacement: (id) =>
        set((s) => ({
          replacements: s.replacements.filter((r) => r.id !== id),
        })),
      clearReplacementsFor: (classId, blockId) =>
        set((s) => ({
          replacements: s.replacements.filter(
            (r) => !(r.classId === classId && r.blockId === blockId)
          ),
        })),

      addLocality: (l) =>
        set((s) =>
          s.localities.some((x) => x.id === l.id)
            ? s
            : { localities: [...s.localities, l] }
        ),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      updateWeights: (patch) =>
        set((s) => ({
          settings: { ...s.settings, weights: { ...s.settings.weights, ...patch } },
        })),
      setSchedule: (schedule) =>
        set((s) => ({ settings: { ...s.settings, schedule } })),
      setSchoolTypes: (schoolTypes) =>
        set((s) => ({ settings: { ...s.settings, schoolTypes } })),

      exportJson: () => {
        const s = get();
        const data: AppData = {
          localities: s.localities,
          people: s.people,
          classes: s.classes,
          absences: s.absences,
          replacements: s.replacements,
          settings: s.settings,
          version: s.version,
        };
        return JSON.stringify(data, null, 2);
      },
      importJson: (raw) => {
        try {
          const data = JSON.parse(raw) as Partial<AppData>;
          if (!data.people || !data.classes || !data.settings) {
            return { ok: false, error: "Ungültige Datei: Felder fehlen." };
          }
          set({
            localities: data.localities ?? initial.localities,
            people: data.people,
            classes: data.classes,
            absences: data.absences ?? [],
            replacements: data.replacements ?? [],
            settings: data.settings,
            version: data.version ?? 1,
          });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: "Datei ist kein gültiges JSON." };
        }
      },
      resetToSeed: () => set({ ...seedData() }),
    }),
    { name: "cdse-planner-v2" }
  )
);
