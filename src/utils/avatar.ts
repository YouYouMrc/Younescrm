// Portraits style ligne (notionists) avec fond coloré déterministe

const BG_COLORS = [
  'b6d9f7', // bleu ciel
  'c9b8f0', // lavande
  'f7c5d0', // rose
  'fdd9b5', // pêche
  'b5ead7', // menthe
  'f9f0a8', // jaune doux
  'c8f0c8', // vert clair
  'f0c8f0', // lilas
  'd0eaff', // bleu poudre
  'ffe4b5', // moccasin
]

function nameHash(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (Math.imul(31, h) + name.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function getAvatarUrl(name: string): string {
  const clean = (name || 'user').trim()
  const seed  = encodeURIComponent(clean)
  const bg    = BG_COLORS[nameHash(clean) % BG_COLORS.length]
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=${bg}&radius=50`
}

// kept for backward compat
export function getNameEmoji(name: string): string {
  return getAvatarUrl(name)
}
