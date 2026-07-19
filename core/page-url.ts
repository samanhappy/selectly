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
  const value = rawUrl || '';

  try {
    const url = new URL(value);
    url.hash = '';

    const params = Array.from(url.searchParams.entries())
      .filter(([key]) => !shouldDropParam(key))
      .sort(([aKey, aValue], [bKey, bValue]) => {
        const keyOrder = aKey.localeCompare(bKey);
        return keyOrder === 0 ? aValue.localeCompare(bValue) : keyOrder;
      });

    url.search = '';
    for (const [key, value] of params) {
      url.searchParams.append(key, value);
    }

    return url.toString();
  } catch {
    return value.split('#')[0] || value;
  }
};

export interface PageUrlItem {
  url: string;
  title: string;
  hostname: string;
  created_at?: number;
}

export interface PageUrlGroup<T extends PageUrlItem> {
  url: string;
  items: T[];
  latest: number;
  title: string;
  hostname: string;
}

export const groupItemsByPageUrl = <T extends PageUrlItem>(items: T[]): PageUrlGroup<T>[] => {
  const map = new Map<string, T[]>();

  for (const item of items) {
    const key = normalizePageUrl(item.url);
    const group = map.get(key);
    if (group) {
      group.push(item);
    } else {
      map.set(key, [item]);
    }
  }

  return Array.from(map.entries())
    .map(([url, groupItems]) => {
      const latestItem = groupItems.reduce((latest, item) =>
        (item.created_at || 0) > (latest.created_at || 0) ? item : latest
      );

      return {
        url,
        items: groupItems,
        latest: latestItem.created_at || 0,
        title: latestItem.title,
        hostname: latestItem.hostname,
      };
    })
    .sort((a, b) => b.latest - a.latest);
};
