import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

export type AutocompleteGroup = {
  key: string
  label: string
  className?: string
  items: string[]
}

type Props = {
  value: string
  onChange: (value: string) => void
  /** Flat option list (attribute, clan). Ignored when `groups` is set. */
  options?: string[]
  groups?: AutocompleteGroup[]
  emptyLabel?: string
  placeholder?: string
  'aria-label'?: string
}

type FlatItem = {
  value: string
  groupKey?: string
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function rankMatch(query: string, option: string): number | null {
  if (!query) return 0
  const q = normalize(query)
  const o = normalize(option)
  if (o.startsWith(q)) return 0
  if (o.includes(q)) return 1
  if (o.split(/\s+/).some((w) => w.startsWith(q))) return 2
  return null
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return text
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  const index = lower.indexOf(q)
  if (index < 0) return text
  return (
    <>
      {text.slice(0, index)}
      <mark className="autocomplete__mark">{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  )
}

export function AutocompleteSelect({
  value,
  onChange,
  options = [],
  groups,
  emptyLabel = '— dowolny —',
  placeholder,
  'aria-label': ariaLabel,
}: Props) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [editing, setEditing] = useState(false)

  const flatItems = useMemo((): FlatItem[] => {
    if (groups) {
      return groups.flatMap((g) =>
        g.items.map((item) => ({ value: item, groupKey: g.key })),
      )
    }
    return options.map((item) => ({ value: item }))
  }, [groups, options])

  const filterQuery = editing ? query : ''

  const filtered = useMemo(() => {
    const scored = flatItems
      .map((item) => ({
        item,
        rank: rankMatch(filterQuery, item.value),
      }))
      .filter((row) => row.rank !== null)
      .sort((a, b) => {
        const byRank = (a.rank ?? 9) - (b.rank ?? 9)
        if (byRank !== 0) return byRank
        return a.item.value.localeCompare(b.item.value)
      })
    return scored.map((row) => row.item)
  }, [flatItems, filterQuery])

  const bestPrefix = useMemo(() => {
    if (!editing || !query) return null
    return (
      filtered.find((item) =>
        normalize(item.value).startsWith(normalize(query)),
      ) ?? null
    )
  }, [filtered, query, editing])

  const ghost =
    bestPrefix && query && bestPrefix.value.length > query.length
      ? bestPrefix.value.slice(
          // Preserve original casing from the option for the typed prefix length
          [...query].length,
        )
      : ''

  const menuItems = useMemo(() => {
    const empty: FlatItem = { value: '' }
    return [empty, ...filtered]
  }, [filtered])

  const commitBlur = () => {
    setEditing(false)
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
  }

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        commitBlur()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const displayValue = editing ? query : value

  const pick = (next: string) => {
    onChange(next)
    setEditing(false)
    setQuery('')
    setOpen(false)
    setActiveIndex(0)
    inputRef.current?.blur()
  }

  const onFocus = () => {
    setEditing(false)
    setQuery(value)
    setOpen(true)
    setActiveIndex(0)
    requestAnimationFrame(() => inputRef.current?.select())
  }

  const onInput = (next: string) => {
    setEditing(true)
    setQuery(next)
    setOpen(true)
    setActiveIndex(0)
    if (next === '') onChange('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, menuItems.length - 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const item = menuItems[activeIndex]
      if (item) pick(item.value)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      commitBlur()
      inputRef.current?.blur()
      return
    }
    if (
      (event.key === 'Tab' || event.key === 'ArrowRight') &&
      ghost &&
      bestPrefix &&
      inputRef.current &&
      inputRef.current.selectionStart === query.length
    ) {
      event.preventDefault()
      pick(bestPrefix.value)
    }
  }

  const groupedView = useMemo(() => {
    if (!groups) return null
    const allowed = new Set(filtered.map((f) => f.value))
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => allowed.has(item)),
      }))
      .filter((g) => g.items.length > 0)
  }, [groups, filtered])

  return (
    <div
      className={`autocomplete${open ? ' autocomplete--open' : ''}`}
      ref={rootRef}
    >
      <div className="autocomplete__field">
        <input
          ref={inputRef}
          type="text"
          className={`autocomplete__input${!displayValue ? ' autocomplete__input--placeholder' : ''}`}
          value={displayValue}
          placeholder={placeholder ?? emptyLabel}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="both"
          aria-label={ariaLabel}
          autoComplete="off"
          spellCheck={false}
          onFocus={onFocus}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {editing && ghost && (
          <span className="autocomplete__ghost" aria-hidden="true">
            <span className="autocomplete__ghost-hidden">{query}</span>
            <span className="autocomplete__ghost-rest">{ghost}</span>
          </span>
        )}
        <button
          type="button"
          className="autocomplete__toggle"
          tabIndex={-1}
          aria-label="Pokaż listę"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (open) {
              commitBlur()
              inputRef.current?.blur()
            } else {
              inputRef.current?.focus()
            }
          }}
        >
          <span className="autocomplete__chevron" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <ul
          id={listId}
          className="autocomplete__menu"
          role="listbox"
          aria-label={ariaLabel}
        >
          <li role="option" aria-selected={value === '' && activeIndex === 0}>
            <button
              type="button"
              className={`autocomplete__option${activeIndex === 0 ? ' is-active' : ''}${value === '' ? ' is-selected' : ''}`}
              onMouseEnter={() => setActiveIndex(0)}
              onClick={() => pick('')}
            >
              {emptyLabel}
            </button>
          </li>

          {groupedView
            ? groupedView.map((group) => (
                <li
                  key={group.key}
                  className="autocomplete__group"
                  role="presentation"
                >
                  <div
                    className={`autocomplete__group-label ${group.className ?? ''}`}
                  >
                    {group.label}
                  </div>
                  <ul
                    className="autocomplete__group-list"
                    role="group"
                    aria-label={group.label}
                  >
                    {group.items.map((item) => {
                      const index = menuItems.findIndex((m) => m.value === item)
                      return (
                        <li
                          key={item}
                          role="option"
                          aria-selected={value === item}
                        >
                          <button
                            type="button"
                            className={`autocomplete__option${activeIndex === index ? ' is-active' : ''}${value === item ? ' is-selected' : ''}`}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => pick(item)}
                          >
                            <Highlight text={item} query={filterQuery} />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))
            : filtered.map((item) => {
                const index = menuItems.findIndex((m) => m.value === item.value)
                return (
                  <li
                    key={item.value}
                    role="option"
                    aria-selected={value === item.value}
                  >
                    <button
                      type="button"
                      className={`autocomplete__option${activeIndex === index ? ' is-active' : ''}${value === item.value ? ' is-selected' : ''}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => pick(item.value)}
                    >
                      <Highlight text={item.value} query={filterQuery} />
                    </button>
                  </li>
                )
              })}

          {filtered.length === 0 && (
            <li className="autocomplete__empty" role="presentation">
              Brak dopasowań
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
