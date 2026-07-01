import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { PageHeader, Field, Empty } from "../components/ui";
import SubstitutePicker from "../components/SubstitutePicker";
import { DAY_NAMES, classRunsInBlock } from "../lib/schedule";
import {
  UserX,
  Plus,
  Trash2,
  Check,
  Award,
  MapPin,
  Navigation,
  ListFilter,
} from "lucide-react";
import { recommendSubstitutes } from "../lib/recommend";
import { findSlot } from "../lib/schedule";

export default function Absences() {
  const { people, classes, absences, settings, addAbsence, removeAbsence } =
    useStore();

  const [personId, setPersonId] = useState("");
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [picker, setPicker] = useState<{
    classId: string;
    blockId: string;
    absentPersonId: string;
  } | null>(null);

  const personById = useMemo(
    () => new Map(people.map((p) => [p.id, p])),
    [people]
  );

  const days = settings.schedule.days.filter((d) => d.enabled && d.blocks.length);

  function toggleBlock(id: string) {
    setSelectedBlocks((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  }
  function toggleDay(dayBlocks: string[]) {
    const allSel = dayBlocks.every((b) => selectedBlocks.includes(b));
    setSelectedBlocks((s) =>
      allSel
        ? s.filter((x) => !dayBlocks.includes(x))
        : [...new Set([...s, ...dayBlocks])]
    );
  }

  function submit() {
    if (!personId || selectedBlocks.length === 0) return;
    addAbsence({ personId, blockIds: selectedBlocks, note: note || undefined });
    setPersonId("");
    setSelectedBlocks([]);
    setNote("");
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Ausfall & Ersatz"
        subtitle="Eingeben wer fehlt — das Tool schlägt sofort den besten Springer vor."
      />

      <div className="grid grid-cols-[360px_1fr] gap-6">
        {/* Eingabe */}
        <div className="panel p-5 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <UserX size={18} className="text-amber" />
            <span className="font-semibold text-ink">Ausfall melden</span>
          </div>

          <Field label="Person">
            <select
              className="select"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
            >
              <option value="">— wählen —</option>
              {people
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role === "teacher" ? "Lehrer" : "Springer"})
                  </option>
                ))}
            </select>
          </Field>

          <Field label="Betroffene Blöcke" hint="Tag anklicken = ganzer Tag">
            <div className="space-y-2">
              {days.map((d) => {
                const dayBlockIds = d.blocks.map((b) => b.id);
                return (
                  <div key={d.day}>
                    <button
                      className="label-tech hover:text-cyan mb-1"
                      onClick={() => toggleDay(dayBlockIds)}
                    >
                      {DAY_NAMES[d.day]}
                    </button>
                    <div className="flex flex-wrap gap-1.5">
                      {d.blocks.map((b) => {
                        const on = selectedBlocks.includes(b.id);
                        return (
                          <button
                            key={b.id}
                            onClick={() => toggleBlock(b.id)}
                            className={`chip !text-xs !px-2.5 !py-1 ${
                              on
                                ? "border-cyan-dim !text-cyan bg-cyan/10"
                                : "hover:border-edge-2"
                            }`}
                          >
                            {b.start}–{b.end}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Field>

          <Field label="Notiz (optional)">
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="z.B. Krankheit, Fortbildung…"
            />
          </Field>

          <button
            className="btn btn-primary w-full justify-center"
            onClick={submit}
            disabled={!personId || selectedBlocks.length === 0}
          >
            <Plus size={16} /> Ausfall erfassen
          </button>
        </div>

        {/* Liste + Empfehlungen */}
        <div className="space-y-4">
          {absences.length === 0 && (
            <Empty>Kein Ausfall erfasst. Melde links eine Abwesenheit.</Empty>
          )}
          {absences.map((a) => {
            const person = personById.get(a.personId);
            // betroffene Klassen/Blöcke
            const impacts: { classId: string; className: string; blockId: string }[] =
              [];
            for (const bid of a.blockIds) {
              for (const c of classes) {
                if (
                  c.teacherIds.includes(a.personId) &&
                  classRunsInBlock(c, bid)
                ) {
                  impacts.push({
                    classId: c.id,
                    className: c.name,
                    blockId: bid,
                  });
                }
              }
            }
            return (
              <div key={a.id} className="panel p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink text-lg">
                        {person?.name ?? "?"}
                      </span>
                      <span className="chip border-amber text-amber">
                        {a.blockIds.length} Block(e)
                      </span>
                    </div>
                    {a.note && (
                      <div className="text-sm text-muted mt-1">{a.note}</div>
                    )}
                  </div>
                  <button
                    className="btn btn-ghost btn-danger !p-2"
                    onClick={() => removeAbsence(a.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {impacts.length === 0 ? (
                  <div className="text-sm text-muted mt-3">
                    Keine Klasse betroffen (Person ist in diesen Blöcken keiner
                    laufenden Klasse fest zugeteilt).
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    <div className="label-tech">
                      Betroffene Klassen · Ersatz nötig
                    </div>
                    {impacts.map((im) => (
                      <ImpactRow
                        key={im.classId + im.blockId}
                        classId={im.classId}
                        className={im.className}
                        blockId={im.blockId}
                        absentPersonId={a.personId}
                        onOpenAll={() =>
                          setPicker({
                            classId: im.classId,
                            blockId: im.blockId,
                            absentPersonId: a.personId,
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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

// Eine betroffene Klasse/Block: zeigt AUTOMATISCH die beste(n) Springer.
function ImpactRow({
  classId,
  className,
  blockId,
  absentPersonId,
  onOpenAll,
}: {
  classId: string;
  className: string;
  blockId: string;
  absentPersonId: string;
  onOpenAll: () => void;
}) {
  const {
    classes,
    people,
    replacements,
    absences,
    localities,
    settings,
    addReplacement,
    removeReplacement,
  } = useStore();

  const cls = classes.find((c) => c.id === classId);
  const slot = findSlot(settings.schedule, blockId);
  const covered = replacements.filter(
    (r) =>
      r.classId === classId &&
      r.blockId === blockId &&
      r.absentPersonId === absentPersonId
  );

  const ranked = useMemo(() => {
    if (!cls) return [];
    return recommendSubstitutes(cls, blockId, absentPersonId, {
      people,
      classes,
      replacements,
      absences,
      localities,
      settings,
    });
  }, [cls, blockId, absentPersonId, people, classes, replacements, absences, localities, settings]);

  const localityName = (id?: string) =>
    id ? localities.find((l) => l.id === id)?.name : undefined;

  return (
    <div className="panel p-3">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={`/class/${classId}`}
            className="text-ink font-medium hover:text-cyan"
          >
            {className}
          </Link>
          <span className="text-muted text-sm ml-2">
            {slot ? `${slot.block.start}–${slot.block.end}` : blockId}
          </span>
        </div>
        {covered.length > 0 ? (
          <span className="chip border-lime text-lime">
            <Check size={12} /> gedeckt
          </span>
        ) : (
          <span className="chip border-amber text-amber">Ersatz nötig</span>
        )}
      </div>

      {covered.length > 0 ? (
        <div className="mt-2 space-y-1.5">
          {covered.map((r) => {
            const p = people.find((x) => x.id === r.substituteId);
            return (
              <div
                key={r.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-lime">
                  <Check size={14} /> {p?.name ?? "?"}{" "}
                  <span className="text-faint">springt ein</span>
                </span>
                <button
                  className="btn btn-ghost btn-danger !py-0.5 !px-2 text-xs"
                  onClick={() => removeReplacement(r.id)}
                >
                  ändern
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-3">
          <div className="label-tech mb-2">
            Beste Wahl · automatisch vorgeschlagen
          </div>
          {ranked.length === 0 ? (
            <div className="text-sm text-muted">
              Kein verfügbarer Springer für diesen Block (alle belegt oder
              abwesend).
            </div>
          ) : (
            <div className="space-y-1.5">
              {ranked.slice(0, 3).map((c, i) => (
                <div
                  key={c.person.id}
                  className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 ${
                    i === 0
                      ? "bg-cyan/10 border border-cyan-dim"
                      : "bg-abyss/60"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {i === 0 && <Award size={14} className="text-cyan" />}
                      <span className="text-ink font-medium truncate">
                        {c.person.name}
                      </span>
                      {i === 0 && (
                        <span className="chip border-cyan-dim text-cyan !py-0">
                          beste Wahl
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-faint mt-0.5">
                      <span className="flex items-center gap-1">
                        <Navigation size={11} />
                        {c.distanceKm != null
                          ? `${Math.round(c.distanceKm)} km`
                          : "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {localityName(c.fromLocalityId) ?? "Ort unbekannt"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-cyan font-bold"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {Math.round(c.total * 100)}
                    </span>
                    <button
                      className="btn btn-primary !py-1 !px-3 text-xs"
                      onClick={() =>
                        addReplacement({
                          classId,
                          blockId,
                          absentPersonId,
                          substituteId: c.person.id,
                        })
                      }
                    >
                      einteilen
                    </button>
                  </div>
                </div>
              ))}
              <button
                className="btn btn-ghost !py-1 !px-2 text-xs"
                onClick={onOpenAll}
              >
                <ListFilter size={13} /> alle {ranked.length} anzeigen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
