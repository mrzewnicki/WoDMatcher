import { useMemo, useState } from 'react'
import disciplinesData from '../data/V5_disciplines.json'
import clanData from '../data/V5_clan_disciplines.json'
import { PowerCard } from './components/PowerCard'
import { GroupedSelect } from './components/GroupedSelect'
import {
  collectTraitOptions,
  flattenPowers,
} from './lib/parseDisciplines'
import { matchPowers } from './lib/matchPowers'
import './App.css'

type ClanMap = {
  clans: Record<string, { disciplines: string[]; special_rule?: string }>
}

const powers = flattenPowers(disciplinesData as Parameters<typeof flattenPowers>[0])
const { attributes, traits } = collectTraitOptions(powers)
const typedClanData = clanData as ClanMap
const clansByDiscipline = buildClanIndex(typedClanData)
const clanNames = Object.keys(typedClanData.clans).sort((a, b) => a.localeCompare(b))

function buildClanIndex(data: ClanMap): Record<string, string[]> {
  const index: Record<string, string[]> = {}
  for (const [clan, info] of Object.entries(data.clans)) {
    for (const disc of info.disciplines) {
      if (!index[disc]) index[disc] = []
      index[disc].push(clan)
    }
  }
  return index
}

function filterByClan(
  results: ReturnType<typeof matchPowers>,
  clan: string,
): ReturnType<typeof matchPowers> {
  if (!clan) return results
  const info = typedClanData.clans[clan]
  if (!info) return results
  // Caitiff: any disciplines of player's choice — no narrowing.
  if (info.disciplines.length === 0) return results
  const allowed = new Set(info.disciplines)
  return results.filter((r) => allowed.has(r.power.discipline))
}

export default function App() {
  const [attribute, setAttribute] = useState<string>('')
  const [trait, setTrait] = useState<string>('')
  const [clan, setClan] = useState<string>('')

  const clanInfo = clan ? typedClanData.clans[clan] : null

  const traitGroups = useMemo(() => {
    if (!clanInfo || clanInfo.disciplines.length === 0) return traits
    const allowed = new Set(clanInfo.disciplines)
    return {
      ...traits,
      disciplines: traits.disciplines.filter((d) => allowed.has(d)),
    }
  }, [clanInfo])

  const matches = useMemo(() => {
    const raw = matchPowers(powers, attribute || null, trait || null)
    return filterByClan(raw, clan)
  }, [attribute, trait, clan])

  const full = matches.filter((m) => m.kind === 'full')
  const partial = matches.filter((m) => m.kind === 'partial')
  const hasSelection = Boolean(attribute || trait)
  const hasFilters = Boolean(attribute || trait || clan)

  const onClanChange = (next: string) => {
    setClan(next)
    const info = next ? typedClanData.clans[next] : null
    if (
      trait &&
      info &&
      info.disciplines.length > 0 &&
      traits.disciplines.includes(trait) &&
      !info.disciplines.includes(trait)
    ) {
      setTrait('')
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <p className="hero__brand">Vampire Matcher</p>
        <h1 className="hero__title">Szukaj mocy po puli kości</h1>
        <p className="hero__lead">
          Wybierz atrybut i umiejętność / dyscyplinę. Pełny match wymaga obu
          wskazanych argumentów w puli; częściowy — tylko jednego.
        </p>
      </header>

      <div className="filters">
        <section className="pool-picker" aria-label="Wybór puli kości">
          <label className="field">
            <span>Atrybut</span>
            <select
              value={attribute}
              onChange={(e) => setAttribute(e.target.value)}
            >
              <option value="">— dowolny —</option>
              {attributes.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <span className="pool-picker__plus" aria-hidden="true">
            +
          </span>

          <label className="field">
            <span>Umiejętność / Dyscyplina</span>
            <GroupedSelect
              value={trait}
              onChange={setTrait}
              groups={traitGroups}
            />
          </label>

          {hasFilters && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => {
                setAttribute('')
                setTrait('')
                setClan('')
              }}
            >
              Wyczyść
            </button>
          )}
        </section>

        <section className="clan-filter" aria-label="Filtr klanu">
          <label className="field field--clan">
            <span>Klan</span>
            <select value={clan} onChange={(e) => onClanChange(e.target.value)}>
              <option value="">— dowolny —</option>
              {clanNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          {clanInfo && (
            <p className="clan-filter__hint">
              {clanInfo.disciplines.length > 0 ? (
                <>
                  Dyscypliny klanowe:{' '}
                  <strong>{clanInfo.disciplines.join(', ')}</strong>
                </>
              ) : (
                <>{clanInfo.special_rule ?? 'Brak stałych dyscyplin klanowych.'}</>
              )}
            </p>
          )}
        </section>
      </div>

      {!hasSelection && (
        <p className="hint">Wybierz przynajmniej jeden element puli, aby zobaczyć wyniki.</p>
      )}

      {hasSelection && (
        <div className="results">
          <p className="results__summary">
            {full.length} pełnych · {partial.length} częściowych
            {attribute && trait ? ` dla ${attribute} + ${trait}` : ''}
            {attribute && !trait ? ` dla atrybutu ${attribute}` : ''}
            {!attribute && trait ? ` dla cechy ${trait}` : ''}
            {clan ? ` · klan ${clan}` : ''}
          </p>

          {full.length > 0 && (
            <section className="results__group">
              <h2>Pełne dopasowania</h2>
              <div className="results__grid">
                {full.map((r) => (
                  <PowerCard
                    key={r.power.id}
                    result={r}
                    clans={clansByDiscipline[r.power.discipline] ?? []}
                  />
                ))}
              </div>
            </section>
          )}

          {partial.length > 0 && (
            <section className="results__group">
              <h2>Częściowe dopasowania</h2>
              <div className="results__grid">
                {partial.map((r) => (
                  <PowerCard
                    key={r.power.id}
                    result={r}
                    clans={clansByDiscipline[r.power.discipline] ?? []}
                  />
                ))}
              </div>
            </section>
          )}

          {matches.length === 0 && (
            <p className="hint">Brak mocy z taką pulą kości.</p>
          )}
        </div>
      )}
    </div>
  )
}
