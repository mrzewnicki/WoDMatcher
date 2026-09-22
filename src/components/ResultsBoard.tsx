import { useRef } from 'react'
import type { MatchResult } from '../types'
import type { GroupByMode, ResultSection } from '../lib/groupResults'
import { useViewTransitionValue } from '../lib/useViewTransition'
import { PowerCard } from './PowerCard'

type Props = {
  poolFiltering: boolean
  matches: MatchResult[]
  fullCount: number
  partialCount: number
  sections: ResultSection[]
  groupBy: GroupByMode
  onGroupByChange: (mode: GroupByMode) => void
  clansByDiscipline: Record<string, string[]>
  summaryLine: string
}

function SectionBlock({
  section,
  clansByDiscipline,
  depth = 0,
}: {
  section: ResultSection
  clansByDiscipline: Record<string, string[]>
  depth?: number
}) {
  const Heading = depth === 0 ? 'h2' : 'h3'

  return (
    <section
      className={`results__section results__section--depth-${depth}${section.title ? '' : ' results__section--flat'}`}
      aria-labelledby={section.title ? section.id : undefined}
    >
      {section.title ? (
        <Heading id={section.id} className="results__section-title">
          {section.title}
          <span className="results__section-count"> · {section.count}</span>
        </Heading>
      ) : null}

      {section.subsections?.map((sub) => (
        <SectionBlock
          key={sub.id}
          section={sub}
          clansByDiscipline={clansByDiscipline}
          depth={depth + 1}
        />
      ))}

      {section.results && section.results.length > 0 && (
        <div className="results__grid">
          {section.results.map((r) => (
            <PowerCard
              key={r.power.id}
              result={r}
              clans={clansByDiscipline[r.power.discipline] ?? []}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export function ResultsBoard({
  poolFiltering,
  matches,
  fullCount,
  partialCount,
  sections,
  groupBy,
  onGroupByChange,
  clansByDiscipline,
  summaryLine,
}: Props) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const resultsKey = `${groupBy}::${matches.map((m) => m.power.id).join('|')}`
  const displayed = useViewTransitionValue(
    {
      matches,
      sections,
      fullCount,
      partialCount,
      poolFiltering,
      summaryLine,
    },
    resultsKey,
    {
      fallbackClass: 'is-swapping',
      fallbackRef: bodyRef,
    },
  )

  return (
    <div className="results-board">
      <div className="results-board__toolbar">
        <p className="results__summary">
          {displayed.poolFiltering
            ? `${displayed.fullCount} pełnych · ${displayed.partialCount} częściowych`
            : `${displayed.matches.length} wyników`}
          {displayed.summaryLine}
        </p>

        <div className="group-by" role="group" aria-label="Grupowanie wyników">
          <span className="group-by__label">Grupuj</span>
          <button
            type="button"
            className={`toggle-chip${groupBy === 'none' ? ' is-active' : ''}`}
            aria-pressed={groupBy === 'none'}
            onClick={() => onGroupByChange('none')}
          >
            Brak
          </button>
          <button
            type="button"
            className={`toggle-chip${groupBy === 'discipline' ? ' is-active' : ''}`}
            aria-pressed={groupBy === 'discipline'}
            onClick={() => onGroupByChange('discipline')}
          >
            Dyscyplina
          </button>
          <button
            type="button"
            className={`toggle-chip${groupBy === 'typeLevel' ? ' is-active' : ''}`}
            aria-pressed={groupBy === 'typeLevel'}
            onClick={() => onGroupByChange('typeLevel')}
          >
            Typ i poziom
          </button>
        </div>
      </div>

      <div className="results-board__body" ref={bodyRef}>
        {displayed.matches.length === 0 ? (
          <p className="hint">Brak mocy spełniających filtry.</p>
        ) : (
          displayed.sections.map((section) => (
            <SectionBlock
              key={section.id}
              section={section}
              clansByDiscipline={clansByDiscipline}
            />
          ))
        )}
      </div>
    </div>
  )
}
