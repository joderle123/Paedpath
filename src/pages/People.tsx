import { useMemo, useState } from "react";
import { useStore } from "../store/useStore";
import { PageHeader, Modal, Field } from "../components/ui";
import type { Person } from "../types";
import { DAY_SHORT } from "../lib/schedule";
import { Plus, Pencil, Trash2, UserCheck, Search } from "lucide-react";

const emptyPerson: Omit<Person, "id"> = {
  name: "",
  role: "springer",
  canSubstitute: true,
  localityId: "",
  qualifications: [],
  availability: [],
  active: true,
};

export default function People() {
  const {
    people,
    localities,
    settings,
    addPerson,
    updatePerson,
    removePerson,
  } = useStore();
  const [editing, setEditing] = useState<Person | null>(null);
  const [draft, setDraft] = useState<Omit<Person, "id">>(emptyPerson);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const localityById = useMemo(
    () => new Map(localities.map((l) => [l.id, l])),
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
    setDraft(rest);
    setOpen(true);
  }
  function save() {
    if (!draft.name.trim()) return;
    if (editing) updatePerson(editing.id, draft);
    else addPerson(draft);
    setOpen(false);
  }

  const scheduleDays = settings.schedule.days.filter(
    (d) => d.enabled && d.blocks.length
  );

  return (
    <div className="p-6">
      <PageHeader
        title="Personen"
        subtitle="Feste Lehrer und Springer — Rollen, Qualifikationen, Verfügbarkeit."
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
              <th className="p-3 label-tech">Ort</th>
              <th className="p-3 label-tech">Qualifikationen</th>
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
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {p.qualifications.map((qid) => (
                      <span key={qid} className="chip">
                        {settings.qualifications.find((x) => x.id === qid)
                          ?.label ?? qid}
                      </span>
                    ))}
                  </div>
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
      >
        <Field label="Name">
          <input
            className="input"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Rolle">
            <select
              className="select"
              value={draft.role}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  role: e.target.value as Person["role"],
                })
              }
            >
              <option value="teacher">Fester Lehrer</option>
              <option value="springer">Springer</option>
            </select>
          </Field>
          <Field label="Wohnort (für Distanz)">
            <select
              className="select"
              value={draft.localityId ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, localityId: e.target.value })
              }
            >
              <option value="">— kein Ort —</option>
              {localities
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>
          </Field>
        </div>

        <Field label="Qualifikationen">
          <div className="flex flex-wrap gap-1.5">
            {settings.qualifications.map((qd) => {
              const on = draft.qualifications.includes(qd.id);
              return (
                <button
                  key={qd.id}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      qualifications: on
                        ? draft.qualifications.filter((x) => x !== qd.id)
                        : [...draft.qualifications, qd.id],
                    })
                  }
                  className={`chip !px-2.5 !py-1 ${
                    on ? "border-cyan-dim !text-cyan bg-cyan/10" : ""
                  }`}
                >
                  {qd.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field
          label="Reguläre Verfügbarkeit"
          hint="Leer = immer verfügbar. Sonst nur markierte Blöcke."
        >
          <div className="space-y-1.5">
            {scheduleDays.map((d) => (
              <div key={d.day} className="flex items-center gap-2">
                <span className="label-tech w-6">{DAY_SHORT[d.day]}</span>
                <div className="flex flex-wrap gap-1.5">
                  {d.blocks.map((b) => {
                    const on = draft.availability.some(
                      (a) => a.blockId === b.id
                    );
                    return (
                      <button
                        key={b.id}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            availability: on
                              ? draft.availability.filter(
                                  (a) => a.blockId !== b.id
                                )
                              : [...draft.availability, { blockId: b.id }],
                          })
                        }
                        className={`chip !px-2 !py-0.5 !text-[0.65rem] ${
                          on ? "border-cyan-dim !text-cyan bg-cyan/10" : ""
                        }`}
                      >
                        {b.start}–{b.end}
                      </button>
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
              onChange={(e) =>
                setDraft({ ...draft, active: e.target.checked })
              }
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
