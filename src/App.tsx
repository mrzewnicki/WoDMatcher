import { useMemo, useState } from 'react'
import disciplinesData from '../data/V5_disciplines.json'
import sourcebookPowersData from '../data/V5_sourcebook_discipline_powers.json'
import ritualsData from '../data/V5_rituals_and_clan_discipline_access.json'
import clanData from '../data/V5_clan_disciplines.json'
import { FilterPanel } from './components/FilterPanel'
import {
  FilterChips,
  typeChipLabel,
  type FilterChip,
} from './components/FilterChips'
import { ResultsBoard } from './components/ResultsBoard'
import {
  collectTraitOptions,
  flattenPowers,
} from './lib/parseDisciplines'
import { flattenRituals } from './lib/parseRituals'
import { matchPowers } from './lib/matchPowers'
import {
  applyExtraFilters,
  type EntryTypeFilter,
} from './lib/filterResults'
import { groupResults, type GroupByMode } from './lib/groupResults'
import './App.css'

type ClanMap = {
  clans: Record<
    string,
    { book?: string; disciplines: string[]; special_rule?: string }
  >
}

const powers = [
  ...flattenPowers(disciplinesData as Parameters<typeof flattenPowers>[0]),
  ...flattenPowers(
    sourcebookPowersData as Parameters<typeof flattenPowers>[0],
  ),
  ...flattenRituals(
    ritualsData as Parameters<typeof flattenRituals>[0],
    disciplinesData as Parameters<typeof flattenRituals>[1],
  ),
]
const { attributes, traits } = collectTraitOptions(powers)
const typedClanData = clanData as ClanMap
const clansByDiscipline = buildClanIndex(typedClanData)
const clanNames = Object.keys(typedClanData.clans).sort((a, b) =>
  a.localeCompare(b),
)

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
  if (info.disciplines.length === 0) return results
  const allowed = new Set(info.disciplines)
  return results.filter((r) => allowed.has(r.power.discipline))
}

export default function App() {
  const [attribute, setAttribute] = useState('')
  const [trait, setTrait] = useState('')
  const [clan, setClan] = useState('')
  const [levels, setLevels] = useState<number[]>([])
  const [types, setTypes] = useState<EntryTypeFilter[]>([])
  const [nameQuery, setNameQuery] = useState('')
  const [groupBy, setGroupBy] = useState<GroupByMode>('discipline')

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
    const byClan = filterByClan(raw, clan)
    return applyExtraFilters(byClan, { levels, types, nameQuery })
  }, [attribute, trait, clan, levels, types, nameQuery])

  const sections = useMemo(
    () => groupResults(matches, groupBy),
    [matches, groupBy],
  )

  const fullCount = matches.filter((m) => m.kind === 'full').length
  const partialCount = matches.filter((m) => m.kind === 'partial').length
  const poolFiltering = Boolean(attribute || trait)
  const hasFilters = Boolean(
    attribute ||
      trait ||
      clan ||
      levels.length > 0 ||
      types.length > 0 ||
      nameQuery.trim(),
  )

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

  const onClear = () => {
    setAttribute('')
    setTrait('')
    setClan('')
    setLevels([])
    setTypes([])
    setNameQuery('')
  }

  const chips = useMemo((): FilterChip[] => {
    const list: FilterChip[] = []
    if (attribute) {
      list.push({
        id: 'attr',
        label: `Atrybut: ${attribute}`,
        onRemove: () => setAttribute(''),
      })
    }
    if (trait) {
      list.push({
        id: 'trait',
        label: `Cecha: ${trait}`,
        onRemove: () => setTrait(''),
      })
    }
    if (clan) {
      list.push({
        id: 'clan',
        label: `Klan: ${clan}`,
        onRemove: () => setClan(''),
      })
    }
    for (const type of types) {
      list.push({
        id: `type:${type}`,
        label: `Typ: ${typeChipLabel(type)}`,
        onRemove: () => setTypes((prev) => prev.filter((t) => t !== type)),
      })
    }
    for (const level of [...levels].sort((a, b) => a - b)) {
      list.push({
        id: `level:${level}`,
        label: `Poziom ${level}`,
        onRemove: () => setLevels((prev) => prev.filter((l) => l !== level)),
      })
    }
    if (nameQuery.trim()) {
      list.push({
        id: 'name',
        label: `Nazwa: ${nameQuery.trim()}`,
        onRemove: () => setNameQuery(''),
      })
    }
    return list
  }, [attribute, trait, clan, types, levels, nameQuery])

  let summaryLine = ''
  if (attribute && trait) summaryLine += ` dla ${attribute} + ${trait}`
  else if (attribute) summaryLine += ` dla atrybutu ${attribute}`
  else if (trait) summaryLine += ` dla cechy ${trait}`
  if (clan) summaryLine += ` · klan ${clan}`

  return (
    <div className="app">
      <header className="hero">
        <p className="hero__brand">WoD Matcher</p>
        <h1 className="hero__title">Dopasuj spelle pod pule kości</h1>
      </header>

      <div className="workspace">
        <FilterPanel
          attribute={attribute}
          onAttributeChange={setAttribute}
          attributes={attributes}
          trait={trait}
          onTraitChange={setTrait}
          traitGroups={traitGroups}
          clan={clan}
          onClanChange={onClanChange}
          clanNames={clanNames}
          clanInfo={clanInfo}
          levels={levels}
          onLevelsChange={setLevels}
          types={types}
          onTypesChange={setTypes}
          nameQuery={nameQuery}
          onNameQueryChange={setNameQuery}
          hasFilters={hasFilters}
          onClear={onClear}
        />

        <main className="workspace__main">
          <FilterChips chips={chips} />
          <ResultsBoard
            poolFiltering={poolFiltering}
            matches={matches}
            fullCount={fullCount}
            partialCount={partialCount}
            sections={sections}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            clansByDiscipline={clansByDiscipline}
            summaryLine={summaryLine}
          />
        </main>
      </div>
    </div>
  )
}
