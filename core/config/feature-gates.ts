export const READING_PROGRESS_ENABLED = false;

export const isReadingProgressEnabled = () => READING_PROGRESS_ENABLED;

export const createReadingProgressDisabledResponse = () => ({
  success: true,
  disabled: true,
  record: null,
});
