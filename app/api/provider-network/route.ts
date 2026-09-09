import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const revalidate = 3600;

type Row = Record<string, unknown>;

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const text = (value: unknown) => value == null ? '' : String(value).trim();
const numeric = (value: unknown) => {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
};

function pickHeader(headers: string[], candidates: RegExp[]) {
  return headers.find(header => candidates.some(pattern => pattern.test(normalize(header)))) || null;
}

function increment(map: Map<string, number>, value: string) {
  const key = value.trim() || 'Unknown';
  map.set(key, (map.get(key) || 0) + 1);
}

function topEntries(map: Map<string, number>, limit = 20) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, count]) => ({ name, count }));
}

export async function GET() {
  try {
    const workbookPath = path.join(process.cwd(), 'Directory', 'OccuMed_Anonymized_NonExpired_Clinic_Directory.xlsx');
    if (!fs.existsSync(workbookPath)) {
      return NextResponse.json({ error: 'Provider directory is unavailable.' }, { status: 404 });
    }

    const workbook = XLSX.readFile(workbookPath, { cellDates: false, dense: true });
    const rows: Row[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      rows.push(...XLSX.utils.sheet_to_json<Row>(sheet, { defval: '' }));
    }

    if (!rows.length) return NextResponse.json({ total: 0, points: [], categories: [], countries: [], states: [] });

    const headers = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
    const latitudeKey = pickHeader(headers, [/^lat$/, /latitude/]);
    const longitudeKey = pickHeader(headers, [/^lon$/, /^lng$/, /longitude/]);
    const typeKey = pickHeader(headers, [/provider type/, /clinic type/, /facility type/, /^type$/, /provider category/, /specialty/]);
    const countryKey = pickHeader(headers, [/^country$/, /country name/]);
    const stateKey = pickHeader(headers, [/^state$/, /province/, /state province/, /region/]);
    const cityKey = pickHeader(headers, [/^city$/, /municipality/]);
    const idKey = pickHeader(headers, [/provider id/, /clinic id/, /facility id/, /^id$/]);
    const servicesKey = pickHeader(headers, [/services? offered/, /^services?$/, /capabilit/]);

    const typeCounts = new Map<string, number>();
    const countryCounts = new Map<string, number>();
    const stateCounts = new Map<string, number>();
    const usablePoints: Array<{ id: string; type: string; country: string; state: string; city: string; lat: number; lon: number; services: string }> = [];

    rows.forEach((row, index) => {
      const type = typeKey ? text(row[typeKey]) : 'Provider';
      const country = countryKey ? text(row[countryKey]) : '';
      const state = stateKey ? text(row[stateKey]) : '';
      increment(typeCounts, type || 'Provider');
      if (country) increment(countryCounts, country);
      if (state) increment(stateCounts, state);

      const lat = latitudeKey ? numeric(row[latitudeKey]) : null;
      const lon = longitudeKey ? numeric(row[longitudeKey]) : null;
      if (lat == null || lon == null || lat < -90 || lat > 90 || lon < -180 || lon > 180) return;

      usablePoints.push({
        id: idKey && text(row[idKey]) ? text(row[idKey]) : `provider-${index + 1}`,
        type: type || 'Provider',
        country,
        state,
        city: cityKey ? text(row[cityKey]) : '',
        lat,
        lon,
        services: servicesKey ? text(row[servicesKey]) : '',
      });
    });

    const maxPoints = 2400;
    const stride = Math.max(1, Math.ceil(usablePoints.length / maxPoints));
    const points = usablePoints.filter((_, index) => index % stride === 0).slice(0, maxPoints);

    return NextResponse.json({
      total: rows.length,
      coordinateCount: usablePoints.length,
      points,
      categories: topEntries(typeCounts, 28),
      countries: topEntries(countryCounts, 36),
      states: topEntries(stateCounts, 36),
      detected: {
        latitude: latitudeKey,
        longitude: longitudeKey,
        type: typeKey,
        country: countryKey,
        state: stateKey,
        city: cityKey,
        services: servicesKey,
      },
    });
  } catch (error) {
    console.error('provider-network directory parse failed', error);
    return NextResponse.json({ error: 'Unable to load provider directory.' }, { status: 500 });
  }
}
