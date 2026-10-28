export const READING_PROGRESS_ENABLED = false;
export const DICTIONARY_ENABLED = false;
export const isCloudEnabled = () => process.env.PLASMO_PUBLIC_CLOUD_ENABLED === 'true';

export const isReadingProgressEnabled = () => READING_PROGRESS_ENABLED;
export const isDictionaryEnabled = () => DICTIONARY_ENABLED;

export const createReadingProgressDisabledResponse = () => ({
  success: true,
  disabled: true,
  record: null,
});

export const createDictionaryDisabledResponse = () => ({
  success: true,
  disabled: true,
});
