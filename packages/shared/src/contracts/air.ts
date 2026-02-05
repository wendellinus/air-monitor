export type CityIdQuery = {
  city_id: string;
};

export type AirNowItem = {
  cityId: string;
  pubTime: string;
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

// QWeather hourly/daily responses include more fields. Keep an index signature
// so callers can use known fields while we remain forward-compatible.
export type AirHourlyItem = {
  cityId: string;
  pubTime?: string;
  aqi?: number;
  level?: string;
  category?: string;
  primary?: string;
  pm10?: number;
  pm2p5?: number;
  no2?: number;
  so2?: number;
  co?: number;
  o3?: number;
  [k: string]: unknown;
};

export type AirDailyItem = {
  cityId: string;
  fxDate?: string;
  aqi?: number;
  level?: string;
  category?: string;
  primary?: string;
  pm10?: number;
  pm2p5?: number;
  no2?: number;
  so2?: number;
  co?: number;
  o3?: number;
  [k: string]: unknown;
};

