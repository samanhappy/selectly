type ClassValue = string | number | null | undefined | ClassDictionary | ClassArray;
interface ClassDictionary {
  [id: string]: any;
}
type ClassArray = ClassValue[];

// Minimal clsx implementation to avoid extra deps
function toValue(mix: ClassValue): string {
  if (typeof mix === 'string' || typeof mix === 'number') return String(mix);
  if (Array.isArray(mix)) return mix.map(toValue).filter(Boolean).join(' ');
  if (mix && typeof mix === 'object')
    return Object.keys(mix)
      .filter((k) => (mix as ClassDictionary)[k])
      .join(' ');
  return '';
}

export function cn(...inputs: ClassValue[]) {
  return inputs.map(toValue).filter(Boolean).join(' ');
}
