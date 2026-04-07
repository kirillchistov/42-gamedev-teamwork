/**
 * Страница /game: Cosmic Match (match-3), тосты, настройки-заглушки, оболочка под тему лендинга.
 * 6.3.2 Оболочка страницы игры (полноэкран, компактная шапка, луна/солнце, найстройки игры в шапку)
 * Заголовок игры убрал совсем, настройки игры в меню в шапке, подзаголовок с описанием только на старте
 * Больше места под поле и удобство игры: компактный Header, полноэкран по кнопке и клавише F.
 * Добавил отдельный модальный слой настроек в GamePage (втч Уровень и Тип цели = Набрать очки)
 * Реализовал ref game-page-shell на корневой div; Header variant="game" + fullscreenTargetRef;
 * useEffect — hotkey F вызывает toggleFullscreen(pageShellRef) вне input/textarea/select.
 * Затронуты также: utils/fullscreen.ts, Header/index.tsx, LandingThemeContext (toggleColorMode),
 * shared/styles variables.pcss / base.pcss / themes.pcss.
 */
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Helmet } from 'react-helmet'
import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { usePage } from '../hooks/usePage'
import { Match3Screen } from '../game/match3/Match3Screen'
import type {
  GameEndPayload,
  GameHudState,
} from '../game/match3/engine/bootstrap'
import { useLandingTheme } from '../contexts/LandingThemeContext'
import { toggleFullscreen } from '../utils/fullscreen'
import {
  DEFAULT_MATCH3_LEVEL_ID,
  getMatch3LevelById,
  MATCH3_LEVELS,
  type LevelGoalType,
} from '../game/match3/engine/levels'
import {
  BOARD_SIZE_OPTIONS,
  GAME_DURATION_OPTIONS,
  GAME_THEME_OPTIONS,
  TILE_KINDS_BY_BOARD_SIZE,
  type BoardSizeOption,
  type GameDurationOption,
  type GameThemeOption,
} from '../game/match3/engine/config'

const LAST_RESULT_KEY = 'match3:last-result'

export const GamePage: React.FC = () => {
  usePage({ initPage: initGamePage })
  const { theme } = useLandingTheme()
  const pageShellRef =
    useRef<HTMLDivElement | null>(null)
  const [showSettings, setShowSettings] =
    useState(false)
  const [selectedLevelId, setSelectedLevelId] =
    useState(DEFAULT_MATCH3_LEVEL_ID)
  const [goalType, setGoalType] =
    useState<LevelGoalType>('score')
  const initialLevel = getMatch3LevelById(
    DEFAULT_MATCH3_LEVEL_ID
  )
  const [boardSize, setBoardSize] =
    useState<BoardSizeOption>(
      initialLevel.boardSize
    )
  const [themeOption, setThemeOption] =
    useState<GameThemeOption>(initialLevel.theme)
  const [durationSec, setDurationSec] =
    useState<GameDurationOption>(
      initialLevel.durationSec
    )
  const [tileKinds, setTileKinds] = useState(
    initialLevel.tileKinds
  )
  const [hintIdleMs, setHintIdleMs] =
    useState(4000)
  const [toastMessage, setToastMessage] =
    useState('')
  const [startCountdown, setStartCountdown] =
    useState(3)
  const [lastResult, setLastResult] = useState<{
    snapshot: GameHudState
    reason: GameEndPayload['reason']
  } | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const notice = (
    location.state as { notice?: string } | null
  )?.notice

  useEffect(() => {
    const raw = window.localStorage.getItem(
      LAST_RESULT_KEY
    )
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as {
        snapshot: GameHudState
        reason: GameEndPayload['reason']
      }
      if (parsed?.snapshot && parsed?.reason) {
        setLastResult(parsed)
      }
    } catch {
      window.localStorage.removeItem(
        LAST_RESULT_KEY
      )
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    setToastMessage(notice)
    navigate(location.pathname, {
      replace: true,
      state: null,
    })
  }, [notice, navigate, location.pathname])

  useEffect(() => {
    if (!toastMessage) return
    const id = window.setTimeout(() => {
      setToastMessage('')
    }, 2500)
    return () => clearTimeout(id)
  }, [toastMessage])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'f' && e.key !== 'F') return
      if (e.ctrlKey || e.metaKey || e.altKey)
        return
      const el = e.target as HTMLElement | null
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
      ) {
        return
      }
      e.preventDefault()
      void toggleFullscreen(pageShellRef.current)
    }
    window.addEventListener('keydown', onKey)
    return () =>
      window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!showSettings) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSettings(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () =>
      window.removeEventListener('keydown', onKey)
  }, [showSettings])

  const isStartRoute =
    location.pathname === '/game/start'
  const isPlayRoute =
    location.pathname === '/game/play'
  const isFinishRoute =
    location.pathname === '/game/finish'

  useEffect(() => {
    if (location.pathname === '/game') {
      navigate('/game/start', {
        replace: true,
      })
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    if (!isStartRoute) return
    setStartCountdown(3)
  }, [isStartRoute])

  useEffect(() => {
    if (!isStartRoute || startCountdown <= 0)
      return
    const id = window.setTimeout(() => {
      setStartCountdown(v => v - 1)
    }, 1000)
    return () => clearTimeout(id)
  }, [isStartRoute, startCountdown])

  const selectedLevel = useMemo(
    () => getMatch3LevelById(selectedLevelId),
    [selectedLevelId]
  )

  const appliedLevel = useMemo(
    () => ({
      ...selectedLevel,
      boardSize,
      theme: themeOption,
      durationSec,
      tileKinds,
    }),
    [
      selectedLevel,
      boardSize,
      themeOption,
      durationSec,
      tileKinds,
    ]
  )

  const finishStats = useMemo(() => {
    if (!lastResult) return null
    const { snapshot, reason } = lastResult
    const isWin =
      reason === 'goalReached' ||
      (snapshot.goalScore > 0 &&
        snapshot.score >= snapshot.goalScore)
    const goalRemain = Math.max(
      0,
      snapshot.goalScore - snapshot.score
    )
    const comboBonus = snapshot.maxCombo * 25
    const timeBonus = snapshot.timeLeftSec * 2
    const totalWithBonus =
      snapshot.score + comboBonus + timeBonus
    return {
      isWin,
      goalRemain,
      comboBonus,
      timeBonus,
      totalWithBonus,
    }
  }, [lastResult])

  const handleGameFinished = (
    payload: GameEndPayload
  ) => {
    const next = {
      snapshot: payload.snapshot,
      reason: payload.reason,
    }
    setLastResult(next)
    window.localStorage.setItem(
      LAST_RESULT_KEY,
      JSON.stringify(next)
    )
    navigate('/game/finish')
  }

  return (
    <div
      ref={pageShellRef}
      className={`landing landing--${theme} game-page-shell`}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Cosmic Match</title>
        <meta
          name="description"
          content="Игровое поле Cosmic Match."
        />
      </Helmet>

      <Header
        variant="game"
        fullscreenTargetRef={pageShellRef}
        onOpenSettings={() =>
          setShowSettings(true)
        }
      />

      <main className="auth-main match3-page__main">
        <div className="auth-card auth-card--wide match3-page__card">
          {toastMessage && (
            <div
              role="status"
              aria-live="polite"
              className="match3-page__toast-wrap">
              <div className="match3-page__toast">
                {toastMessage}
              </div>
            </div>
          )}

          {showSettings && (
            <div
              className="match3-page__settings-modal"
              onClick={e => {
                if (
                  e.target === e.currentTarget
                ) {
                  setShowSettings(false)
                }
              }}>
              <div
                className="match3-page__settings-card"
                onClick={e =>
                  e.stopPropagation()
                }>
                <div className="match3-page__settings-head">
                  <h2 className="match3-page__settings-title">
                    Настройки игры
                  </h2>
                  <button
                    type="button"
                    className="btn btn--flat"
                    onClick={() =>
                      setShowSettings(false)
                    }>
                    Закрыть
                  </button>
                </div>
                <div className="match3-page__settings-grid">
                  <label className="match3-page__settings-label">
                    Уровень
                    <select
                      value={selectedLevelId}
                      onChange={e => {
                        const nextId =
                          e.target.value
                        const preset =
                          getMatch3LevelById(
                            nextId
                          )
                        setSelectedLevelId(nextId)
                        setBoardSize(
                          preset.boardSize
                        )
                        setThemeOption(
                          preset.theme
                        )
                        setDurationSec(
                          preset.durationSec
                        )
                        setTileKinds(
                          preset.tileKinds
                        )
                      }}>
                      {MATCH3_LEVELS.map(
                        level => (
                          <option
                            key={level.id}
                            value={level.id}>
                            {level.title}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                  <label className="match3-page__settings-label">
                    Размер поля
                    <select
                      value={boardSize}
                      onChange={e => {
                        const next = Number(
                          e.target.value
                        ) as BoardSizeOption
                        setBoardSize(next)
                        setTileKinds(
                          TILE_KINDS_BY_BOARD_SIZE[
                            next
                          ]
                        )
                      }}>
                      {BOARD_SIZE_OPTIONS.map(
                        size => (
                          <option
                            key={size}
                            value={size}>
                            {size}x{size}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                  <label className="match3-page__settings-label">
                    Тематика
                    <select
                      value={themeOption}
                      onChange={e =>
                        setThemeOption(
                          e.target
                            .value as GameThemeOption
                        )
                      }>
                      {GAME_THEME_OPTIONS.map(
                        theme => (
                          <option
                            key={theme}
                            value={theme}>
                            {theme === 'standard'
                              ? 'Стандарт'
                              : theme === 'space'
                              ? 'Космос'
                              : 'Математика'}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                  <label className="match3-page__settings-label">
                    Время
                    <select
                      value={durationSec}
                      onChange={e =>
                        setDurationSec(
                          Number(
                            e.target.value
                          ) as GameDurationOption
                        )
                      }>
                      {GAME_DURATION_OPTIONS.map(
                        sec => (
                          <option
                            key={sec}
                            value={sec}>
                            {sec / 60} мин
                          </option>
                        )
                      )}
                    </select>
                  </label>
                  <label className="match3-page__settings-label">
                    Число типов фишек
                    <input
                      type="number"
                      min={4}
                      max={12}
                      value={tileKinds}
                      onChange={e =>
                        setTileKinds(
                          Math.max(
                            4,
                            Math.min(
                              12,
                              Number(
                                e.target.value
                              ) || 4
                            )
                          )
                        )
                      }
                    />
                  </label>
                  <label className="match3-page__settings-label">
                    Таймаут подсказки
                    <select
                      value={hintIdleMs}
                      onChange={e =>
                        setHintIdleMs(
                          Number(e.target.value)
                        )
                      }>
                      <option value={2000}>
                        2 сек
                      </option>
                      <option value={4000}>
                        4 сек
                      </option>
                      <option value={6000}>
                        6 сек
                      </option>
                      <option value={10000}>
                        10 сек
                      </option>
                    </select>
                  </label>
                  <label className="match3-page__settings-label">
                    Тип цели
                    <select
                      value={goalType}
                      onChange={e =>
                        setGoalType(
                          e.target
                            .value as LevelGoalType
                        )
                      }>
                      <option value="score">
                        Набрать очки
                      </option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          )}

          {isStartRoute && (
            <section className="match3 match3--start">
              <div className="match3__arena">
                {startCountdown > 0 ? (
                  <div className="match3__overlay match3__overlay--results">
                    <div className="match3__countdown">
                      {startCountdown}
                    </div>
                  </div>
                ) : (
                  <div className="match3__overlay match3__overlay--results">
                    <p className="match3__start-glow-note">
                      Cosmic Match: комбинируй,
                      набирай очки, побеждай
                      время!
                    </p>
                    <div className="match3__start-info">
                      <div>
                        Уровень:{' '}
                        {appliedLevel.title}
                      </div>
                      <div>
                        Цель:{' '}
                        {goalType === 'score'
                          ? `${appliedLevel.goalValue} очков`
                          : '—'}
                      </div>
                      <div>
                        Поле:{' '}
                        {appliedLevel.boardSize}x
                        {appliedLevel.boardSize}
                      </div>
                      <div>
                        Тема:{' '}
                        {appliedLevel.theme ===
                        'standard'
                          ? 'Стандарт'
                          : appliedLevel.theme ===
                            'space'
                          ? 'Космос'
                          : 'Математика'}
                      </div>
                      <div>
                        Время:{' '}
                        {appliedLevel.durationSec /
                          60}{' '}
                        мин
                      </div>
                      <div>
                        Типов фишек:{' '}
                        {appliedLevel.tileKinds}
                      </div>
                    </div>
                    <div className="match3__start-actions">
                      <button
                        type="button"
                        className="btn btn--outline match3__settings-play-btn"
                        onClick={() =>
                          setShowSettings(true)
                        }>
                        Настройки
                      </button>
                      <button
                        type="button"
                        className="btn btn--primary match3__play-btn"
                        onClick={() =>
                          navigate('/game/play')
                        }>
                        Играть
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {isPlayRoute && (
            <Match3Screen
              selectedLevelId={selectedLevelId}
              goalType={goalType}
              boardSize={boardSize}
              themeOption={themeOption}
              durationSec={durationSec}
              tileKinds={tileKinds}
              hintIdleMs={hintIdleMs}
              onOpenSettings={() =>
                setShowSettings(true)
              }
              forcePlayMode
              onGameFinished={handleGameFinished}
            />
          )}

          {isFinishRoute && (
            <section className="match3">
              <div className="match3__arena">
                <div className="match3__overlay match3__overlay--results">
                  <h3 className="match3__results-title">
                    {finishStats?.isWin
                      ? 'Победа!'
                      : 'Поражение'}
                  </h3>
                  <p
                    className={
                      'match3__results-verdict ' +
                      (finishStats?.isWin
                        ? 'is-win'
                        : 'is-lose')
                    }>
                    {finishStats?.isWin
                      ? 'Цель уровня выполнена'
                      : lastResult?.reason ===
                        'timeOut'
                      ? 'Время вышло, цель не достигнута'
                      : 'Цель не достигнута'}
                  </p>
                  {lastResult ? (
                    <ul className="match3__results-list">
                      <li>
                        Счёт:{' '}
                        {
                          lastResult.snapshot
                            .score
                        }
                      </li>
                      <li>
                        Цель:{' '}
                        {
                          lastResult.snapshot
                            .goalScore
                        }
                      </li>
                      <li>
                        Ходов:{' '}
                        {
                          lastResult.snapshot
                            .moves
                        }
                      </li>
                      <li>
                        Прогресс цели:{' '}
                        {
                          lastResult.snapshot
                            .goalProgressPct
                        }
                        %
                      </li>
                      <li>
                        Осталось до цели:{' '}
                        {finishStats?.goalRemain ??
                          0}
                      </li>
                      <li>
                        Лучшее комбо: x
                        {
                          lastResult.snapshot
                            .maxCombo
                        }
                      </li>
                      <li>
                        Бонус за комбо: +
                        {finishStats?.comboBonus ??
                          0}
                      </li>
                      <li>
                        Бонус за время: +
                        {finishStats?.timeBonus ??
                          0}
                      </li>
                      <li>
                        Итог с бонусами:{' '}
                        {finishStats?.totalWithBonus ??
                          0}
                      </li>
                    </ul>
                  ) : (
                    <p className="match3__results-verdict">
                      Нет данных о последней игре
                    </p>
                  )}
                  <button
                    type="button"
                    className="btn btn--primary match3__again-btn"
                    onClick={() =>
                      navigate('/game/play')
                    }>
                    Сыграть снова
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const initGamePage = () =>
  Promise.resolve()
