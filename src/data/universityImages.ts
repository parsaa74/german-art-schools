export const universityImages: Record<string, string> = {};

export function getImageForSchool(id: string, type?: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const custom = universityImages[id];
  if (custom) {
    return `${base}/images/universities/${encodeURIComponent(custom)}`;
  }
  const typeKey = ['university', 'art_academy', 'design_school', 'music_academy', 'film_school'].includes(type || '')
    ? type
    : 'default';
  return `${base}/images/university-placeholders/${typeKey}.svg`;
}
