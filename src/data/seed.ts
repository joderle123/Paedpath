import type {
  AppData,
  ScheduleTemplate,
  Settings,
  Person,
  SchoolClass,
} from "../types";
import { LUX_LOCALITIES } from "./localities";

// --- Standard-Stundenplan (frei änderbar in den Einstellungen) --------------
// Mo 08–12 / 14–16 · Di 08–12 · Mi 08–12 / 14–16 · Do 08–12 · Fr 08–12 / 14–16
export const DEFAULT_SCHEDULE: ScheduleTemplate = {
  days: [
    {
      day: 0,
      enabled: true,
      blocks: [
        { id: "mo-am", start: "08:00", end: "12:00" },
        { id: "mo-pm", start: "14:00", end: "16:00" },
      ],
    },
    {
      day: 1,
      enabled: true,
      blocks: [{ id: "di-am", start: "08:00", end: "12:00" }],
    },
    {
      day: 2,
      enabled: true,
      blocks: [
        { id: "mi-am", start: "08:00", end: "12:00" },
        { id: "mi-pm", start: "14:00", end: "16:00" },
      ],
    },
    {
      day: 3,
      enabled: true,
      blocks: [{ id: "do-am", start: "08:00", end: "12:00" }],
    },
    {
      day: 4,
      enabled: true,
      blocks: [
        { id: "fr-am", start: "08:00", end: "12:00" },
        { id: "fr-pm", start: "14:00", end: "16:00" },
      ],
    },
    { day: 5, enabled: false, blocks: [] },
    { day: 6, enabled: false, blocks: [] },
  ],
};

const AM_BLOCKS = ["mo-am", "di-am", "mi-am", "do-am", "fr-am"];

export const DEFAULT_SETTINGS: Settings = {
  schedule: DEFAULT_SCHEDULE,
  qualifications: [
    { id: "q-edu", label: "Éducateur gradué" },
    { id: "q-inst", label: "Instituteur / Enseignant" },
    { id: "q-autisme", label: "Autismus-Spektrum" },
    { id: "q-comm", label: "Kommunikation / Sprache" },
    { id: "q-soins", label: "Pflege / Soins" },
  ],
  schoolTypes: ["Lycée", "Primärschule", "Précoce", "Cycle 1"],
  weights: { availability: 3, qualification: 3, fairness: 2, distance: 2 },
  defaultRequiredStaff: 2,
  maxDistanceKm: 30,
};

const people: Person[] = [
  // --- Feste Lehrer ---
  mkPerson("p1", "Anne Weber", "teacher", false, "luxembourg", ["q-edu", "q-autisme"]),
  mkPerson("p2", "Marc Schmit", "teacher", true, "hesperange", ["q-inst", "q-comm"]),
  mkPerson("p3", "Lea Hoffmann", "teacher", false, "esch-alzette", ["q-edu", "q-comm"]),
  mkPerson("p4", "Tom Reuter", "teacher", true, "dudelange", ["q-inst", "q-soins"]),
  mkPerson("p5", "Nora Klein", "teacher", false, "mersch", ["q-edu"]),
  mkPerson("p6", "Paul Muller", "teacher", true, "ettelbruck", ["q-inst", "q-autisme"]),
  mkPerson("p7", "Julie Becker", "teacher", false, "lorentzweiler", ["q-comm", "q-edu"]),
  mkPerson("p8", "Nico Weis", "teacher", true, "diekirch", ["q-inst"]),
  // --- Springer / Remplacementer ---
  mkPerson("p9", "Sophie Wagner", "springer", true, "bertrange", ["q-edu", "q-autisme", "q-comm"], []),
  mkPerson("p10", "Ben Thoma", "springer", true, "strassen", ["q-inst", "q-soins"], AM_BLOCKS),
  mkPerson("p11", "Mia Faber", "springer", true, "diekirch", ["q-edu", "q-comm"], []),
  mkPerson("p12", "Luc Simon", "springer", true, "junglinster", ["q-inst", "q-comm"], []),
];

const classes: SchoolClass[] = [
  mkClass("c1", "CP Belair", "luxembourg", "Lycée", ["p1", "p2"], ["q-edu"], "Bât. A · R.12"),
  mkClass("c2", "CP Esch-Centre", "esch-alzette", "Primärschule", ["p3", "p4"], ["q-inst"], "R.4"),
  mkClass("c3", "CP Mersch", "mersch", "Cycle 1", ["p5", "p6"], ["q-edu"], "R.1"),
  mkClass("c4", "CP Diekirch", "diekirch", "Lycée", ["p7", "p8"], ["q-comm"], "Annexe"),
];

export function seedData(): AppData {
  return {
    localities: LUX_LOCALITIES,
    people,
    classes,
    absences: [],
    replacements: [],
    settings: DEFAULT_SETTINGS,
    version: 1,
  };
}

// --- kleine Fabriken --------------------------------------------------------
function mkPerson(
  id: string,
  name: string,
  role: "teacher" | "springer",
  canSubstitute: boolean,
  localityId: string,
  qualifications: string[],
  availabilityBlockIds?: string[]
): Person {
  return {
    id,
    name,
    role,
    canSubstitute,
    localityId,
    qualifications,
    availability: (availabilityBlockIds ?? []).map((blockId) => ({ blockId })),
    active: true,
  };
}

function mkClass(
  id: string,
  name: string,
  localityId: string,
  schoolType: string,
  teacherIds: string[],
  requiredQualifications: string[],
  room?: string
): SchoolClass {
  return {
    id,
    name,
    localityId,
    schoolType,
    room,
    requiredStaff: 2,
    requiredQualifications,
    teacherIds,
    activeBlockIds: [],
  };
}
