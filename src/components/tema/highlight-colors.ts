export const HIGHLIGHT_COLORS = {
  yellow: 'rgba(253, 224, 71, 0.4)',
  green:  'rgba(134, 239, 172, 0.4)',
  pink:   'rgba(249, 168, 212, 0.4)',
  blue:   'rgba(147, 197, 253, 0.4)',
} as const

export type HighlightColor = keyof typeof HIGHLIGHT_COLORS
