export type WeatherAlertItem = {
  id: string;
  headline: string;
  description: string;
  instruction?: string;
  effectiveTime?: string;
  expireTime?: string;
  severity?: string;
  eventType: { name: string };
  color: { code?: string };
};

export type WeatherAlertResponse = {
  zeroResult: boolean;
  alerts: WeatherAlertItem[];
};

