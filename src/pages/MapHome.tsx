import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import LuxMap from "../components/LuxMap";
import { MapPin, ArrowRight, Users } from "lucide-react";

export default function MapHome() {
  const { classes, localities, people, absences } = useStore();
  const [selected, setSelected] = useState<string | undefined>();
  const navigate = useNavigate();

  const localityById = useMemo(
    () => new Map(localities.map((l) => [l.id, l])),
    [localities]
  );
  const personById = useMemo(
    () => new Map(people.map((p) => [p.id, p])),
    [people]
  );

  const selectedClasses = useMemo(
    () => (selected ? classes.filter((c) => c.localityId === selected) : []),
    [selected, classes]
  );

  const absentPersonIds = useMemo(
    () => new Set(absences.map((a) => a.personId)),
    [absences]
  );

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="label-tech">Situationskarte · Luxembourg</div>
          <h1
            className="text-2xl font-bold text-ink mt-1"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Wo ist welche Klasse?
          </h1>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <div
              className="text-2xl font-bold text-cyan"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {classes.length}
            </div>
            <div className="label-tech">Klassen</div>
          </div>
          <div>
            <div
              className="text-2xl font-bold text-ink"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {people.filter((p) => p.active).length}
            </div>
            <div className="label-tech">Personen</div>
          </div>
          <div>
            <div
              className={`text-2xl font-bold ${
                absences.length ? "text-amber" : "text-ink"
              }`}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {absences.length}
            </div>
            <div className="label-tech">Ausfälle</div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[1fr_340px] gap-4 min-h-0">
        <div className="panel relative overflow-hidden">
          <LuxMap
            classes={classes}
            localities={localities}
            selectedLocalityId={selected}
            onSelect={setSelected}
          />
          <div className="absolute bottom-3 left-4 label-tech pointer-events-none">
            ● Node = Standort · Zahl = Anzahl Klassen · Klick für Details
          </div>
        </div>

        <div className="panel p-4 overflow-auto">
          {!selected ? (
            <div>
              <div className="label-tech mb-3">Alle Standorte</div>
              <div className="space-y-2">
                {locListSorted(classes, localityById).map((row) => (
                  <button
                    key={row.locId}
                    onClick={() => setSelected(row.locId)}
                    className="w-full text-left panel panel-hover p-3 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin size={15} className="text-cyan" />
                      <span className="text-sm text-ink">{row.name}</span>
                    </span>
                    <span className="chip">{row.count}</span>
                  </button>
                ))}
                {classes.length === 0 && (
                  <div className="text-sm text-muted">
                    Noch keine Klassen. Lege welche unter „Klassen“ an.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <button
                className="label-tech mb-3 hover:text-cyan"
                onClick={() => setSelected(undefined)}
              >
                ← Alle Standorte
              </button>
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-cyan" />
                <span
                  className="text-lg font-bold text-ink"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {localityById.get(selected)?.name}
                </span>
              </div>
              <div className="space-y-3">
                {selectedClasses.map((c) => {
                  const teachers = c.teacherIds
                    .map((id) => personById.get(id))
                    .filter(Boolean);
                  const hasAbsent = c.teacherIds.some((id) =>
                    absentPersonIds.has(id)
                  );
                  return (
                    <button
                      key={c.id}
                      onClick={() => navigate(`/class/${c.id}`)}
                      className="w-full text-left panel panel-hover p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink">{c.name}</span>
                        <ArrowRight size={16} className="text-muted" />
                      </div>
                      <div className="text-xs text-muted mt-1">
                        {c.schoolType} {c.room ? `· ${c.room}` : ""}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                        <Users size={13} />
                        {teachers.map((t) => t!.name).join(", ") || "—"}
                      </div>
                      {hasAbsent && (
                        <div className="chip mt-2 border-amber text-amber">
                          Ausfall betroffen
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function locListSorted(
  classes: ReturnType<typeof useStore.getState>["classes"],
  localityById: Map<string, { name: string }>
) {
  const map = new Map<string, number>();
  for (const c of classes) {
    if (!c.localityId) continue;
    map.set(c.localityId, (map.get(c.localityId) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([locId, count]) => ({
      locId,
      count,
      name: localityById.get(locId)?.name ?? locId,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
