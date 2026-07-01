// ---------------------------------------------------------------------------
// Domänen-Modell für die CDSE Classe-de-participation Planung
// UI-Texte sind Deutsch, Fachbegriffe bleiben französisch.
// ---------------------------------------------------------------------------

export type ID = string;

/** Eine Luxemburger Ortschaft mit Koordinaten für die Distanzberechnung. */
export interface Locality {
  id: string; // slug, z.B. "esch-alzette"
  name: string;
  lat: number;
  lon: number;
  canton?: string;
}

/** Ein Zeitblock innerhalb eines Tages, z.B. 08:00–12:00. */
export interface TimeBlock {
  id: string; // global eindeutig, kodiert implizit Tag+Zeit
  start: string; // "08:00"
  end: string; // "12:00"
}

/** Der Stundenplan eines Wochentags. */
export interface DaySchedule {
  day: number; // 0 = Montag ... 6 = Sonntag
  enabled: boolean;
  blocks: TimeBlock[];
}

export interface ScheduleTemplate {
  days: DaySchedule[];
}

/** Verfügbarkeit einer Person: an welchen Blöcken sie regulär arbeitet. */
export interface Availability {
  blockId: string;
}

export type PersonRole = "teacher" | "springer";

export interface Person {
  id: ID;
  name: string;
  role: PersonRole; // Hauptrolle
  canSubstitute: boolean; // darf einspringen
  localityId?: string; // Wohnort / Basis für Distanz
  qualifications: string[]; // qualification ids
  /** Blöcke, an denen die Person regulär verfügbar ist. Leer = immer verfügbar. */
  availability: Availability[];
  weeklyHours?: number;
  color?: string;
  active: boolean;
  note?: string;
}

export interface SchoolClass {
  id: ID;
  name: string;
  localityId?: string; // Standort der Klasse
  schoolType: string; // "Lycée" | "Primärschule" | frei
  room?: string;
  requiredStaff: number; // Guideline: 2
  requiredQualifications: string[];
  teacherIds: ID[]; // feste Lehrer (den ganzen Tag)
  /** Blöcke, an denen die Klasse läuft. Leer = alle aktiven Blöcke. */
  activeBlockIds: string[];
  color?: string;
}

export interface Absence {
  id: ID;
  personId: ID;
  blockIds: string[]; // betroffene Blöcke (kodieren Tag+Zeit)
  date?: string; // optionales konkretes Datum (ISO)
  note?: string;
  createdAt: string;
}

/** Ein konkret zugewiesener Ersatz für einen Ausfall in einem Block. */
export interface Replacement {
  id: ID;
  classId: ID;
  blockId: string;
  absentPersonId: ID;
  substituteId: ID;
  date?: string;
  createdAt: string;
}

export interface Qualification {
  id: string;
  label: string;
}

export interface Weights {
  availability: number;
  qualification: number;
  fairness: number;
  distance: number;
}

export interface Settings {
  schedule: ScheduleTemplate;
  qualifications: Qualification[];
  schoolTypes: string[];
  weights: Weights;
  defaultRequiredStaff: number;
  maxDistanceKm: number; // Distanz-Normierung / Obergrenze
}

/** Der gesamte persistierte Zustand (für Export/Import). */
export interface AppData {
  localities: Locality[];
  people: Person[];
  classes: SchoolClass[];
  absences: Absence[];
  replacements: Replacement[];
  settings: Settings;
  version: number;
}
