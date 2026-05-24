import React, { useMemo, useState } from 'react'
import { getApiResourcesUrl } from '../constants'
import { Helmet } from 'react-helmet'
import clsx from 'clsx'

import { PageInitArgs } from '../routes'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useSelector } from '../store'
import {
  fetchFriendsThunk,
  selectFriends,
  selectIsLoadingFriends,
} from '../slices/friendsSlice'
import {
  fetchLeaderboardThunk,
  leaderboardData,
  isLoadingLeaderboard,
} from '../slices/leaderboardSlice'
import { LeaderboardEntry } from '../shared/api/leaderboardConfig'
import {
  fetchUserThunk,
  selectUser,
  selectUserIsAuthChecked,
} from '../slices/userSlice'
import { usePage } from '../hooks/usePage'
import { useLandingTheme } from '../contexts/LandingThemeContext'
import { Button } from '../shared/ui'
import {
  compareLeaderboardRecordDates,
  formatLeaderboardRecordDateForDisplay,
} from '../shared/utils/leaderboardDate'

type SortKey =
  | 'rank'
  | 'nickname'
  | 'CM42_score'
  | 'bestScore'
  | 'bestScoreDate'
type SortDir = 'asc' | 'desc'
type ViewMode = 'table' | 'grid'

function compareLeaderboardEntries(
  a: LeaderboardEntry,
  b: LeaderboardEntry,
  sortKey: SortKey,
  sortDir: SortDir
): number {
  const dir = sortDir === 'asc' ? 1 : -1

  switch (sortKey) {
    case 'rank':
    case 'CM42_score': {
      const byRating = (a.CM42_score - b.CM42_score) * dir
      if (byRating !== 0) return byRating
      const byBest = (a.bestScore - b.bestScore) * dir
      if (byBest !== 0) return byBest
      return a.nickname.localeCompare(b.nickname, 'ru') * dir
    }
    case 'bestScore': {
      const byBest = (a.bestScore - b.bestScore) * dir
      if (byBest !== 0) return byBest
      return (a.CM42_score - b.CM42_score) * dir
    }
    case 'nickname':
      return a.nickname.localeCompare(b.nickname, 'ru') * dir
    case 'bestScoreDate':
      return (
        compareLeaderboardRecordDates(a.bestScoreDate, b.bestScoreDate) * dir
      )
    default:
      return 0
  }
}

function defaultSortDirForKey(key: SortKey): SortDir {
  return key === 'nickname' ? 'asc' : 'desc'
}

export function LeaderboardPage() {
  const { theme } = useLandingTheme()
  const friends = useSelector(selectFriends)
  const isLoading = useSelector(selectIsLoadingFriends)
  const isLoadingResults = useSelector(isLoadingLeaderboard)
  const user = useSelector(selectUser)

  usePage({ initPage: initLeaderboardPage })

  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [sortKey, setSortKey] = useState<SortKey>('CM42_score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [showFriendsOnly, setShowFriendsOnly] = useState(false)

  const friendNicknames = useMemo(
    () => new Set(friends.map(f => f.name)),
    [friends]
  )

  const leaderboardTable = useSelector(leaderboardData)

  const sortedEntries = useMemo(() => {
    let list = leaderboardTable
    if (showFriendsOnly && friendNicknames.size > 0) {
      list = list.filter((entry: LeaderboardEntry) =>
        friendNicknames.has(entry.nickname)
      )
    }

    const copy = [...list]
    copy.sort((a, b) => compareLeaderboardEntries(a, b, sortKey, sortDir))
    return copy
  }, [sortKey, sortDir, showFriendsOnly, friendNicknames, leaderboardTable])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir(defaultSortDirForKey(key))
  }

  const sortLabel = (key: SortKey, label: string) => {
    const isActive = sortKey === key
    const arrow = !isActive ? '' : sortDir === 'asc' ? '↑' : '↓'
    return (
      <button
        type="button"
        className={clsx('leaderboard-sort-btn', {
          'leaderboard-sort-btn--active': isActive,
        })}
        onClick={() => handleSort(key)}>
        {label} {arrow}
      </button>
    )
  }

  return (
    <div className={clsx('landing', `landing--${theme}`, 'AuthPage')}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Лидерборд CosMatch</title>
        <meta
          name="description"
          content="Таблица рекордов и рейтинг игроков CosMatch."
        />
      </Helmet>

      <Header />

      <main className="auth-main">
        <div className="auth-card auth-card--wide">
          <h1>Лидерборд</h1>
          <p className="auth-note">
            Демо-лидерборд. В будущем данные будут через API для всех и для
            фильтра друзей.
          </p>

          <div className="leaderboard-toolbar">
            <div className="leaderboard-toolbar__left">
              <Button
                type="button"
                variant={showFriendsOnly ? 'primary' : 'outline'}
                onClick={() => setShowFriendsOnly(v => !v)}>
                Друзья
              </Button>
              {isLoading && (
                <span className="leaderboard-toolbar__status">
                  Загрузка списка друзей…
                </span>
              )}
            </div>

            <div className="leaderboard-toolbar__right">
              <span className="leaderboard-view-toggle">
                Вид:
                <button
                  type="button"
                  className={clsx('leaderboard-view-toggle__btn', {
                    'is-active': viewMode === 'table',
                  })}
                  onClick={() => setViewMode('table')}>
                  Таблица
                </button>
                <button
                  type="button"
                  className={clsx('leaderboard-view-toggle__btn', {
                    'is-active': viewMode === 'grid',
                  })}
                  onClick={() => setViewMode('grid')}>
                  Плитка
                </button>
              </span>
            </div>
          </div>

          {viewMode === 'table' ? (
            <div className="extra-card leaderboard-card">
              <h3>Таблица рекордов</h3>
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>{sortLabel('rank', '#')}</th>
                    <th>{sortLabel('nickname', 'Игрок')}</th>
                    <th>{sortLabel('CM42_score', 'Рейтинг')}</th>
                    <th>{sortLabel('bestScore', 'Рекорд')}</th>
                    <th>{sortLabel('bestScoreDate', 'Дата рекорда')}</th>
                  </tr>
                </thead>
                <tbody>
                  {!isLoadingResults && sortedEntries.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        {showFriendsOnly
                          ? 'Нет записей среди ваших друзей.'
                          : 'Записей пока нет.'}
                      </td>
                    </tr>
                  )}
                  {!isLoadingResults &&
                    sortedEntries.map((entry, index) => (
                      <tr key={entry.id}>
                        <td>{index + 1}</td>
                        <td>
                          <span className="leaderboard-player">
                            <span className="leaderboard-avatar">
                              {entry.avatar ? (
                                <img
                                  src={`${getApiResourcesUrl()}${entry.avatar}`}
                                />
                              ) : (
                                <div>👤</div>
                              )}
                            </span>
                            <span>{entry.nickname || 'Gaius Anonimous'}</span>
                          </span>
                        </td>
                        <td>{entry.CM42_score}</td>
                        <td>{entry.bestScore}</td>
                        <td>
                          {formatLeaderboardRecordDateForDisplay(
                            entry.bestScoreDate
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {isLoadingResults && (
                <div className="leaderboard-card-loader">
                  Идет загрузка лучших результатов...
                </div>
              )}
            </div>
          ) : (
            <div className="extra-card leaderboard-card">
              <h3>Лучшие игроки</h3>
              <div className="leaderboard-grid-sort">
                {sortLabel('rank', '#')}
                {sortLabel('nickname', 'Игрок')}
                {sortLabel('CM42_score', 'Рейтинг')}
                {sortLabel('bestScore', 'Рекорд')}
                {sortLabel('bestScoreDate', 'Дата')}
              </div>
              <div className="leaderboard-grid">
                {sortedEntries.map((entry, index) => (
                  <div className="leaderboard-grid-item" key={entry.id}>
                    <div className="leaderboard-grid-rank">{index + 1}</div>
                    <div className="leaderboard-grid-main">
                      <div className="leaderboard-avatar-large">
                        {entry.avatar ? (
                          <img src={`${getApiResourcesUrl()}${entry.avatar}`} />
                        ) : (
                          <div>👤</div>
                        )}
                      </div>
                      <div className="leaderboard-grid-text">
                        <div className="leaderboard-grid-nickname">
                          {entry.nickname}
                        </div>
                        <div className="leaderboard-grid-rating">
                          Рейтинг: {entry.CM42_score}
                        </div>
                        <div className="leaderboard-grid-meta">
                          Рекорд: {entry.bestScore} от{' '}
                          {formatLeaderboardRecordDateForDisplay(
                            entry.bestScoreDate
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="extra-card">
            <h3>Ваши друзья</h3>
            {user ? (
              <p>
                Вы вошли как {user.first_name} {user.second_name}
              </p>
            ) : (
              <p>Пользователь не найден</p>
            )}

            {isLoading ? (
              <p>Загрузка списка друзей…</p>
            ) : friends.length === 0 ? (
              <p>Список друзей пока пуст.</p>
            ) : (
              <ul>
                {friends.map(friend => (
                  <li key={friend.name}>
                    {friend.name} {friend.secondName}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const initLeaderboardPage = ({ dispatch, state }: PageInitArgs) => {
  const queue: Array<Promise<unknown>> = [
    dispatch(
      fetchLeaderboardThunk({
        cursor: 0,
        limit: 10,
      })
    ),
    dispatch(fetchFriendsThunk()).catch(() => undefined),
  ]
  if (!selectUser(state) && !selectUserIsAuthChecked(state)) {
    queue.push(dispatch(fetchUserThunk()).catch(() => undefined))
  }
  return Promise.all(queue)
}
