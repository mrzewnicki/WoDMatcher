import type { MatchResult } from '../types'

type Props = {
  result: MatchResult
  clans: string[]
}

function kindLabel(kind: MatchResult['power']['kind']): string | null {
  if (kind === 'ritual') return 'Rytuał'
  if (kind === 'ceremony') return 'Ceremonia'
  return null
}

export function PowerCard({ result, clans }: Props) {
  const { power, kind, matchedPool } = result
  const typeLabel = kindLabel(power.kind)
  const showMatchBadge = kind === 'full' || kind === 'partial'

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

      <p className="power-card__pool">
        <span className="label">Pula:</span> {matchedPool}
      </p>

      {clans.length > 0 && (
        <p className="power-card__clans">
          <span className="label">Klany:</span> {clans.join(', ')}
        </p>
      )}

      {power.cost && (
        <p className="power-card__detail">
          <span className="label">Koszt:</span> {power.cost}
        </p>
      )}
      {power.duration && (
        <p className="power-card__detail">
          <span className="label">Czas:</span> {power.duration}
        </p>
      )}
      {power.ingredients && (
        <p className="power-card__detail">
          <span className="label">Składniki:</span> {power.ingredients}
        </p>
      )}
    </article>
  )
}
