import { useMemo } from "react";
import { useStore } from "../store/useStore";
import { recommendSubstitutes } from "../lib/recommend";
import type { CandidateScore } from "../lib/recommend";
import { findSlot, slotLabel } from "../lib/schedule";
import { Modal } from "./ui";
import { Award, Check, MapPin, Scale, ShieldCheck, Clock } from "lucide-react";

interface Props {
  classId: string;
  blockId: string;
  absentPersonId?: string;
  open: boolean;
  onClose: () => void;
}

export default function SubstitutePicker({
  classId,
  blockId,
  absentPersonId,
  open,
  onClose,
}: Props) {
  const store = useStore();
  const {
    classes,
    people,
    replacements,
    absences,
    localities,
    settings,
    addReplacement,
    removeReplacement,
  } = store;

  const cls = classes.find((c) => c.id === classId);

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

  const slot = findSlot(settings.schedule, blockId);
  const assigned = replacements.filter(
    (r) => r.classId === classId && r.blockId === blockId
  );

  if (!cls) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Ersatz · ${cls.name}`}
      width="max-w-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted">
          {slot ? slotLabel(slot) : blockId}
          {absentPersonId && (
            <>
              {" · Ausfall: "}
              <span className="text-amber">
                {people.find((p) => p.id === absentPersonId)?.name}
              </span>
            </>
          )}
        </div>
        {cls.requiredQualifications.length > 0 && (
          <div className="flex gap-1 flex-wrap justify-end">
            {cls.requiredQualifications.map((q) => (
              <span key={q} className="chip border-cyan-dim text-cyan">
                {settings.qualifications.find((x) => x.id === q)?.label ?? q}
              </span>
            ))}
          </div>
        )}
      </div>

      {assigned.length > 0 && (
        <div className="mb-4">
          <div className="label-tech mb-2">Bereits eingeteilt</div>
          <div className="space-y-2">
            {assigned.map((r) => {
              const p = people.find((x) => x.id === r.substituteId);
              return (
                <div
                  key={r.id}
                  className="panel p-3 flex items-center justify-between border-lime/40"
                >
                  <span className="flex items-center gap-2 text-ink">
                    <Check size={15} className="text-lime" />
                    {p?.name ?? "?"}
                  </span>
                  <button
                    className="btn btn-ghost btn-danger !py-1 !px-2 text-xs"
                    onClick={() => removeReplacement(r.id)}
                  >
                    Entfernen
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="label-tech mb-2">
        Empfehlung · {ranked.length} verfügbar
      </div>
      {ranked.length === 0 && (
        <div className="text-sm text-muted panel p-4">
          Kein verfügbarer Springer für diesen Block gefunden.
        </div>
      )}
      <div className="space-y-2">
        {ranked.map((c, i) => (
          <CandidateRow
            key={c.person.id}
            c={c}
            best={i === 0}
            alreadyAssigned={assigned.some(
              (r) => r.substituteId === c.person.id
            )}
            localityName={
              c.person.localityId
                ? localities.find((l) => l.id === c.person.localityId)?.name
                : undefined
            }
            onAssign={() =>
              addReplacement({
                classId,
                blockId,
                absentPersonId: absentPersonId ?? "",
                substituteId: c.person.id,
              })
            }
          />
        ))}
      </div>
    </Modal>
  );
}

function CandidateRow({
  c,
  best,
  alreadyAssigned,
  localityName,
  onAssign,
}: {
  c: CandidateScore;
  best: boolean;
  alreadyAssigned: boolean;
  localityName?: string;
  onAssign: () => void;
}) {
  return (
    <div
      className={`panel p-3 ${
        best ? "border-cyan-dim shadow-[0_0_16px_rgba(53,214,240,0.15)]" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {best && <Award size={16} className="text-cyan shrink-0" />}
          <span className="font-semibold text-ink truncate">
            {c.person.name}
          </span>
          {best && (
            <span className="chip border-cyan-dim text-cyan">beste Wahl</span>
          )}
          {!c.isQualified && (
            <span className="chip border-amber text-amber">Qualifikation ⚠</span>
          )}
          {!c.isOnContract && (
            <span className="chip border-faint">außerplanmäßig</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="text-lg font-bold text-cyan"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {Math.round(c.total * 100)}
          </div>
          <button
            className={`btn ${alreadyAssigned ? "" : "btn-primary"} !py-1 !px-3 text-xs`}
            onClick={onAssign}
            disabled={alreadyAssigned}
          >
            {alreadyAssigned ? "eingeteilt" : "einteilen"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        <ScoreBar icon={<Clock size={12} />} label="Verfügbar" v={c.availabilityScore} />
        <ScoreBar icon={<ShieldCheck size={12} />} label="Qualif." v={c.qualificationScore} />
        <ScoreBar icon={<Scale size={12} />} label="Fairness" v={c.fairnessScore} />
        <ScoreBar
          icon={<MapPin size={12} />}
          label={c.distanceKm != null ? `${Math.round(c.distanceKm)} km` : "Distanz"}
          v={c.distanceScore}
        />
      </div>
      <div className="text-xs text-faint mt-2">
        {c.substitutionCount} bisherige Einsätze
        {localityName ? ` · ${localityName}` : ""}
      </div>
    </div>
  );
}

function ScoreBar({
  icon,
  label,
  v,
}: {
  icon: React.ReactNode;
  label: string;
  v: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-faint text-[0.65rem] mb-1">
        {icon}
        {label}
      </div>
      <div className="h-1.5 rounded-full bg-abyss overflow-hidden">
        <div
          className="h-full rounded-full bg-cyan"
          style={{ width: `${Math.round(v * 100)}%`, opacity: 0.5 + v * 0.5 }}
        />
      </div>
    </div>
  );
}
