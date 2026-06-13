import clsx from 'clsx'
import { getLevelPresetForSector, type RouteMapSector } from './levelMap'
import {
  getSectorUnlockHint,
  isSectorCompleted,
  isSectorUnlocked,
  type RouteMapProgress,
} from './levelProgress'

type LevelMapPanelProps = {
  sectors: RouteMapSector[]
  progress: RouteMapProgress
  selectedSectorId: string
  unlockAll?: boolean
  onSelect: (sectorId: string) => void
}

export function LevelMapPanel({
  sectors,
  progress,
  selectedSectorId,
  unlockAll = false,
  onSelect,
}: LevelMapPanelProps) {
  return (
    <section className="match3-route-map" aria-label="Карта маршрута">
      <header className="match3-route-map__head">
        <div>
          <strong>Карта маршрута</strong>
          <p className="match3-route-map__hint">
            Секторы — этапы кампании. Квесты внутри сектора — отдельные бонусные
            задачи.
          </p>
        </div>
      </header>
      <ol className="match3-route-map__track">
        {sectors.map((sector, index) => {
          const unlocked = isSectorUnlocked(sector, progress, {
            unlockAll,
          })
          const completed = isSectorCompleted(sector.id, progress)
          const selected = sector.id === selectedSectorId
          const preset = getLevelPresetForSector(sector)
          const questCount = preset.quests?.length ?? 0
          const unlockHint = getSectorUnlockHint(sector)

          return (
            <li
              key={sector.id}
              className={clsx(
                'match3-route-map__node-wrap',
                index < sectors.length - 1 &&
                  'match3-route-map__node-wrap--linked'
              )}>
              <button
                type="button"
                className={clsx(
                  'match3-route-map__node',
                  selected && 'match3-route-map__node--selected',
                  completed && 'match3-route-map__node--done',
                  !unlocked && 'match3-route-map__node--locked'
                )}
                disabled={!unlocked}
                aria-current={selected ? 'step' : undefined}
                aria-label={`${sector.title}. ${sector.tagline}`}
                onClick={() => onSelect(sector.id)}>
                <span className="match3-route-map__node-order">
                  {sector.order}
                </span>
                <span className="match3-route-map__node-title">
                  {sector.title}
                </span>
                <span className="match3-route-map__node-tagline">
                  {sector.tagline}
                </span>
                <span className="match3-route-map__node-meta">
                  Сложность: {preset.title}
                </span>
                {questCount > 0 && (
                  <span className="match3-route-map__node-quests">
                    Квестов: {questCount}
                  </span>
                )}
                {completed && (
                  <span className="match3-route-map__node-badge">Пройден</span>
                )}
                {!unlocked && unlockHint && (
                  <span className="match3-route-map__node-lock">
                    {unlockHint}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

type SectorBriefingProps = {
  sector: RouteMapSector
  goalScore: number
  moveLimit: number
  limitMode: 'moves' | 'time'
  durationMin: number
  questCount: number
}

export function SectorBriefing({
  sector,
  goalScore,
  moveLimit,
  limitMode,
  durationMin,
  questCount,
}: SectorBriefingProps) {
  const preset = getLevelPresetForSector(sector)
  return (
    <div className="match3-sector-briefing">
      <h3 className="match3-sector-briefing__title">
        {sector.title}: {sector.tagline}
      </h3>
      <dl className="match3-sector-briefing__grid">
        <div>
          <dt>Цель</dt>
          <dd>{goalScore} очков</dd>
        </div>
        <div>
          <dt>Ресурс</dt>
          <dd>
            {limitMode === 'moves'
              ? `${moveLimit} ходов`
              : `${durationMin} мин`}
          </dd>
        </div>
        <div>
          <dt>Поле</dt>
          <dd>
            {preset.boardSize}×{preset.boardSize}
          </dd>
        </div>
        {preset.targetCells && preset.targetCells > 0 ? (
          <div>
            <dt>Метки</dt>
            <dd>{preset.targetCells}</dd>
          </div>
        ) : null}
        {questCount > 0 ? (
          <div>
            <dt>Квесты</dt>
            <dd>{questCount} бонусных</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}
