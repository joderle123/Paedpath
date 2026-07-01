import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { PageHeader, Modal, Field } from "../components/ui";
import type { SchoolClass } from "../types";
import { DAY_SHORT } from "../lib/schedule";
import { Plus, Pencil, Trash2, MapPin, ExternalLink } from "lucide-react";

function emptyClass(defaultStaff: number): Omit<SchoolClass, "id"> {
  return {
    name: "",
    localityId: "",
    schoolType: "",
    room: "",
    requiredStaff: defaultStaff,
    requiredQualifications: [],
    teacherIds: [],
    activeBlockIds: [],
  };
}

export default function Classes() {
  const {
    classes,
    people,
    localities,
    settings,
    addClass,
    updateClass,
    removeClass,
  } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [draft, setDraft] = useState<Omit<SchoolClass, "id">>(
    emptyClass(settings.defaultRequiredStaff)
  );

  const localityById = useMemo(
    () => new Map(localities.map((l) => [l.id, l])),
    [localities]
  );
  const personById = useMemo(
    () => new Map(people.map((p) => [p.id, p])),
    [people]
  );

  function startNew() {
    setEditing(null);
    setDraft(emptyClass(settings.defaultRequiredStaff));
    setOpen(true);
  }
  function startEdit(c: SchoolClass) {
    setEditing(c);
    const { id, ...rest } = c;
    void id;
    setDraft(rest);
    setOpen(true);
  }
  function save() {
    if (!draft.name.trim()) return;
    if (editing) updateClass(editing.id, draft);
    else addClass(draft);
    setOpen(false);
  }

  const scheduleDays = settings.schedule.days.filter(
    (d) => d.enabled && d.blocks.length
  );

  return (
    <div className="p-6">
      <PageHeader
        title="Klassen"
        subtitle="Classes de participation — Standort, Lehrer, Bedarf. Anzahl beliebig."
        actions={
          <button className="btn btn-primary" onClick={startNew}>
            <Plus size={16} /> Klasse
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {classes.map((c) => (
          <div key={c.id} className="panel panel-hover p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-ink text-lg">{c.name}</div>
                <div className="text-xs text-muted mt-0.5">
                  {c.schoolType} {c.room ? `· ${c.room}` : ""}
                </div>
              </div>
              <div className="flex">
                <button
                  className="btn btn-ghost !p-1.5"
                  onClick={() => startEdit(c)}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="btn btn-ghost btn-danger !p-1.5"
                  onClick={() =>
                    confirm(`${c.name} löschen?`) && removeClass(c.id)
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted mt-3">
              <MapPin size={14} className="text-cyan" />
              {c.localityId ? localityById.get(c.localityId)?.name : "—"}
            </div>
            <div className="text-xs text-muted mt-2">
              {c.teacherIds
                .map((id) => personById.get(id)?.name)
                .filter(Boolean)
                .join(", ") || "keine Lehrer"}
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="chip">{c.requiredStaff} Betreuer</span>
              <Link
                to={`/class/${c.id}`}
                className="btn btn-ghost !py-1 !px-2 text-xs"
              >
                Detail <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="panel p-8 text-muted col-span-3 text-center">
            Noch keine Klassen angelegt.
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Klasse bearbeiten" : "Neue Klasse"}
        width="max-w-xl"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name">
            <input
              className="input"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Field>
          <Field label="Raum (optional)">
            <input
              className="input"
              value={draft.room ?? ""}
              onChange={(e) => setDraft({ ...draft, room: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Standort">
            <select
              className="select"
              value={draft.localityId ?? ""}
              onChange={(e) =>
                setDraft({ ...draft, localityId: e.target.value })
              }
            >
              <option value="">— Ort wählen —</option>
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
          <Field label="Schultyp">
            <input
              className="input"
              list="schooltypes"
              value={draft.schoolType}
              onChange={(e) =>
                setDraft({ ...draft, schoolType: e.target.value })
              }
            />
            <datalist id="schooltypes">
              {settings.schoolTypes.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
        </div>

        <Field label="Benötigte Betreuer pro Block">
          <input
            type="number"
            min={1}
            className="input"
            value={draft.requiredStaff}
            onChange={(e) =>
              setDraft({
                ...draft,
                requiredStaff: Math.max(1, Number(e.target.value) || 1),
              })
            }
          />
        </Field>

        <Field label="Feste Lehrer (ganzer Tag)">
          <div className="flex flex-wrap gap-1.5">
            {people
              .filter((p) => p.active)
              .map((p) => {
                const on = draft.teacherIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        teacherIds: on
                          ? draft.teacherIds.filter((x) => x !== p.id)
                          : [...draft.teacherIds, p.id],
                      })
                    }
                    className={`chip !px-2.5 !py-1 ${
                      on ? "border-cyan-dim !text-cyan bg-cyan/10" : ""
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
          </div>
        </Field>

        <Field label="Benötigte Qualifikationen">
          <div className="flex flex-wrap gap-1.5">
            {settings.qualifications.map((qd) => {
              const on = draft.requiredQualifications.includes(qd.id);
              return (
                <button
                  key={qd.id}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      requiredQualifications: on
                        ? draft.requiredQualifications.filter(
                            (x) => x !== qd.id
                          )
                        : [...draft.requiredQualifications, qd.id],
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
          label="Läuft an Blöcken"
          hint="Nichts markiert = Klasse läuft in allen Blöcken des Plans."
        >
          <div className="space-y-1.5">
            {scheduleDays.map((d) => (
              <div key={d.day} className="flex items-center gap-2">
                <span className="label-tech w-6">{DAY_SHORT[d.day]}</span>
                <div className="flex flex-wrap gap-1.5">
                  {d.blocks.map((b) => {
                    const on = draft.activeBlockIds.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            activeBlockIds: on
                              ? draft.activeBlockIds.filter((x) => x !== b.id)
                              : [...draft.activeBlockIds, b.id],
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
