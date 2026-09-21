import type { MatchResult } from '../types'

type Props = {
  result: MatchResult
  clans: string[]
}

export function PowerCard({ result, clans }: Props) {
  const { power, kind, matchedPool } = result

  return (
    <article className={`power-card power-card--${kind}`}>
      <header className="power-card__header">
        <span className={`badge badge--${kind}`}>
          {kind === 'full' ? 'Pełny' : 'Częściowy'}
        </span>
        <h3 className="power-card__title">{power.name}</h3>
        <p className="power-card__meta">
          {power.discipline} · lvl {power.level}
          {power.amalgam ? ` · Amalgam: ${power.amalgam}` : ''}
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
    </article>
  )
}
