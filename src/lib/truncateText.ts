const DEFAULT_MAX = 200

/** Truncate long copy for card previews; keeps first `max` characters. */
export function truncateText(
  value: string,
  max: number = DEFAULT_MAX,
): { text: string; truncated: boolean } {
  const trimmed = value.trim()
  if (trimmed.length <= max) return { text: trimmed, truncated: false }

  const slice = trimmed.slice(0, max)
  const breakAt = Math.max(slice.lastIndexOf(' '), slice.lastIndexOf('\n'))
  const cut = breakAt > max * 0.6 ? slice.slice(0, breakAt) : slice
  return { text: cut.trimEnd(), truncated: true }
}
