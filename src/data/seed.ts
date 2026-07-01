import type {
  AppData,
  ScheduleTemplate,
  Settings,
  Person,
  SchoolClass,
  PersonBlock,
  Absence,
  Replacement,
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
    free("mo-pm", "strassen"),
    free("di-am", "strassen"),
    free("mi-am", "strassen"),
    busy("mi-pm", "luxembourg"), // Mi nachmittags belegt
    free("do-am", "strassen"),
    free("fr-am", "strassen"),
    free("fr-pm", "strassen"),
  ]),
  mkPerson("p11", "Mia Faber", "springer", true, "diekirch", [
    free("mo-am", "ettelbruck"),
    free("mo-pm", "diekirch"),
    free("di-am", "diekirch"),
    free("mi-am", "diekirch"),
    free("mi-pm", "diekirch"),
    free("do-am", "diekirch"),
    free("fr-am", "diekirch"),
    free("fr-pm", "diekirch"),
  ]),
  mkPerson("p12", "Luc Simon", "springer", true, "junglinster", [
    free("mo-am", "junglinster"),
    free("mo-pm", "junglinster"),
    free("di-am", "junglinster"),
    free("mi-am", "junglinster"),
    free("mi-pm", "junglinster"),
    free("do-am", "junglinster"),
    free("fr-am", "junglinster"),
    free("fr-pm", "junglinster"),
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

// ---------------------------------------------------------------------------
// Hypothetisches Demo-Szenario — zeigt alle Funktionen der App auf einen Klick:
// mehr Klassen/Standorte auf der Karte, mehrere Ausfälle und bereits
// zugeteilte Ersätze (füllt die Statistik).
// ---------------------------------------------------------------------------
const T = "2026-01-12T08:00:00.000Z";

const demoPeople: Person[] = [
  ...people,
  // zusätzliche feste Lehrer für neue Klassen
  mkPerson("p13", "Sarah Klein", "teacher", false, "grevenmacher"),
  mkPerson("p14", "David Hoffmann", "teacher", false, "echternach"),
  mkPerson("p15", "Claire Weis", "teacher", false, "wiltz"),
  mkPerson("p16", "Georges Thill", "teacher", false, "ettelbruck"),
  // zusätzliche Springer
  mkPerson("p17", "Emma Rausch", "springer", true, "mersch", [
    free("mo-am", "mersch"),
    free("mo-pm", "mersch"),
    free("di-am", "mersch"),
    free("mi-am", "mersch"),
    free("mi-pm", "mersch"),
    free("do-am", "mersch"),
    free("fr-am", "mersch"),
    free("fr-pm", "mersch"),
  ]),
  mkPerson("p18", "Nina Kirsch", "springer", true, "grevenmacher", [
    free("mo-am", "grevenmacher"),
    free("mo-pm", "grevenmacher"),
    free("di-am", "grevenmacher"),
    free("mi-am", "grevenmacher"),
    free("do-am", "junglinster"),
    free("fr-am", "grevenmacher"),
    free("fr-pm", "grevenmacher"),
  ]),
];

const demoClasses: SchoolClass[] = [
  ...classes,
  mkClass("c5", "CP Grevenmacher", "grevenmacher", "Primärschule", ["p13", "p14"], "R.2"),
  mkClass("c6", "CP Wiltz", "wiltz", "Lycée", ["p15", "p16"], "Bloc B"),
];

const demoAbsences: Absence[] = [
  { id: "a1", personId: "p1", blockIds: ["mo-am"], note: "Krankheit", createdAt: T },
  { id: "a2", personId: "p3", blockIds: ["di-am"], note: "Fortbildung", createdAt: T },
  { id: "a3", personId: "p5", blockIds: ["mi-am", "mi-pm"], note: "Arzttermin", createdAt: T },
  { id: "a4", personId: "p6", blockIds: ["do-am"], createdAt: T },
  { id: "a5", personId: "p8", blockIds: ["fr-am"], note: "Urlaub", createdAt: T },
  { id: "a6", personId: "p13", blockIds: ["mo-am"], createdAt: T },
  { id: "a7", personId: "p15", blockIds: ["di-am"], note: "Krankheit", createdAt: T },
];

const rep = (
  id: string,
  classId: string,
  blockId: string,
  absentPersonId: string,
  substituteId: string
): Replacement => ({ id, classId, blockId, absentPersonId, substituteId, createdAt: T });

const demoReplacements: Replacement[] = [
  // Ein Teil ist bereits gedeckt (zeigt den Status "gedeckt")...
  rep("r1", "c1", "mo-am", "p1", "p10"), // Ben deckt CP Belair
  rep("r2", "c2", "di-am", "p3", "p9"), // Sophie deckt Esch
  rep("r3", "c3", "mi-am", "p5", "p12"), // Luc deckt Mersch
  rep("r4", "c3", "mi-pm", "p5", "p9"), // Sophie deckt Mersch Nachmittag
  // ...der Rest bleibt offen -> die App zeigt automatisch die beste Wahl:
  //   c3 do-am (p6), c4 fr-am (p8), c5 mo-am (p13), c6 di-am (p15)
];

export function demoScenario(): AppData {
  return {
    localities: LUX_LOCALITIES,
    people: demoPeople,
    classes: demoClasses,
    absences: demoAbsences,
    replacements: demoReplacements,
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
