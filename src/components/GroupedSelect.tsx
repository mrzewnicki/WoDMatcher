import { useEffect, useId, useRef, useState } from 'react'
import type { TraitGroups } from '../lib/parseDisciplines'

type GroupKey = keyof TraitGroups

type Props = {
  value: string
  onChange: (value: string) => void
  groups: TraitGroups
  emptyLabel?: string
}

const GROUP_META: { key: GroupKey; label: string; className: string }[] = [
  { key: 'skills', label: 'Umiejętności', className: 'grouped-select__group-label--skills' },
  { key: 'disciplines', label: 'Dyscypliny', className: 'grouped-select__group-label--disciplines' },
  { key: 'other', label: 'Inne', className: 'grouped-select__group-label--other' },
]

export function GroupedSelect({
  value,
  onChange,
  groups,
  emptyLabel = '— dowolna —',
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const display = value || emptyLabel

  const pick = (next: string) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <div className={`grouped-select${open ? ' grouped-select--open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="grouped-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={value ? undefined : 'grouped-select__placeholder'}>
          {display}
        </span>
        <span className="grouped-select__chevron" aria-hidden="true" />
      </button>

      {open && (
        <ul
          id={listId}
          className="grouped-select__menu"
          role="listbox"
          aria-label="Umiejętność lub dyscyplina"
        >
          <li role="option" aria-selected={value === ''}>
            <button
              type="button"
              className={`grouped-select__option${value === '' ? ' is-selected' : ''}`}
              onClick={() => pick('')}
            >
              {emptyLabel}
            </button>
          </li>

          {GROUP_META.map(({ key, label, className }) => {
            const items = groups[key]
            if (items.length === 0) return null
            return (
              <li key={key} className="grouped-select__group" role="presentation">
                <div className={`grouped-select__group-label ${className}`}>{label}</div>
                <ul className="grouped-select__group-list" role="group" aria-label={label}>
                  {items.map((item) => (
                    <li key={item} role="option" aria-selected={value === item}>
                      <button
                        type="button"
                        className={`grouped-select__option${value === item ? ' is-selected' : ''}`}
                        onClick={() => pick(item)}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
