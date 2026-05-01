const MATERIAL_ICON_ALIASES: Record<string, string> = {
  // Legacy/custom names stored in DB that are not valid MaterialIcons glyphs.
  heart: 'favorite',
  cross: 'add',
  gift: 'card-giftcard',
  pray: 'front-hand',
  music: 'music-note',
  'medical-bag': 'medical-services',
  'book-open': 'menu-book',
  'book-series': 'collections',
  'collections-bookmark': 'collections',
};

export function toMaterialIconName(icon: string | null | undefined, fallback = 'help-outline'): string {
  if (!icon) return fallback;
  return MATERIAL_ICON_ALIASES[icon] || icon;
}
