// ---------------------------------------------------------------------------
// Domänen-Modell für die CDSE Classe-de-participation Planung
// UI-Texte sind Deutsch, Fachbegriffe bleiben französisch.
// Springer-Bewertung ausschließlich nach: Verfügbarkeit + Distanz.
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

export type PersonRole = "teacher" | "springer";

/**
 * Der Stundenplan-Eintrag einer Person für einen Block:
 * wo sie in diesem Block ist und ob sie belegt (nicht abkömmlich) ist.
 * Kein Eintrag für einen Block = Status unbekannt (gilt als grundsätzlich frei).
 */
export interface PersonBlock {
  blockId: string;
  busy: boolean; // true = bereits in einer Klasse/anderweitig belegt
  localityId?: string; // Aufenthaltsort in diesem Block (für Distanz)
}

export interface Person {
  id: ID;
  name: string;
  role: PersonRole; // Hauptrolle
  canSubstitute: boolean; // darf einspringen
  localityId?: string; // Basis/Wohnort — Fallback-Aufenthaltsort
  /** Individueller Wochenplan: pro Block Ort + belegt/frei. */
  schedule: PersonBlock[];
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

export interface Weights {
  availability: number;
  distance: number;
}

export interface Settings {
  schedule: ScheduleTemplate;
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
