import {
  AlignCenter,
  Book,
  Bookmark,
  BrainCircuit,
  CheckCircle,
  Code,
  Cog,
  // Core actions
  Copy,
  Download,
  Eraser,
  ExternalLink,
  Eye,
  FileCode,
  FileText,
  Globe,
  Hash,
  Highlighter,
  Image,
  Languages,
  Lightbulb,
  Link,
  List,
  ListOrdered,
  ListTree,
  MessageCircle,
  Pencil,
  PenTool,
  Quote,
  Scissors,
  Search,
  Share,
  Shield,
  Sparkles,
  Star,
  Terminal,
  TextCursorInput,
  Type,
  Underline,
  Upload,
  Wand2,
  WandSparkles,
  Zap,
} from 'lucide-react';

/**
 * Icon mapping utilities for action buttons and popup UI
 */

// Predefined, curated icon registry for function configuration (key -> component)
// Only icons listed here can be chosen in Add/Edit function forms.
export const ICON_REGISTRY: Record<string, any> = {
  // Core defaults
  default: Sparkles,
  wand: Wand2,
  languages: Languages,
  search: Search,
  explain: Lightbulb,
  summarize: FileText,
  extract: Hash,
  chat: MessageCircle,
  correct: CheckCircle,
  copy: Copy,
  open: ExternalLink,
  globe: Globe,
  zap: Zap,
  brain: BrainCircuit,
  share: Share,

  // Content and editing
  pencil: Pencil,
  pen: PenTool,
  align_center: AlignCenter,
  underline: Underline,
  quote: Quote,
  list: List,
  list_ordered: ListOrdered,
  list_tree: ListTree,
  highlighter: Highlighter,
  eraser: Eraser,
  scissors: Scissors,
  type: Type,
  text_input: TextCursorInput,
  link: Link,
  bookmark: Bookmark,
  book: Book,
  image: Image,

  // Dev/formatting
  code: Code,
  file_code: FileCode,
  terminal: Terminal,
  cog: Cog,
  shield: Shield,
  star: Star,
  upload: Upload,
  download: Download,
  eye: Eye,
};

// Export a stable, user-friendly list of options for selectors
export const ICON_OPTIONS: Array<{ key: string; label: string; Icon: any }> = Object.entries(
  ICON_REGISTRY
).map(([key, Icon]) => ({
  key,
  Icon,
  label: key
    .replace(/_/g, ' ')
    .split(' ')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' '),
}));

/**
 * Get the appropriate icon component for an action key
 * @param actionKey The action key to get icon for
 * @returns The corresponding Lucide React icon component
 */
export const getActionIcon = (actionKey: string) => {
  // 1) If the provided key is in the curated registry, prefer that
  const fromRegistry = ICON_REGISTRY[actionKey];
  if (fromRegistry) return fromRegistry;

  // 2) Backward-compatible mapping for built-in action keys
  const iconMap: Record<string, any> = {
    translate: Languages,
    summarize: FileText,
    explain: Lightbulb,
    rewrite: Wand2,
    extract: Hash,
    search: Search,
    collect: Bookmark,
    chat: MessageCircle,
    polish: WandSparkles,
    correct: CheckCircle,
    copy: Copy,
    open: ExternalLink,
    share: Share,
    highlight: Highlighter,
    default: Sparkles,
  };

  const icon = iconMap[actionKey] || iconMap.default;

  if (!icon) {
    console.warn(`[getActionIcon] Icon not found for key: ${actionKey}, falling back to Sparkles`);
    return Sparkles;
  }
  return icon;
};

// Helper to validate whether a key is a selectable icon
export const isValidIconKey = (key?: string) => !!(key && ICON_REGISTRY[key]);
