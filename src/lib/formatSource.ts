import booksData from '../../data/V5_books.json'
import type { Book, BookId, PowerEntry } from '../types'

const books = booksData.books as Record<BookId, Book>

/** Human-readable short book name for UI (never file paths). */
export function bookLabel(bookId?: BookId): string | undefined {
  if (!bookId) return undefined
  return books[bookId]?.short_name ?? bookId
}

/** Unique short names of books present on powers, sorted. */
export function collectBookOptions(powers: PowerEntry[]): string[] {
  const names = new Set<string>()
  for (const power of powers) {
    const label = bookLabel(power.book)
    if (label) names.add(label)
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'pl'))
}

export type SourceParts = {
  label?: string
  page?: number | string
}

/** Split source into book label + page for separate styling. */
export function sourceParts(
  bookId?: BookId,
  page?: number | string,
): SourceParts | undefined {
  const label = bookLabel(bookId)
  const hasPage = page != null && page !== ''
  if (!label && !hasPage) return undefined
  return {
    label: label || undefined,
    page: hasPage ? page : undefined,
  }
}

/** e.g. "Player's Guide · s. 69" or "Camarilla · s. 168-169" */
export function formatSource(
  bookId?: BookId,
  page?: number | string,
): string | undefined {
  const parts = sourceParts(bookId, page)
  if (!parts) return undefined
  if (parts.label && parts.page != null) return `${parts.label} · s. ${parts.page}`
  if (parts.label) return parts.label
  return `s. ${parts.page}`
}
