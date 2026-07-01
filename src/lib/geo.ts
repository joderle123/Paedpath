// Geo-Hilfsfunktionen: Haversine-Distanz & Kartenprojektion.

export interface LatLon {
  lat: number;
  lon: number;
}

const R = 6371; // Erdradius in km

/** Distanz zwischen zwei Punkten in Kilometern (Luftlinie). */
export function haversineKm(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export interface Projection {
  project: (lat: number, lon: number) => { x: number; y: number };
  width: number;
  height: number;
}

/**
 * Erzeugt eine einfache equirektanguläre Projektion, die alle übergebenen
 * Punkte in eine SVG-Fläche der Breite `width` einpasst (mit Rand `pad`).
 */
export function makeProjection(
  points: LatLon[],
  width = 1000,
  pad = 48
): Projection {
  if (points.length === 0) {
    return {
      project: () => ({ x: width / 2, y: width / 2 }),
      width,
      height: width,
    };
  }
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const midLat = (minLat + maxLat) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180); // Längengrad-Stauchung
  const spanX = Math.max(1e-6, (maxLon - minLon) * kx);
  const spanY = Math.max(1e-6, maxLat - minLat);
  const innerW = width - pad * 2;
  const scale = innerW / spanX;
  const height = spanY * scale + pad * 2;
  const project = (lat: number, lon: number) => ({
    x: pad + (lon - minLon) * kx * scale,
    y: pad + (maxLat - lat) * scale,
  });
  return { project, width, height };
}
