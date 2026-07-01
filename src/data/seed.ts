import type {
  AppData,
  ScheduleTemplate,
  Settings,
  Person,
  SchoolClass,
  PersonBlock,
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

export const DEFAULT_SETTINGS: Settings = {
  schedule: DEFAULT_SCHEDULE,
  schoolTypes: ["Lycée", "Primärschule", "Précoce", "Cycle 1"],
  weights: { availability: 3, distance: 3 },
  defaultRequiredStaff: 2,
  maxDistanceKm: 30,
};

// Stundenplan-Helfer: frei / belegt an einem Ort
const free = (blockId: string, localityId: string): PersonBlock => ({
  blockId,
  busy: false,
  localityId,
});
const busy = (blockId: string, localityId: string): PersonBlock => ({
  blockId,
  busy: true,
  localityId,
});

const people: Person[] = [
  // --- Feste Lehrer (den ganzen Tag in ihrer Klasse) ---
  mkPerson("p1", "Anne Weber", "teacher", false, "luxembourg"),
  mkPerson("p2", "Marc Schmit", "teacher", false, "hesperange"),
  mkPerson("p3", "Lea Hoffmann", "teacher", false, "esch-alzette"),
  mkPerson("p4", "Tom Reuter", "teacher", false, "dudelange"),
  mkPerson("p5", "Nora Klein", "teacher", false, "mersch"),
  mkPerson("p6", "Paul Muller", "teacher", false, "ettelbruck"),
  mkPerson("p7", "Julie Becker", "teacher", false, "lorentzweiler"),
  mkPerson("p8", "Nico Weis", "teacher", false, "diekirch"),
  // --- Springer / Remplacementer mit individuellem Wochenplan ---
  mkPerson("p9", "Sophie Wagner", "springer", true, "bertrange", [
    busy("mo-am", "esch-alzette"), // Mo morgens schon in Esch im Einsatz
    free("mo-pm", "bertrange"),
    free("di-am", "bertrange"),
    free("mi-am", "bertrange"),
    free("mi-pm", "bertrange"),
    free("do-am", "luxembourg"), // Do morgens in Luxembourg unterwegs
    free("fr-am", "bertrange"),
    free("fr-pm", "bertrange"),
  ]),
  mkPerson("p10", "Ben Thoma", "springer", true, "strassen", [
    free("mo-am", "strassen"),
    free("di-am", "strassen"),
    free("mi-am", "strassen"),
    busy("mi-pm", "luxembourg"), // Mi nachmittags belegt
    free("do-am", "strassen"),
    free("fr-am", "strassen"),
  ]),
  mkPerson("p11", "Mia Faber", "springer", true, "diekirch", [
    free("mo-am", "ettelbruck"),
    free("di-am", "diekirch"),
    free("mi-am", "diekirch"),
    free("do-am", "diekirch"),
    free("fr-am", "diekirch"),
  ]),
  mkPerson("p12", "Luc Simon", "springer", true, "junglinster", [
    free("mo-am", "junglinster"),
    free("mo-pm", "junglinster"),
    free("di-am", "junglinster"),
    free("mi-am", "junglinster"),
    free("do-am", "junglinster"),
    free("fr-am", "junglinster"),
  ]),
];

const classes: SchoolClass[] = [
  mkClass("c1", "CP Belair", "luxembourg", "Lycée", ["p1", "p2"], "Bât. A · R.12"),
  mkClass("c2", "CP Esch-Centre", "esch-alzette", "Primärschule", ["p3", "p4"], "R.4"),
  mkClass("c3", "CP Mersch", "mersch", "Cycle 1", ["p5", "p6"], "R.1"),
  mkClass("c4", "CP Diekirch", "diekirch", "Lycée", ["p7", "p8"], "Annexe"),
];

export function seedData(): AppData {
  return {
    localities: LUX_LOCALITIES,
    people,
    classes,
    absences: [],
    replacements: [],
    settings: DEFAULT_SETTINGS,
    version: 2,
  };
}

// --- kleine Fabriken --------------------------------------------------------
function mkPerson(
  id: string,
  name: string,
  role: "teacher" | "springer",
  canSubstitute: boolean,
  localityId: string,
  schedule: PersonBlock[] = []
): Person {
  return { id, name, role, canSubstitute, localityId, schedule, active: true };
}

function mkClass(
  id: string,
  name: string,
  localityId: string,
  schoolType: string,
  teacherIds: string[],
  room?: string
): SchoolClass {
  return {
    id,
    name,
    localityId,
    schoolType,
    room,
    requiredStaff: 2,
    teacherIds,
    activeBlockIds: [],
  };
}
