export type QweatherGeoCity = {
  cityId: string;
  name: string;
  lat: string;
  lon: string;
  adm2: string;
  adm1: string;
  country: string;
};

export type QweatherTopCityRange = 'world' | 'cn' | 'us';

export type QweatherAirRealtime = {
  pubTime: string; // ISO string
  aqi: number;
  level: string;
  category: string;
  primary?: string;
  pm10: number;
  pm2p5: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
};

export type QweatherWeatherAlert = {
  zeroResult: boolean;
  alerts: Array<{
    id: string;
    headline: string;
    description: string;
    instruction?: string;
    effectiveTime?: string;
    expireTime?: string;
    severity?: string;
    eventType: { name: string };
    color: { code?: string };
  }>;
};

export type QweatherSummary = Record<string, unknown>;
export type QweatherStats = Record<string, unknown>;

