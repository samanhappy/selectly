/** Build-time UI switches. Cloud access and entitlement checks are independent. */
export const isPaidUiEnabled = () => process.env.PLASMO_PUBLIC_PAID_UI_ENABLED === 'true';

export const getSupportUrl = (): string | null => {
  if (process.env.PLASMO_PUBLIC_SUPPORT_ENABLED === 'false') return null;
  const configured = process.env.PLASMO_PUBLIC_SUPPORT_URL;
  const value = configured === undefined ? 'https://ko-fi.com/samanhappy' : configured.trim();
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
};
