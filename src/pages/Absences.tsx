import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { PageHeader, Field, Empty } from "../components/ui";
import SubstitutePicker from "../components/SubstitutePicker";
import { DAY_NAMES, classRunsInBlock } from "../lib/schedule";
import { UserX, Plus, Trash2, Wand2, Check, ArrowRight } from "lucide-react";

export default function Absences() {
  const {
    people,
    classes,
    absences,
    replacements,
    settings,
    addAbsence,
    removeAbsence,
  } = useStore();

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
                    {impacts.map((im) => {
                      const slot = settings.schedule.days
                        .flatMap((d) => d.blocks)
                        .find((b) => b.id === im.blockId);
                      const covered = replacements.some(
                        (r) =>
                          r.classId === im.classId &&
                          r.blockId === im.blockId &&
                          r.absentPersonId === a.personId
                      );
                      return (
                        <div
                          key={im.classId + im.blockId}
                          className="panel p-3 flex items-center justify-between"
                        >
                          <div>
                            <Link
                              to={`/class/${im.classId}`}
                              className="text-ink font-medium hover:text-cyan"
                            >
                              {im.className}
                            </Link>
                            <span className="text-muted text-sm ml-2">
                              {slot ? `${slot.start}–${slot.end}` : im.blockId}
                            </span>
                          </div>
                          {covered ? (
                            <span className="chip border-lime text-lime">
                              <Check size={12} /> gedeckt
                            </span>
                          ) : (
                            <button
                              className="btn btn-primary !py-1 !px-3 text-xs"
                              onClick={() =>
                                setPicker({
                                  classId: im.classId,
                                  blockId: im.blockId,
                                  absentPersonId: a.personId,
                                })
                              }
                            >
                              <Wand2 size={13} /> Springer finden
                              <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
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
