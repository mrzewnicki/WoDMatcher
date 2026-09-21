import { useMemo, useState } from 'react'
import disciplinesData from '../data/V5_disciplines.json'
import clanData from '../data/V5_clan_disciplines.json'
import { PowerCard } from './components/PowerCard'
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
const clansByDiscipline = buildClanIndex(clanData as ClanMap)

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

export default function App() {
  const [attribute, setAttribute] = useState<string>('')
  const [trait, setTrait] = useState<string>('')

  const matches = useMemo(
    () => matchPowers(powers, attribute || null, trait || null),
    [attribute, trait],
  )

  const full = matches.filter((m) => m.kind === 'full')
  const partial = matches.filter((m) => m.kind === 'partial')
  const hasSelection = Boolean(attribute || trait)

  return (
    <div className="app">
      <header className="hero">
        <p className="hero__brand">Vampire Matcher</p>
        <h1 className="hero__title">Szukaj mocy po puli kości</h1>
        <p className="hero__lead">
          Wybierz atrybut i umiejętność / dyscyplinę. Pełny match wymaga obu;
          częściowy — jednego z dwóch.
        </p>
      </header>

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
          <select value={trait} onChange={(e) => setTrait(e.target.value)}>
            <option value="">— dowolna —</option>
            {traits.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        {(attribute || trait) && (
          <button
            type="button"
            className="clear-btn"
            onClick={() => {
              setAttribute('')
              setTrait('')
            }}
          >
            Wyczyść
          </button>
        )}
      </section>

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
