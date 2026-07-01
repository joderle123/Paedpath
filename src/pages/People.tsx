import { useMemo, useState } from "react";
import { useStore } from "../store/useStore";
import { PageHeader, Modal, Field } from "../components/ui";
import type { Person, PersonBlock } from "../types";
import { DAY_SHORT } from "../lib/schedule";
import { Plus, Pencil, Trash2, UserCheck, Search, MapPin } from "lucide-react";

const emptyPerson: Omit<Person, "id"> = {
  name: "",
  role: "springer",
  canSubstitute: true,
  localityId: "",
  schedule: [],
  active: true,
};

export default function People() {
  const { people, localities, settings, addPerson, updatePerson, removePerson } =
    useStore();
  const [editing, setEditing] = useState<Person | null>(null);
  const [draft, setDraft] = useState<Omit<Person, "id">>(emptyPerson);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const localityById = useMemo(
    () => new Map(localities.map((l) => [l.id, l])),
    [localities]
  );
  const sortedLocalities = useMemo(
    () => localities.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [localities]
  );

  const filtered = people.filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase())
  );

  function startNew() {
    setEditing(null);
    setDraft(emptyPerson);
    setOpen(true);
  }
  function startEdit(p: Person) {
    setEditing(p);
    const { id, ...rest } = p;
    void id;
    setDraft({ ...rest, schedule: rest.schedule ?? [] });
    setOpen(true);
  }
  function save() {
    if (!draft.name.trim()) return;
    if (editing) updatePerson(editing.id, draft);
    else addPerson(draft);
    setOpen(false);
  }

  // Wochenplan-Helfer
  function entryOf(blockId: string): PersonBlock | undefined {
    return draft.schedule.find((s) => s.blockId === blockId);
  }
  function setStatus(blockId: string, status: "open" | "free" | "busy") {
    if (status === "open") {
      setDraft({
        ...draft,
        schedule: draft.schedule.filter((s) => s.blockId !== blockId),
      });
      return;
    }
    const existing = entryOf(blockId);
    const next: PersonBlock = {
      blockId,
      busy: status === "busy",
      localityId: existing?.localityId ?? (draft.localityId || undefined),
    };
    setDraft({
      ...draft,
      schedule: [
        ...draft.schedule.filter((s) => s.blockId !== blockId),
        next,
      ],
    });
  }
  function setEntryLocality(blockId: string, localityId: string) {
    setDraft({
      ...draft,
      schedule: draft.schedule.map((s) =>
        s.blockId === blockId ? { ...s, localityId } : s
      ),
    });
  }

  const scheduleDays = settings.schedule.days.filter(
    (d) => d.enabled && d.blocks.length
  );

  return (
    <div className="p-6">
      <PageHeader
        title="Personen"
        subtitle="Feste Lehrer und Springer — Rolle, Basis-Ort und individueller Wochenplan (wo & frei/belegt)."
        actions={
          <button className="btn btn-primary" onClick={startNew}>
            <Plus size={16} /> Person
          </button>
        }
      />

      <div className="panel p-3 mb-4 flex items-center gap-2">
        <Search size={16} className="text-muted" />
        <input
          className="bg-transparent outline-none text-sm text-ink w-full"
          placeholder="Suchen…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-edge">
              <th className="p-3 label-tech">Name</th>
              <th className="p-3 label-tech">Rolle</th>
              <th className="p-3 label-tech">Basis-Ort</th>
              <th className="p-3 label-tech">Plan-Blöcke</th>
              <th className="p-3 label-tech">Springer</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                className={`border-b border-edge/50 hover:bg-panel-2/40 ${
                  !p.active ? "opacity-50" : ""
                }`}
              >
                <td className="p-3 text-ink font-medium">{p.name}</td>
                <td className="p-3 text-muted">
                  {p.role === "teacher" ? "Lehrer" : "Springer"}
                </td>
                <td className="p-3 text-muted">
                  {p.localityId ? localityById.get(p.localityId)?.name : "—"}
                </td>
                <td className="p-3 text-muted">
                  {(p.schedule ?? []).length || "—"}
                </td>
                <td className="p-3">
                  {p.canSubstitute ? (
                    <UserCheck size={16} className="text-lime" />
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button
                    className="btn btn-ghost !p-2"
                    onClick={() => startEdit(p)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="btn btn-ghost btn-danger !p-2"
                    onClick={() =>
                      confirm(`${p.name} löschen?`) && removePerson(p.id)
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Person bearbeiten" : "Neue Person"}
        width="max-w-2xl"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name">
            <input
              className="input"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Field>
          <Field label="Rolle">
            <select
              className="select"
              value={draft.role}
              onChange={(e) =>
                setDraft({ ...draft, role: e.target.value as Person["role"] })
              }
            >
              <option value="teacher">Fester Lehrer</option>
              <option value="springer">Springer</option>
            </select>
          </Field>
        </div>

        <Field
          label="Basis-Ort (Wohnort)"
          hint="Fallback-Aufenthaltsort, wenn im Wochenplan kein Ort gesetzt ist."
        >
          <select
            className="select"
            value={draft.localityId ?? ""}
            onChange={(e) => setDraft({ ...draft, localityId: e.target.value })}
          >
            <option value="">— kein Ort —</option>
            {sortedLocalities.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Wochenplan — wo & frei/belegt"
          hint="Pro Block: Belegt = kann nicht einspringen. Ort = wo die Person in dem Block ist (für die Distanz zur Schule in Not)."
        >
          <div className="space-y-2">
            {scheduleDays.map((d) => (
              <div key={d.day}>
                <div className="label-tech mb-1">{DAY_SHORT[d.day]}</div>
                <div className="space-y-1.5">
                  {d.blocks.map((b) => {
                    const entry = entryOf(b.id);
                    const status = !entry
                      ? "open"
                      : entry.busy
                      ? "busy"
                      : "free";
                    return (
                      <div
                        key={b.id}
                        className="flex items-center gap-2 flex-wrap"
                      >
                        <span
                          className="text-xs text-muted w-24 shrink-0"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {b.start}–{b.end}
                        </span>
                        <div className="flex rounded-lg overflow-hidden border border-edge">
                          {(
                            [
                              ["open", "Offen"],
                              ["free", "Frei"],
                              ["busy", "Belegt"],
                            ] as const
                          ).map(([val, lbl]) => (
                            <button
                              key={val}
                              onClick={() => setStatus(b.id, val)}
                              className={`px-2.5 py-1 text-xs ${
                                status === val
                                  ? val === "busy"
                                    ? "bg-amber/20 text-amber"
                                    : val === "free"
                                    ? "bg-lime/15 text-lime"
                                    : "bg-panel-2 text-ink"
                                  : "text-faint hover:text-muted"
                              }`}
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                        {status !== "open" && (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-cyan" />
                            <select
                              className="select !py-1 !w-40 text-xs"
                              value={entry?.localityId ?? ""}
                              onChange={(e) =>
                                setEntryLocality(b.id, e.target.value)
                              }
                            >
                              <option value="">— Ort —</option>
                              {sortedLocalities.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.name}
                                </option>
                              ))}
                            </select>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Field>

        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={draft.canSubstitute}
              onChange={(e) =>
                setDraft({ ...draft, canSubstitute: e.target.checked })
              }
            />
            Darf einspringen
          </label>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
            />
            Aktiv
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => setOpen(false)}>
            Abbrechen
          </button>
          <button className="btn btn-primary" onClick={save}>
            Speichern
          </button>
        </div>
      </Modal>
    </div>
  );
}
