const TRACKING_PARAM_PATTERNS = [
  /^utm_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^gbraid$/i,
  /^wbraid$/i,
  /^mc_cid$/i,
  /^mc_eid$/i,
  /^igshid$/i,
  /^ref$/i,
];

const shouldDropParam = (key: string): boolean =>
  TRACKING_PARAM_PATTERNS.some((pattern) => pattern.test(key));

export const normalizePageUrl = (rawUrl: string): string => {
  try {
    const url = new URL(rawUrl);
    url.hash = '';

    const params = Array.from(url.searchParams.entries())
      .filter(([key]) => !shouldDropParam(key))
      .sort(([a], [b]) => a.localeCompare(b));

    url.search = '';
    for (const [key, value] of params) {
      url.searchParams.append(key, value);
    }

    return url.toString();
  } catch {
    return rawUrl.split('#')[0] || rawUrl;
  }
};
