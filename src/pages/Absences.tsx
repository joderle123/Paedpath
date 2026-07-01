import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { PageHeader } from "../components/ui";
import SubstitutePicker from "../components/SubstitutePicker";
import { recommendSubstitutes } from "../lib/recommend";
import { allSlots, slotLabel, classRunsInBlock, findSlot } from "../lib/schedule";
import {
  UserX,
  Award,
  MapPin,
  Navigation,
  Check,
  Trash2,
  ListFilter,
} from "lucide-react";

export default function Absences() {
  const store = useStore();
  const {
    people,
    classes,
    absences,
    replacements,
    localities,
    settings,
    addAbsence,
    addReplacement,
    removeReplacement,
    removeAbsence,
  } = store;

  const [personId, setPersonId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [classId, setClassId] = useState("");
  const [picker, setPicker] = useState<{
    classId: string;
    blockId: string;
    absentPersonId: string;
  } | null>(null);

  const slots = useMemo(() => allSlots(settings.schedule), [settings.schedule]);
  const localityName = (id?: string) =>
    id ? localities.find((l) => l.id === id)?.name : undefined;

  // Klassen, denen die Person im gewählten Block fest zugeteilt ist
  const autoClasses = useMemo(() => {
    if (!personId || !blockId) return [];
    return classes.filter(
      (c) => c.teacherIds.includes(personId) && classRunsInBlock(c, blockId)
    );
  }, [personId, blockId, classes]);

  // effektive Klasse: manuell gewählt, sonst automatisch
  const effectiveClassId =
    classId || (autoClasses.length === 1 ? autoClasses[0].id : "");
  const effectiveClass = classes.find((c) => c.id === effectiveClassId);

  const ranked = useMemo(() => {
    if (!effectiveClass || !blockId) return [];
    return recommendSubstitutes(effectiveClass, blockId, personId || undefined, {
      people,
      classes,
      replacements,
      absences,
      localities,
      settings,
    });
  }, [effectiveClass, blockId, personId, people, classes, replacements, absences, localities, settings]);

  const alreadyAssigned = replacements.filter(
    (r) => r.classId === effectiveClassId && r.blockId === blockId
  );

  function assign(substituteId: string) {
    if (!effectiveClass || !blockId) return;
    // Ausfall protokollieren (falls noch nicht vorhanden)
    const exists = absences.find(
      (a) => a.personId === personId && a.blockIds.includes(blockId)
    );
    if (!exists && personId) addAbsence({ personId, blockIds: [blockId] });
    addReplacement({
      classId: effectiveClass.id,
      blockId,
      absentPersonId: personId || "",
      substituteId,
    });
  }

  const needClassChoice =
    personId && blockId && !effectiveClassId; // keine eindeutige Zuordnung

  return (
    <div className="p-6">
      <PageHeader
        title="Ausfall & Ersatz"
        subtitle="Wer fällt aus? → sofort die beste Ersatz-Wahl."
      />

      {/* Sofort-Erfassung: Eingabe + direkt die Empfehlung */}
      <div className="panel p-5 mb-6">
        <div className="grid grid-cols-3 gap-4 mb-2">
          <label className="block">
            <div className="label-tech mb-1.5 flex items-center gap-1">
              <UserX size={12} className="text-amber" /> Wer fällt aus?
            </div>
            <select
              className="select"
              value={personId}
              onChange={(e) => {
                setPersonId(e.target.value);
                setClassId("");
              }}
            >
              <option value="">— Person wählen —</option>
              {people
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role === "teacher" ? "Lehrer" : "Springer"})
                  </option>
                ))}
            </select>
          </label>

          <label className="block">
            <div className="label-tech mb-1.5">Wann?</div>
            <select
              className="select"
              value={blockId}
              onChange={(e) => {
                setBlockId(e.target.value);
                setClassId("");
              }}
            >
              <option value="">— Block wählen —</option>
              {slots.map((s) => (
                <option key={s.block.id} value={s.block.id}>
                  {slotLabel(s)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="label-tech mb-1.5">Welche Klasse?</div>
            <select
              className="select"
              value={effectiveClassId}
              onChange={(e) => setClassId(e.target.value)}
              disabled={!personId || !blockId}
            >
              <option value="">
                {autoClasses.length > 1 ? "— Klasse wählen —" : "— Klasse —"}
              </option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {autoClasses.some((x) => x.id === c.id) ? " ★" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Empfehlung — sofort und direkt */}
        <div className="mt-4">
          {!personId || !blockId ? (
            <div className="text-sm text-muted">
              Person und Block wählen — die beste Ersatz-Wahl erscheint sofort.
            </div>
          ) : !effectiveClassId ? (
            <div className="text-sm text-amber">
              {needClassChoice && autoClasses.length === 0
                ? "Diese Person ist keiner Klasse in diesem Block zugeteilt — bitte Klasse oben wählen."
                : "Bitte Klasse wählen."}
            </div>
          ) : (
            <Recommendation
              ranked={ranked}
              alreadyAssignedIds={alreadyAssigned.map((r) => r.substituteId)}
              localityName={localityName}
              onAssign={assign}
              onOpenAll={() =>
                setPicker({
                  classId: effectiveClassId,
                  blockId,
                  absentPersonId: personId,
                })
              }
            />
          )}
        </div>
      </div>

      {/* Übersicht bereits eingeteilter Ersätze (flach) */}
      {replacements.length > 0 && (
        <div className="panel p-5">
          <div className="label-tech mb-3">Eingeteilte Ersätze</div>
          <div className="space-y-2">
            {replacements.map((r) => {
              const cls = classes.find((c) => c.id === r.classId);
              const sub = people.find((p) => p.id === r.substituteId);
              const absent = people.find((p) => p.id === r.absentPersonId);
              const slot = findSlot(settings.schedule, r.blockId);
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between text-sm border-b border-edge/40 pb-2"
                >
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-lime" />
                    <span className="text-ink font-medium">{sub?.name}</span>
                    <span className="text-faint">→</span>
                    <Link
                      to={`/class/${r.classId}`}
                      className="text-muted hover:text-cyan"
                    >
                      {cls?.name ?? "?"}
                    </Link>
                    <span className="text-faint">
                      {slot ? slotLabel(slot) : r.blockId}
                    </span>
                    {absent && (
                      <span className="text-faint">· für {absent.name}</span>
                    )}
                  </div>
                  <button
                    className="btn btn-ghost btn-danger !py-0.5 !px-2 text-xs"
                    onClick={() => removeReplacement(r.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Offene Ausfälle ohne Ersatz (flach) */}
      <OpenAbsences
        absences={absences}
        classes={classes}
        people={people}
        replacements={replacements}
        schedule={settings.schedule}
        onRemove={removeAbsence}
      />

      {picker && (
        <SubstitutePicker
          open
          classId={picker.classId}
          blockId={picker.blockId}
          absentPersonId={picker.absentPersonId}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}

// Direkte, flache Empfehlungsanzeige (beste Wahl groß, Alternativen darunter).
function Recommendation({
  ranked,
  alreadyAssignedIds,
  localityName,
  onAssign,
  onOpenAll,
}: {
  ranked: ReturnType<typeof recommendSubstitutes>;
  alreadyAssignedIds: string[];
  localityName: (id?: string) => string | undefined;
  onAssign: (id: string) => void;
  onOpenAll: () => void;
}) {
  if (ranked.length === 0) {
    return (
      <div className="text-sm text-muted">
        Kein verfügbarer Springer für diesen Block (alle belegt oder abwesend).
      </div>
    );
  }
  const best = ranked[0];
  const rest = ranked.slice(1, 4);
  return (
    <div>
      <div className="label-tech mb-2">Beste Wahl</div>
      <div className="panel p-4 border-cyan-dim shadow-[0_0_18px_rgba(53,214,240,0.18)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Award size={22} className="text-cyan shrink-0" />
          <div className="min-w-0">
            <div className="text-lg font-bold text-ink truncate">
              {best.person.name}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
              <span className="flex items-center gap-1">
                <Navigation size={12} />
                {best.distanceKm != null
                  ? `${Math.round(best.distanceKm)} km`
                  : "—"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {localityName(best.fromLocalityId) ?? "Ort unbekannt"}
              </span>
              <span>{best.isPlanned ? "im Plan frei" : "Status offen"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div
            className="text-3xl font-bold text-cyan"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {Math.round(best.total * 100)}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => onAssign(best.person.id)}
            disabled={alreadyAssignedIds.includes(best.person.id)}
          >
            {alreadyAssignedIds.includes(best.person.id)
              ? "eingeteilt"
              : "einteilen"}
          </button>
        </div>
      </div>

      {rest.length > 0 && (
        <div className="mt-3">
          <div className="label-tech mb-2">Alternativen</div>
          <div className="space-y-1.5">
            {rest.map((c) => (
              <div
                key={c.person.id}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 bg-abyss/60"
              >
                <div className="min-w-0">
                  <span className="text-ink font-medium">{c.person.name}</span>
                  <span className="text-xs text-faint ml-2">
                    {c.distanceKm != null ? `${Math.round(c.distanceKm)} km` : "—"}
                    {" · "}
                    {localityName(c.fromLocalityId) ?? "Ort unbekannt"}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="text-cyan font-bold"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {Math.round(c.total * 100)}
                  </span>
                  <button
                    className="btn !py-1 !px-3 text-xs"
                    onClick={() => onAssign(c.person.id)}
                    disabled={alreadyAssignedIds.includes(c.person.id)}
                  >
                    {alreadyAssignedIds.includes(c.person.id)
                      ? "eingeteilt"
                      : "einteilen"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        className="btn btn-ghost !py-1 !px-2 text-xs mt-2"
        onClick={onOpenAll}
      >
        <ListFilter size={13} /> alle {ranked.length} anzeigen
      </button>
    </div>
  );
}

// Kompakte, flache Liste offener Ausfälle (ohne zugewiesenen Ersatz).
function OpenAbsences({
  absences,
  classes,
  people,
  replacements,
  schedule,
  onRemove,
}: {
  absences: ReturnType<typeof useStore.getState>["absences"];
  classes: ReturnType<typeof useStore.getState>["classes"];
  people: ReturnType<typeof useStore.getState>["people"];
  replacements: ReturnType<typeof useStore.getState>["replacements"];
  schedule: ReturnType<typeof useStore.getState>["settings"]["schedule"];
  onRemove: (id: string) => void;
}) {
  // offene (person, block) Kombinationen aus Ausfällen, die nicht gedeckt sind
  const open: { absId: string; personId: string; blockId: string }[] = [];
  for (const a of absences) {
    for (const bid of a.blockIds) {
      const covered = replacements.some(
        (r) => r.absentPersonId === a.personId && r.blockId === bid
      );
      const affects = classes.some(
        (c) => c.teacherIds.includes(a.personId) && classRunsInBlock(c, bid)
      );
      if (!covered && affects)
        open.push({ absId: a.id, personId: a.personId, blockId: bid });
    }
  }
  if (open.length === 0) return null;
  return (
    <div className="panel p-5 mt-6">
      <div className="label-tech mb-3">Offene Ausfälle ohne Ersatz</div>
      <div className="space-y-2">
        {open.map((o, i) => {
          const person = people.find((p) => p.id === o.personId);
          const slot = findSlot(schedule, o.blockId);
          return (
            <div
              key={o.absId + o.blockId + i}
              className="flex items-center justify-between text-sm border-b border-edge/40 pb-2"
            >
              <span className="text-ink">
                {person?.name}{" "}
                <span className="text-faint">
                  · {slot ? slotLabel(slot) : o.blockId}
                </span>
              </span>
              <button
                className="btn btn-ghost btn-danger !py-0.5 !px-2 text-xs"
                onClick={() => onRemove(o.absId)}
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
