import type { MatchResult } from '../types'
import { sourceParts } from '../lib/formatSource'
import { truncateText } from '../lib/truncateText'

type Props = {
  result: MatchResult
}

function kindLabel(kind: MatchResult['power']['kind']): string | null {
  if (kind === 'ritual') return 'Rytuał'
  if (kind === 'ceremony') return 'Ceremonia'
  return null
}

function DetailLine({
  label,
  value,
  max,
}: {
  label: string
  value: string
  max?: number
}) {
  const { text, truncated } = truncateText(value, max)
  return (
    <div
      className={`power-card__clip${truncated ? ' power-card__clip--fade' : ''}`}
    >
      <p className="power-card__detail">
        <span className="label">{label}:</span> {text}
      </p>
      {truncated && (
        <p className="power-card__read-more">Doczytaj w podręczniku</p>
      )}
    </div>
  )
}

export function PowerCard({ result }: Props) {
  const { power, kind, matchedPool } = result
  const typeLabel = kindLabel(power.kind)
  const showMatchBadge = kind === 'full' || kind === 'partial'
  const source = sourceParts(power.book, power.page)
  const pool = truncateText(matchedPool, 160)

  return (
    <article
      className={`power-card${showMatchBadge ? ` power-card--${kind}` : ''}${power.kind && power.kind !== 'power' ? ` power-card--${power.kind}` : ''}`}
    >
      <header className="power-card__header">
        {showMatchBadge && (
          <span className={`badge badge--${kind}`}>
            {kind === 'full' ? 'Pełny' : 'Częściowy'}
          </span>
        )}
        {typeLabel && (
          <span className={`badge badge--${power.kind}`}>{typeLabel}</span>
        )}
        <h3 className="power-card__title">{power.name}</h3>
        <p className="power-card__meta">
          {power.discipline} · lvl {power.level}
          {power.amalgam ? ` · Amalgam: ${power.amalgam}` : ''}
          {power.prerequisite ? ` · Wymaga: ${power.prerequisite}` : ''}
        </p>
      </header>

      <div
        className={`power-card__clip${pool.truncated ? ' power-card__clip--fade' : ''}`}
      >
        <p className="power-card__pool">
          <span className="label">Pula:</span> {pool.text}
        </p>
        {pool.truncated && (
          <p className="power-card__read-more">Doczytaj w podręczniku</p>
        )}
      </div>

      {power.cost && <DetailLine label="Koszt" value={power.cost} />}
      {power.duration && <DetailLine label="Czas" value={power.duration} />}

      {source && (
        <p className="power-card__source">
          {source.label}
          {source.label && source.page != null ? ' · ' : null}
          {source.page != null ? (
            <span className="power-card__source-page">s. {source.page}</span>
          ) : null}
        </p>
      )}
    </article>
  )
}
