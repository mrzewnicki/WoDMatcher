import type { EntryTypeFilter } from '../lib/filterResults'

export type FilterChip = {
  id: string
  label: string
  onRemove: () => void
}

type Props = {
  chips: FilterChip[]
}

const TYPE_LABEL: Record<EntryTypeFilter, string> = {
  power: 'Moc',
  ritual: 'Rytuał',
  ceremony: 'Ceremonia',
}

export function typeChipLabel(type: EntryTypeFilter): string {
  return TYPE_LABEL[type]
}

export function FilterChips({ chips }: Props) {
  if (chips.length === 0) return null

  return (
    <div className="filter-chips" aria-label="Aktywne filtry">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className="filter-chip"
          onClick={chip.onRemove}
          title={`Usuń filtr: ${chip.label}`}
        >
          <span>{chip.label}</span>
          <span className="filter-chip__x" aria-hidden="true">
            ×
          </span>
        </button>
      ))}
    </div>
  )
}
