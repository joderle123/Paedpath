import { useMemo, useState } from "react";
import type { Locality, SchoolClass } from "../types";
import { LUX_BORDER } from "../data/luxBorder";
import { makeProjection } from "../lib/geo";

interface Props {
  classes: SchoolClass[];
  localities: Locality[];
  selectedLocalityId?: string;
  onSelect: (localityId: string) => void;
}

/** Palantir/Gotham-inspirierte SVG-Karte von Luxemburg mit Klassen-Nodes. */
export default function LuxMap({
  classes,
  localities,
  selectedLocalityId,
  onSelect,
}: Props) {
  const [hover, setHover] = useState<string | undefined>();

  const localityById = useMemo(
    () => new Map(localities.map((l) => [l.id, l])),
    [localities]
  );

  // Klassen pro Ortschaft gruppieren
  const nodes = useMemo(() => {
    const map = new Map<string, { loc: Locality; classes: SchoolClass[] }>();
    for (const c of classes) {
      if (!c.localityId) continue;
      const loc = localityById.get(c.localityId);
      if (!loc) continue;
      if (!map.has(loc.id)) map.set(loc.id, { loc, classes: [] });
      map.get(loc.id)!.classes.push(c);
    }
    return [...map.values()];
  }, [classes, localityById]);

  const projection = useMemo(() => {
    const pts = [
      ...LUX_BORDER.map(([lon, lat]) => ({ lat, lon })),
      ...localities.map((l) => ({ lat: l.lat, lon: l.lon })),
    ];
    return makeProjection(pts, 1000, 60);
  }, [localities]);

  const { project, width, height } = projection;

  const borderPath =
    LUX_BORDER.map(([lon, lat], i) => {
      const p = project(lat, lon);
      return `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }).join(" ") + " Z";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      style={{ maxHeight: "100%" }}
    >
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#35d6f0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#35d6f0" stopOpacity="0" />
        </radialGradient>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id="landFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12203a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#0a1120" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Graticule */}
      <g stroke="#35d6f0" strokeOpacity="0.06" strokeWidth="1">
        {Array.from({ length: 11 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={(width / 10) * i}
            y1={0}
            x2={(width / 10) * i}
            y2={height}
          />
        ))}
        {Array.from({ length: Math.round(height / (width / 10)) + 1 }).map(
          (_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={(width / 10) * i}
              x2={width}
              y2={(width / 10) * i}
            />
          )
        )}
      </g>

      {/* Landesumriss */}
      <path
        d={borderPath}
        fill="url(#landFill)"
        stroke="#35d6f0"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        filter="url(#soft)"
      />
      <path
        d={borderPath}
        fill="none"
        stroke="#7fe9f7"
        strokeOpacity="0.8"
        strokeWidth="1"
      />

      {/* alle Orte als schwache Referenzpunkte */}
      <g>
        {localities.map((l) => {
          const p = project(l.lat, l.lon);
          return (
            <circle
              key={l.id}
              cx={p.x}
              cy={p.y}
              r={1.6}
              fill="#35d6f0"
              fillOpacity="0.22"
            />
          );
        })}
      </g>

      {/* Klassen-Nodes */}
      {nodes.map(({ loc, classes: cls }) => {
        const p = project(loc.lat, loc.lon);
        const isActive = hover === loc.id || selectedLocalityId === loc.id;
        const size = 6 + Math.min(6, cls.length * 2);
        return (
          <g
            key={loc.id}
            transform={`translate(${p.x} ${p.y})`}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHover(loc.id)}
            onMouseLeave={() => setHover(undefined)}
            onClick={() => onSelect(loc.id)}
          >
            <circle r={24} fill="url(#nodeGlow)" opacity={isActive ? 0.9 : 0.4} />
            <circle
              r={size + 6}
              fill="none"
              stroke="#35d6f0"
              strokeOpacity={isActive ? 0.5 : 0}
              strokeWidth="1"
            />
            <circle
              r={size}
              fill={isActive ? "#7fe9f7" : "#12203a"}
              stroke="#35d6f0"
              strokeWidth="1.5"
            />
            <text
              y={4}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill={isActive ? "#05070d" : "#7fe9f7"}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {cls.length}
            </text>
            <g
              transform={`translate(${size + 12} -${size})`}
              opacity={isActive ? 1 : 0.75}
            >
              <text
                fontSize="15"
                fill="#dbe6f5"
                fontWeight="600"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {loc.name}
              </text>
              <text y={17} fontSize="12" fill="#7e8ba6">
                {cls.length} {cls.length === 1 ? "Klasse" : "Klassen"}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
