import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { PageHeader } from "../components/ui";
import SubstitutePicker from "../components/SubstitutePicker";
import { DAY_NAMES, classRunsInBlock } from "../lib/schedule";
import {
  MapPin,
  Users,
  AlertTriangle,
  Check,
  Plus,
  ArrowLeft,
} from "lucide-react";

export default function ClassDetail() {
  const { id } = useParams();
  const {
    classes,
    people,
    localities,
    absences,
    replacements,
    settings,
  } = useStore();
  const cls = classes.find((c) => c.id === id);
  const [picker, setPicker] = useState<{
    blockId: string;
    absentPersonId?: string;
  } | null>(null);

  const personById = useMemo(
    () => new Map(people.map((p) => [p.id, p])),
    [people]
  );

  if (!cls) {
    return (
      <div className="p-6">
        <Link to="/" className="btn btn-ghost">
          <ArrowLeft size={16} /> Zurück
        </Link>
        <div className="panel p-8 mt-4 text-muted">Klasse nicht gefunden.</div>
      </div>
    );
  }

  const loc = localities.find((l) => l.id === cls.localityId);
  const teachers = cls.teacherIds
    .map((tid) => personById.get(tid))
    .filter(Boolean);

  return (
    <div className="p-6">
      <Link to="/" className="btn btn-ghost mb-3">
        <ArrowLeft size={16} /> Karte
      </Link>
      <PageHeader
        title={cls.name}
        subtitle={`${cls.schoolType}${cls.room ? " · " + cls.room : ""} · ${
          loc?.name ?? "kein Standort"
        }`}
        actions={
          <Link to="/classes" className="btn">
            Klasse bearbeiten
          </Link>
        }
      />

      <div className="grid grid-cols-[1fr_280px] gap-4">
        <div className="space-y-4">
          {settings.schedule.days
            .filter((d) => d.enabled && d.blocks.length > 0)
            .map((d) => (
              <div key={d.day}>
                <div className="label-tech mb-2">{DAY_NAMES[d.day]}</div>
                <div className="grid grid-cols-2 gap-3">
                  {d.blocks.map((block) => {
                    const runs = classRunsInBlock(cls, block.id);
                    const absentHere = cls.teacherIds.filter((tid) =>
                      absences.some(
                        (a) =>
                          a.personId === tid && a.blockIds.includes(block.id)
                      )
                    );
                    const subs = replacements.filter(
                      (r) => r.classId === cls.id && r.blockId === block.id
                    );
                    const presentTeachers = cls.teacherIds.filter(
                      (tid) => !absentHere.includes(tid)
                    );
                    const present = presentTeachers.length + subs.length;
                    const understaffed = runs && present < cls.requiredStaff;

                    return (
                      <div
                        key={block.id}
                        className={`panel p-3 ${
                          !runs
                            ? "opacity-40"
                            : understaffed
                            ? "border-amber/60"
                            : "border-lime/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-sm font-semibold text-ink"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {block.start}–{block.end}
                          </span>
                          {!runs ? (
                            <span className="chip">läuft nicht</span>
                          ) : understaffed ? (
                            <span className="chip border-amber text-amber">
                              <AlertTriangle size={11} /> {present}/
                              {cls.requiredStaff}
                            </span>
                          ) : (
                            <span className="chip border-lime text-lime">
                              <Check size={11} /> {present}/{cls.requiredStaff}
                            </span>
                          )}
                        </div>

                        {runs && (
                          <div className="mt-2 space-y-1">
                            {presentTeachers.map((tid) => (
                              <div
                                key={tid}
                                className="text-xs text-muted flex items-center gap-1.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                                {personById.get(tid)?.name}
                              </div>
                            ))}
                            {absentHere.map((tid) => (
                              <div
                                key={tid}
                                className="text-xs text-amber flex items-center gap-1.5 line-through decoration-amber/50"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                                {personById.get(tid)?.name}
                              </div>
                            ))}
                            {subs.map((r) => (
                              <div
                                key={r.id}
                                className="text-xs text-cyan flex items-center gap-1.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
                                {personById.get(r.substituteId)?.name}
                                <span className="text-faint">(Ersatz)</span>
                              </div>
                            ))}
                            <button
                              className="btn btn-ghost !py-1 !px-2 text-xs mt-1"
                              onClick={() =>
                                setPicker({
                                  blockId: block.id,
                                  absentPersonId: absentHere[0],
                                })
                              }
                            >
                              <Plus size={13} /> Ersatz
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        <div className="space-y-4">
          <div className="panel p-4">
            <div className="label-tech mb-2">Standort</div>
            <div className="flex items-center gap-2 text-ink">
              <MapPin size={15} className="text-cyan" />
              {loc?.name ?? "—"}
            </div>
          </div>
          <div className="panel p-4">
            <div className="label-tech mb-2">
              <Users size={12} className="inline mr-1" /> Feste Lehrer
            </div>
            <div className="space-y-1.5">
              {teachers.map((t) => (
                <div key={t!.id} className="text-sm text-ink">
                  {t!.name}
                </div>
              ))}
              {teachers.length === 0 && (
                <div className="text-sm text-muted">keine zugewiesen</div>
              )}
            </div>
          </div>
          <div className="panel p-4">
            <div className="label-tech mb-2">Benötigt pro Block</div>
            <div
              className="text-2xl font-bold text-ink"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {cls.requiredStaff}
            </div>
          </div>
        </div>
      </div>

      {picker && (
        <SubstitutePicker
          open
          classId={cls.id}
          blockId={picker.blockId}
          absentPersonId={picker.absentPersonId}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
