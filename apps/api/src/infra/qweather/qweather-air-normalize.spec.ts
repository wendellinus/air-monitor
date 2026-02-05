import { normalizeQweatherAirRealtime } from './qweather-air-normalize';
import { normalizeQweatherAirTimelineItem } from './qweather-air-normalize';

describe('normalizeQweatherAirRealtime', () => {
  it('normalizes v7 air/now responses', () => {
    const data = {
      code: '200',
      now: {
        pubTime: '2026-02-03T02:35:02.000Z',
        aqi: '62',
        level: '2',
        category: '良',
        primary: 'PM2.5',
        pm10: '30',
        pm2p5: '20',
        no2: '10',
        so2: '2',
        co: '0.6',
        o3: '50',
      },
    };

    expect(normalizeQweatherAirRealtime(data)).toEqual({
      pubTime: '2026-02-03T02:35:02.000Z',
      aqi: 62,
      level: '2',
      category: '良',
      primary: 'PM2.5',
      pm10: 30,
      pm2p5: 20,
      no2: 10,
      so2: 2,
      co: 0.6,
      o3: 50,
    });
  });

  it('normalizes v1/JWT airquality current responses (indexes + pollutants)', () => {
    const data = {
      indexes: [
        {
          name: 'AQI',
          aqi: 80,
          level: '3',
          category: '轻度',
          primaryPollutant: 'PM10',
          pubTime: '2026-02-03T02:35:02.000Z',
        },
      ],
      pollutants: [
        { code: 'pm2p5', concentration: { value: 12.3, unit: 'μg/m3' } },
        { code: 'pm10', concentration: { value: 45 } },
        { code: 'no2', concentration: { value: 9 } },
        { code: 'so2', concentration: { value: 1 } },
        { code: 'co', concentration: { value: 0.7 } },
        { code: 'o3', concentration: { value: 88 } },
      ],
      pubTime: '2026-02-03T02:35:02.000Z',
    };

    expect(normalizeQweatherAirRealtime(data)).toEqual({
      pubTime: '2026-02-03T02:35:02.000Z',
      aqi: 80,
      level: '3',
      category: '轻度',
      primary: 'PM10',
      pm10: 45,
      pm2p5: 12.3,
      no2: 9,
      so2: 1,
      co: 0.7,
      o3: 88,
    });
  });

  it('does not treat partial pollutant data as empty', () => {
    const data = {
      indexes: [],
      pollutants: [{ code: 'pm10', concentration: { value: 23 } }],
    };

    const out = normalizeQweatherAirRealtime(data);
    expect(out.pm10).toBe(23);
    expect(out.pm2p5).toBe(0);
  });

  it('throws on empty/unrecognized responses', () => {
    expect(() => normalizeQweatherAirRealtime({})).toThrow(/QWeather Air returned empty data/i);
  });
});

describe('normalizeQweatherAirTimelineItem', () => {
  it('normalizes hourly items with indexes/pollutants (JWT style)', () => {
    const item = {
      fxTime: '2026-02-03T03:00:00.000Z',
      indexes: [{ name: 'AQI', aqi: 88, level: '3', category: '轻度', primary: 'PM2.5' }],
      pollutants: [{ code: 'pm2p5', concentration: { value: 18 } }],
    };

    expect(normalizeQweatherAirTimelineItem(item)).toEqual({
      fxTime: '2026-02-03T03:00:00.000Z',
      pubTime: '2026-02-03T03:00:00.000Z',
      aqi: 88,
      level: '3',
      category: '轻度',
      primary: 'PM2.5',
      pm10: 0,
      pm2p5: 18,
      no2: 0,
      so2: 0,
      co: 0,
      o3: 0,
    });
  });

  it('passes through flat hourly items (v7-ish)', () => {
    expect(
      normalizeQweatherAirTimelineItem({
        fxTime: '2026-02-03T03:00:00.000Z',
        aqi: 55,
      }),
    ).toEqual({
      fxTime: '2026-02-03T03:00:00.000Z',
      pubTime: '2026-02-03T03:00:00.000Z',
      aqi: 55,
      level: undefined,
      category: undefined,
      primary: undefined,
      pm10: undefined,
      pm2p5: undefined,
      no2: undefined,
      so2: undefined,
      co: undefined,
      o3: undefined,
    });
  });

  it('returns null for empty items', () => {
    expect(normalizeQweatherAirTimelineItem({})).toBeNull();
  });
});
