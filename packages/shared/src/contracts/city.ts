export type SearchCityQuery = {
  keyword: string;
};

export type TopCitiesQuery = {
  rangeType?: 'world' | 'cn' | 'us';
  number?: number;
};

export type CityItem = {
  cityId: string;
  name: string;
  lat: string;
  lon: string;
  adm2: string;
  adm1: string;
  country: string;
};

