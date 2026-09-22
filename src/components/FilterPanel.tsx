import type { TraitGroups } from '../lib/parseDisciplines'
import type { EntryTypeFilter } from '../lib/filterResults'
import { toggleInList } from '../lib/filterResults'
import { AutocompleteSelect } from './AutocompleteSelect'
import { GroupedSelect } from './GroupedSelect'

export type ClanInfo = {
  disciplines: string[]
  special_rule?: string
}

type Props = {
  attribute: string
  onAttributeChange: (value: string) => void
  attributes: string[]
  trait: string
  onTraitChange: (value: string) => void
  traitGroups: TraitGroups
  clan: string
  onClanChange: (value: string) => void
  clanNames: string[]
  clanInfo: ClanInfo | null
  levels: number[]
  onLevelsChange: (levels: number[]) => void
  types: EntryTypeFilter[]
  onTypesChange: (types: EntryTypeFilter[]) => void
  nameQuery: string
  onNameQueryChange: (value: string) => void
  book: string
  onBookChange: (value: string) => void
  bookNames: string[]
  hasFilters: boolean
  onClear: () => void
}

const LEVELS = [1, 2, 3, 4, 5] as const

const TYPE_OPTIONS: { value: EntryTypeFilter; label: string }[] = [
  { value: 'power', label: 'Moc' },
  { value: 'ritual', label: 'Rytuał' },
  { value: 'ceremony', label: 'Ceremonia' },
]

export function FilterPanel({
  attribute,
  onAttributeChange,
  attributes,
  trait,
  onTraitChange,
  traitGroups,
  clan,
  onClanChange,
  clanNames,
  clanInfo,
  levels,
  onLevelsChange,
  types,
  onTypesChange,
  nameQuery,
  onNameQueryChange,
  book,
  onBookChange,
  bookNames,
  hasFilters,
  onClear,
}: Props) {
  return (
    <aside className="filter-panel" aria-label="Filtry">
      <div className="filter-panel__header">
        <h2 className="filter-panel__title">Filtry</h2>
        {hasFilters && (
          <button type="button" className="clear-btn clear-btn--compact" onClick={onClear}>
            Wyczyść
          </button>
        )}
      </div>

      <section className="filter-section" aria-label="Nazwa">
        <h3 className="filter-section__title">Nazwa</h3>
        <input
          type="search"
          className="text-input"
          value={nameQuery}
          onChange={(e) => onNameQueryChange(e.target.value)}
          placeholder="np. Oblivion, Blood Walk…"
          aria-label="Nazwa"
          autoComplete="off"
          spellCheck={false}
        />
      </section>

      <section className="filter-section" aria-label="Pula kości">
        <h3 className="filter-section__title">Pula kości</h3>
        <div className="filter-section__pool">
          <label className="field">
            <span>Atrybut</span>
            <AutocompleteSelect
              value={attribute}
              onChange={onAttributeChange}
              options={attributes}
              emptyLabel="— dowolny —"
              aria-label="Atrybut"
            />
          </label>
          <span className="filter-section__plus" aria-hidden="true">
            +
          </span>
          <label className="field">
            <span>Umiejętność / Dyscyplina</span>
            <GroupedSelect
              value={trait}
              onChange={onTraitChange}
              groups={traitGroups}
            />
          </label>
        </div>
      </section>

      <section className="filter-section" aria-label="Klan">
        <label className="field">
          <span>Klan</span>
          <AutocompleteSelect
            value={clan}
            onChange={onClanChange}
            options={clanNames}
            emptyLabel="— dowolny —"
            aria-label="Klan"
          />
        </label>
        {clanInfo && (
          <p className="filter-section__hint">
            {clanInfo.disciplines.length > 0 ? (
              <>
                Dyscypliny klanowe:{' '}
                <strong>{clanInfo.disciplines.join(', ')}</strong>
              </>
            ) : (
              <>
                {clanInfo.special_rule ??
                  'Brak stałych dyscyplin klanowych.'}
              </>
            )}
          </p>
        )}
      </section>

      <section className="filter-section" aria-label="Typ wpisu">
        <h3 className="filter-section__title">Typ</h3>
        <div className="toggle-row" role="group" aria-label="Typ wpisu">
          {TYPE_OPTIONS.map(({ value, label }) => {
            const active = types.includes(value)
            return (
              <button
                key={value}
                type="button"
                className={`toggle-chip${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => onTypesChange(toggleInList(types, value))}
              >
                {label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="filter-section" aria-label="Poziom">
        <h3 className="filter-section__title">Poziom</h3>
        <div className="toggle-row" role="group" aria-label="Poziom mocy">
          {LEVELS.map((level) => {
            const active = levels.includes(level)
            return (
              <button
                key={level}
                type="button"
                className={`toggle-chip toggle-chip--level${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => onLevelsChange(toggleInList(levels, level))}
              >
                {level}
              </button>
            )
          })}
        </div>
      </section>

      <section className="filter-section" aria-label="Podręcznik">
        <label className="field">
          <span>Podręcznik</span>
          <AutocompleteSelect
            value={book}
            onChange={onBookChange}
            options={bookNames}
            emptyLabel="— dowolny —"
            aria-label="Podręcznik"
          />
        </label>
      </section>
    </aside>
  )
}
