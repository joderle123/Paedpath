import { useMemo } from "react";
import { useStore } from "../store/useStore";
import { PageHeader, Stat } from "../components/ui";
import { personStats, classStats } from "../lib/stats";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FileDown, Scale } from "lucide-react";

export default function Statistics() {
  const { people, classes, replacements, absences, settings } = useStore();

  const pStats = useMemo(
    () => personStats(people, replacements, absences, settings.schedule),
    [people, replacements, absences, settings.schedule]
  );
  const cStats = useMemo(
    () => classStats(classes, replacements, settings.schedule),
    [classes, replacements, settings.schedule]
  );

  const springerStats = pStats.filter(
    (s) => s.person.canSubstitute || s.substitutions > 0
  );
  const maxSubs = Math.max(1, ...springerStats.map((s) => s.substitutions));
  const totalSubs = replacements.length;
  const totalHours = pStats.reduce((s, x) => s + x.substituteHours, 0);

  // Fairness-Kennzahl: Standardabweichung der Einsätze über Springer
  const spread = useMemo(() => {
    const vals = springerStats.map((s) => s.substitutions);
    if (vals.length === 0) return 0;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance =
      vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    return Math.sqrt(variance);
  }, [springerStats]);

  function exportPdf() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("CDSE · Remplacement-Statistik", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(new Date().toLocaleDateString("de-DE"), 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [["Person", "Rolle", "Einsätze", "Ersatz-Std.", "Ausfälle", "Ausfall-Std."]],
      body: pStats.map((s) => [
        s.person.name,
        s.person.role === "teacher" ? "Lehrer" : "Springer",
        String(s.substitutions),
        s.substituteHours.toFixed(1),
        String(s.absences),
        s.absentHours.toFixed(1),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 29, 48] },
    });

    autoTable(doc, {
      head: [["Klasse", "Standort", "Blöcke/Woche", "Ersätze erhalten"]],
      body: cStats.map((s) => [
        s.cls.name,
        s.cls.schoolType,
        String(s.slotCount),
        String(s.replacementsReceived),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 29, 48] },
    });

    doc.save("cdse-statistik.pdf");
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Statistik"
        subtitle="Auswertung für Remplacementer und Klassen."
        actions={
          <button className="btn btn-primary" onClick={exportPdf}>
            <FileDown size={16} /> PDF-Export
          </button>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Stat label="Einsätze gesamt" value={totalSubs} accent />
        <Stat label="Ersatz-Stunden" value={totalHours.toFixed(1)} />
        <Stat label="Ausfälle erfasst" value={absences.length} />
        <Stat label="Verteilungs-Spread σ" value={spread.toFixed(2)} />
      </div>

      <div className="grid grid-cols-[1fr_1fr] gap-6">
        <div className="panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Scale size={16} className="text-cyan" />
            <span className="font-semibold text-ink">
              Einsätze pro Springer
            </span>
          </div>
          <div className="space-y-3">
            {springerStats.map((s) => (
              <div key={s.person.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-ink">{s.person.name}</span>
                  <span
                    className="text-muted"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {s.substitutions} · {s.substituteHours.toFixed(1)}h
                  </span>
                </div>
                <div className="h-2 rounded-full bg-abyss overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan"
                    style={{
                      width: `${(s.substitutions / maxSubs) * 100}%`,
                      opacity: 0.6,
                    }}
                  />
                </div>
              </div>
            ))}
            {springerStats.length === 0 && (
              <div className="text-sm text-muted">Keine Springer erfasst.</div>
            )}
          </div>
        </div>

        <div className="panel p-5">
          <div className="font-semibold text-ink mb-4">Auslastung Klassen</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-edge">
                <th className="pb-2 label-tech">Klasse</th>
                <th className="pb-2 label-tech text-right">Blöcke</th>
                <th className="pb-2 label-tech text-right">Ersätze</th>
              </tr>
            </thead>
            <tbody>
              {cStats.map((s) => (
                <tr key={s.cls.id} className="border-b border-edge/40">
                  <td className="py-2 text-ink">{s.cls.name}</td>
                  <td className="py-2 text-right text-muted">{s.slotCount}</td>
                  <td className="py-2 text-right text-cyan">
                    {s.replacementsReceived}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel p-5 mt-6">
        <div className="font-semibold text-ink mb-4">Alle Personen</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-edge">
              <th className="pb-2 label-tech">Person</th>
              <th className="pb-2 label-tech">Rolle</th>
              <th className="pb-2 label-tech text-right">Einsätze</th>
              <th className="pb-2 label-tech text-right">Ersatz-Std.</th>
              <th className="pb-2 label-tech text-right">Ausfälle</th>
              <th className="pb-2 label-tech text-right">Ausfall-Std.</th>
            </tr>
          </thead>
          <tbody>
            {pStats.map((s) => (
              <tr key={s.person.id} className="border-b border-edge/40">
                <td className="py-2 text-ink">{s.person.name}</td>
                <td className="py-2 text-muted">
                  {s.person.role === "teacher" ? "Lehrer" : "Springer"}
                </td>
                <td className="py-2 text-right text-cyan">{s.substitutions}</td>
                <td className="py-2 text-right text-muted">
                  {s.substituteHours.toFixed(1)}
                </td>
                <td className="py-2 text-right text-amber">{s.absences}</td>
                <td className="py-2 text-right text-muted">
                  {s.absentHours.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
