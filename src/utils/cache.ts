export const lastFetched: Record<string, number> = {};
export const cachedData: Record<string, any> = {};

export const invalidateCache = (key: string) => {
  lastFetched[key] = 0; // Forces Date.now() - lastFetched[key] > CACHE_TIME
};

export const setCache = (key: string, data: any) => {
  cachedData[key] = data;
  lastFetched[key] = Date.now();
};

export const getCache = (key: string, maxAgeMs = 60 * 1000) => {
  if (!lastFetched[key] || Date.now() - lastFetched[key] > maxAgeMs) {
    return null; // Stale or not fetched
  }
  return cachedData[key];
};
