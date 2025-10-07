/**
 * URL detection utilities
 */

/**
 * Check if a text string represents a valid URL
 * @param text The text to validate
 * @returns true if the text is a valid URL
 */
export const isValidUrl = (text: string): boolean => {
  const trimmedText = text.trim();

  // Check if contains protocol (http:// or https://)
  if (/^https?:\/\//i.test(trimmedText)) {
    return true;
  }

  // Check if starts with www.
  if (/^www\./i.test(trimmedText)) {
    return true;
  }

  // Check if contains domain format (e.g: google.com, example.org)
  // At least one dot, characters before and after dots, and ends with common TLD
  if (
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/.*)?$/i.test(
      trimmedText
    )
  ) {
    return true;
  }

  return false;
};
