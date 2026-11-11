import type { LucideIcon } from "lucide-react";
import {
  Cpu,
  GraduationCap,
  Music,
  Palette,
  Presentation,
  Rocket,
  Sparkles,
  Trophy,
  Utensils,
  Users,
  Briefcase,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  GraduationCap,
  Cpu,
  Presentation,
  Rocket,
  Palette,
  Music,
  Trophy,
  Utensils,
  Users,
  Briefcase,
};

export function categoryIcon(name: string): LucideIcon {
  return ICONS[name] ?? Sparkles;
}

/** Soft tinted backgrounds for category tiles. Purple leads; pink and coral are used sparingly. */
const TILES = [
  "bg-brand-50 text-brand-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-50 text-pink-700",
  "bg-brand-100 text-brand-700",
  "bg-orange-50 text-orange-700",
  "bg-violet-100 text-violet-700",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function categoryTile(id: string): string {
  return TILES[hash(id) % TILES.length];
}

/** Cover fallback gradients. Brand-first palette. */
const COVERS = [
  "from-brand-600 to-violet",
  "from-brand-700 to-brand-500",
  "from-violet to-pink",
  "from-brand-600 to-pink",
  "from-brand-500 to-coral",
];

export function coverGradient(id: string): string {
  return COVERS[hash(id) % COVERS.length];
}

/** High quality demo event photos from Unsplash for realistic presentation. */
const DEMO_EVENT_IMAGES: Record<string, string> = {
  "cat-tech": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
  "cat-uni": "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80",
  "cat-conf": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
  "cat-startup": "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80",
  "cat-design": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80",
  "cat-culture": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
};

export function demoEventImage(categoryId: string): string {
  return (
    DEMO_EVENT_IMAGES[categoryId] ||
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80"
  );
}
