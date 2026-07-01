import { useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { useStore } from "../store/useStore";
import { PageHeader, Field } from "../components/ui";
import type { Weights } from "../types";
import { DAY_NAMES } from "../lib/schedule";
import {
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Sliders,
  CalendarClock,
  Tags,
  MapPinPlus,
  Database,
} from "lucide-react";

const WEIGHT_LABELS: { key: keyof Weights; label: string; desc: string }[] = [
  { key: "availability", label: "Verfügbarkeit", desc: "Regulär an dem Block eingeteilt" },
  { key: "qualification", label: "Qualifikation", desc: "Passende Kompetenzen für die Klasse" },
  { key: "fairness", label: "Faire Verteilung", desc: "Wenig-Eingesprungene bevorzugen" },
  { key: "distance", label: "Distanz", desc: "Kurzer Weg zum Standort" },
];

export default function Settings() {
  const store = useStore();
  const {
    settings,
    localities,
    updateWeights,
    updateSettings,
    setSchedule,
    setQualifications,
    setSchoolTypes,
    addLocality,
    exportJson,
    importJson,
    resetToSeed,
  } = store;
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string>("");

  // Stundenplan bearbeiten
  function updateBlock(
    day: number,
    blockId: string,
    patch: { start?: string; end?: string }
  ) {
    setSchedule({
      days: settings.schedule.days.map((d) =>
        d.day === day
          ? {
              ...d,
              blocks: d.blocks.map((b) =>
                b.id === blockId ? { ...b, ...patch } : b
              ),
            }
          : d
      ),
    });
  }
  function addBlock(day: number) {
    setSchedule({
      days: settings.schedule.days.map((d) =>
        d.day === day
          ? {
              ...d,
              enabled: true,
              blocks: [
                ...d.blocks,
                { id: uuid().slice(0, 8), start: "08:00", end: "12:00" },
              ],
            }
          : d
      ),
    });
  }
  function removeBlock(day: number, blockId: string) {
    setSchedule({
      days: settings.schedule.days.map((d) =>
        d.day === day
          ? { ...d, blocks: d.blocks.filter((b) => b.id !== blockId) }
          : d
      ),
    });
  }
  function toggleDay(day: number, enabled: boolean) {
    setSchedule({
      days: settings.schedule.days.map((d) =>
        d.day === day ? { ...d, enabled } : d
      ),
    });
  }

  function doExport() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cdse-plan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importJson(String(reader.result));
      setMsg(res.ok ? "Daten importiert ✓" : res.error ?? "Fehler");
      setTimeout(() => setMsg(""), 4000);
    };
    reader.readAsText(file);
  }

  return (
    <div className="p-6 max-w-5xl">
      <PageHeader
        title="Einstellungen"
        subtitle="Alles konfigurierbar — Gewichtung, Stundenplan, Qualifikationen, Daten."
      />

      {/* Gewichtung */}
      <Section icon={<Sliders size={16} />} title="Gewichtung der Springer-Empfehlung">
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          {WEIGHT_LABELS.map((w) => (
            <div key={w.key}>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-ink">{w.label}</span>
                <span
                  className="text-cyan font-bold"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {settings.weights[w.key]}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                step={1}
                value={settings.weights[w.key]}
                onChange={(e) =>
                  updateWeights({ [w.key]: Number(e.target.value) } as Partial<Weights>)
                }
                className="w-full accent-cyan"
              />
              <div className="text-xs text-faint">{w.desc}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-8 mt-6">
          <Field label="Standard-Betreuer pro Klasse">
            <input
              type="number"
              min={1}
              className="input"
              value={settings.defaultRequiredStaff}
              onChange={(e) =>
                updateSettings({
                  defaultRequiredStaff: Math.max(1, Number(e.target.value) || 1),
                })
              }
            />
          </Field>
          <Field label="Distanz-Obergrenze (km)" hint="Ab hier zählt Distanz als 0.">
            <input
              type="number"
              min={1}
              className="input"
              value={settings.maxDistanceKm}
              onChange={(e) =>
                updateSettings({
                  maxDistanceKm: Math.max(1, Number(e.target.value) || 1),
                })
              }
            />
          </Field>
        </div>
      </Section>

      {/* Stundenplan */}
      <Section icon={<CalendarClock size={16} />} title="Stundenplan-Vorlage">
        <div className="space-y-3">
          {settings.schedule.days.map((d) => (
            <div key={d.day} className="panel p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.enabled}
                    onChange={(e) => toggleDay(d.day, e.target.checked)}
                  />
                  <span className="font-medium">{DAY_NAMES[d.day]}</span>
                </label>
                <button
                  className="btn btn-ghost !py-1 !px-2 text-xs"
                  onClick={() => addBlock(d.day)}
                >
                  <Plus size={13} /> Block
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {d.blocks.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-1 panel !bg-abyss px-2 py-1"
                  >
                    <input
                      type="time"
                      value={b.start}
                      onChange={(e) =>
                        updateBlock(d.day, b.id, { start: e.target.value })
                      }
                      className="bg-transparent text-ink text-sm outline-none"
                      style={{ fontFamily: "var(--font-mono)" }}
                    />
                    <span className="text-faint">–</span>
                    <input
                      type="time"
                      value={b.end}
                      onChange={(e) =>
                        updateBlock(d.day, b.id, { end: e.target.value })
                      }
                      className="bg-transparent text-ink text-sm outline-none"
                      style={{ fontFamily: "var(--font-mono)" }}
                    />
                    <button
                      className="text-faint hover:text-rose ml-1"
                      onClick={() => removeBlock(d.day, b.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {d.blocks.length === 0 && (
                  <span className="text-xs text-faint">keine Blöcke</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Qualifikationen & Schultypen */}
      <Section icon={<Tags size={16} />} title="Qualifikationen & Schultypen">
        <div className="grid grid-cols-2 gap-8">
          <TagEditor
            label="Qualifikationen"
            items={settings.qualifications.map((q) => q.label)}
            onAdd={(label) =>
              setQualifications([
                ...settings.qualifications,
                { id: uuid().slice(0, 8), label },
              ])
            }
            onRemove={(i) =>
              setQualifications(settings.qualifications.filter((_, x) => x !== i))
            }
          />
          <TagEditor
            label="Schultypen"
            items={settings.schoolTypes}
            onAdd={(t) => setSchoolTypes([...settings.schoolTypes, t])}
            onRemove={(i) =>
              setSchoolTypes(settings.schoolTypes.filter((_, x) => x !== i))
            }
          />
        </div>
      </Section>

      {/* Ortschaft ergänzen */}
      <Section icon={<MapPinPlus size={16} />} title="Ortschaft ergänzen">
        <LocalityAdder
          count={localities.length}
          onAdd={(name, lat, lon) =>
            addLocality({
              id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              name,
              lat,
              lon,
            })
          }
        />
      </Section>

      {/* Daten */}
      <Section icon={<Database size={16} />} title="Daten sichern & laden">
        {msg && (
          <div className="chip border-cyan-dim text-cyan mb-3">{msg}</div>
        )}
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={doExport}>
            <Download size={16} /> Als Datei exportieren
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Datei importieren
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={onImportFile}
          />
          <button
            className="btn btn-danger"
            onClick={() =>
              confirm(
                "Alle Daten auf Beispiel-Stand zurücksetzen? Nicht umkehrbar."
              ) && resetToSeed()
            }
          >
            <RotateCcw size={16} /> Zurücksetzen
          </button>
        </div>
        <div className="text-xs text-faint mt-3">
          Daten liegen lokal im Browser. Für Backup/Weitergabe die Export-Datei
          nutzen.
        </div>
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-5 mb-5">
      <div className="flex items-center gap-2 mb-4 text-cyan">
        {icon}
        <span className="font-semibold text-ink">{title}</span>
      </div>
      {children}
    </div>
  );
}

function TagEditor({
  label,
  items,
  onAdd,
  onRemove,
}: {
  label: string;
  items: string[];
  onAdd: (v: string) => void;
  onRemove: (i: number) => void;
}) {
  const [val, setVal] = useState("");
  return (
    <div>
      <div className="label-tech mb-2">{label}</div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((it, i) => (
          <span key={i} className="chip">
            {it}
            <button
              className="text-faint hover:text-rose ml-1"
              onClick={() => onRemove(i)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input"
          value={val}
          placeholder="Neu…"
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && val.trim()) {
              onAdd(val.trim());
              setVal("");
            }
          }}
        />
        <button
          className="btn"
          onClick={() => {
            if (val.trim()) {
              onAdd(val.trim());
              setVal("");
            }
          }}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function LocalityAdder({
  count,
  onAdd,
}: {
  count: number;
  onAdd: (name: string, lat: number, lon: number) => void;
}) {
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  return (
    <div>
      <div className="text-xs text-faint mb-3">
        {count} Ortschaften vorhanden. Neue mit Koordinaten (WGS84) ergänzen.
      </div>
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
        <Field label="Name">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Breite (lat)">
          <input
            className="input !w-28"
            value={lat}
            placeholder="49.61"
            onChange={(e) => setLat(e.target.value)}
          />
        </Field>
        <Field label="Länge (lon)">
          <input
            className="input !w-28"
            value={lon}
            placeholder="6.13"
            onChange={(e) => setLon(e.target.value)}
          />
        </Field>
        <button
          className="btn btn-primary mb-4"
          onClick={() => {
            const la = parseFloat(lat);
            const lo = parseFloat(lon);
            if (name.trim() && !isNaN(la) && !isNaN(lo)) {
              onAdd(name.trim(), la, lo);
              setName("");
              setLat("");
              setLon("");
            }
          }}
        >
          <Plus size={16} /> Hinzufügen
        </button>
      </div>
    </div>
  );
}
