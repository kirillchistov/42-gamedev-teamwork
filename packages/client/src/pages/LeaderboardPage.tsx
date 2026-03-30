// Пока заглушка, потом будет страница "Результаты/Лидерборд"
import React, { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet'
import clsx from 'clsx'

import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useSelector } from '../store'
import {
  // fetchFriendsThunk,
  selectFriends,
  selectIsLoadingFriends,
} from '../slices/friendsSlice'
import { selectUser } from '../slices/userSlice'
import { usePage } from '../hooks/usePage'
// import { PageInitArgs } from '../routes'
import { Button } from '../shared/ui'

type LeaderboardEntry = {
  id: number
  nickname: string
  avatarEmoji: string
  rating: number // общий рейтинг (сумма очков за всё время)
  gamesPlayed: number // сыграно игр
  bestScore: number // рекорд одной игры
  bestScoreDate: string // дата рекорда
}

// демо-данные
const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 1,
    nickname: 'Max_Fox',
    avatarEmoji: '🦊',
    rating: 60000,
    gamesPlayed: 124,
    bestScore: 8200,
    bestScoreDate: '2026-03-18',
  },
  {
    id: 2,
    nickname: 'Kira',
    avatarEmoji: '🛸',
    rating: 56000,
    gamesPlayed: 98,
    bestScore: 7900,
    bestScoreDate: '2026-03-17',
  },
  {
    id: 3,
    nickname: 'Mila_sila',
    avatarEmoji: '🌌',
    rating: 34000,
    gamesPlayed: 76,
    bestScore: 6400,
    bestScoreDate: '2026-03-16',
  },
  {
    id: 4,
    nickname: 'Cat_Banan',
    avatarEmoji: '🐱',
    rating: 24011,
    gamesPlayed: 52,
    bestScore: 5200,
    bestScoreDate: '2026-03-15',
  },
  {
    id: 5,
    nickname: 'Sanka',
    avatarEmoji: '🚀',
    rating: 20970,
    gamesPlayed: 61,
    bestScore: 5100,
    bestScoreDate: '2026-03-14',
  },
  {
    id: 6,
    nickname: 'Kola_pep',
    avatarEmoji: '🪐',
    rating: 12906,
    gamesPlayed: 35,
    bestScore: 3900,
    bestScoreDate: '2026-03-12',
  },
]

type SortKey =
  | 'rating'
  | 'gamesPlayed'
  | 'bestScore'
  | 'nickname'
type SortDir = 'asc' | 'desc'
type ViewMode = 'table' | 'grid'

export const LeaderboardPage: React.FC = () => {
  const friends = useSelector(selectFriends)
  const isLoading = useSelector(
    selectIsLoadingFriends
  )
  const user = useSelector(selectUser)

  usePage({ initPage: initLeaderboardPage })

  const [viewMode, setViewMode] =
    useState<ViewMode>('table')
  const [sortKey, setSortKey] =
    useState<SortKey>('rating')
  const [sortDir, setSortDir] =
    useState<SortDir>('desc')
  const [showFriendsOnly, setShowFriendsOnly] =
    useState(false)

  const friendNicknames = useMemo(
    () => new Set(friends.map(f => f.name)),
    [friends]
  )

  const sortedEntries = useMemo(() => {
    let list = DEMO_LEADERBOARD

    if (
      showFriendsOnly &&
      friendNicknames.size > 0
    ) {
      list = list.filter(entry =>
        friendNicknames.has(entry.nickname)
      )
    }

    const copy = [...list]
    copy.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortKey) {
        case 'rating':
          return (a.rating - b.rating) * dir
        case 'gamesPlayed':
          return (
            (a.gamesPlayed - b.gamesPlayed) * dir
          )
        case 'bestScore':
          return (a.bestScore - b.bestScore) * dir
        case 'nickname':
          return (
            a.nickname.localeCompare(b.nickname) *
            dir
          )
        default:
          return 0
      }
    })
    return copy
  }, [
    sortKey,
    sortDir,
    showFriendsOnly,
    friendNicknames,
  ])

  const handleSort = (key: SortKey) => {
    setSortKey(prevKey => {
      if (prevKey === key) {
        setSortDir(prevDir =>
          prevDir === 'asc' ? 'desc' : 'asc'
        )
        return prevKey
      }
      setSortDir('desc')
      return key
    })
  }

  const sortLabel = (
    key: SortKey,
    label: string
  ) => {
    const isActive = sortKey === key
    const arrow = !isActive
      ? ''
      : sortDir === 'asc'
      ? '↑'
      : '↓'
    return (
      <button
        type="button"
        className={clsx('leaderboard-sort-btn', {
          'leaderboard-sort-btn--active':
            isActive,
        })}
        onClick={() => handleSort(key)}>
        {label} {arrow}
      </button>
    )
  }

  return (
    <div className={clsx('landing', 'AuthPage')}>
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
            Демо-лидерборд. В будущем данные будут
            через API для всех и для фильтра
            друзей.
          </p>

          <div className="leaderboard-toolbar">
            <div className="leaderboard-toolbar__left">
              <Button
                type="button"
                variant={
                  showFriendsOnly
                    ? 'primary'
                    : 'outline'
                }
                onClick={() =>
                  setShowFriendsOnly(v => !v)
                }>
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
                  className={clsx(
                    'leaderboard-view-toggle__btn',
                    {
                      'is-active':
                        viewMode === 'table',
                    }
                  )}
                  onClick={() =>
                    setViewMode('table')
                  }>
                  Таблица
                </button>
                <button
                  type="button"
                  className={clsx(
                    'leaderboard-view-toggle__btn',
                    {
                      'is-active':
                        viewMode === 'grid',
                    }
                  )}
                  onClick={() =>
                    setViewMode('grid')
                  }>
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
                    <th>#</th>
                    <th>Игрок</th>
                    <th>
                      {sortLabel(
                        'rating',
                        'Рейтинг'
                      )}
                    </th>
                    <th>
                      {sortLabel(
                        'gamesPlayed',
                        'Сыграно игр'
                      )}
                    </th>
                    <th>
                      {sortLabel(
                        'bestScore',
                        'Рекорд'
                      )}
                    </th>
                    <th>Дата рекорда</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map(
                    (entry, index) => (
                      <tr key={entry.id}>
                        <td>{index + 1}</td>
                        <td>
                          <span className="leaderboard-player">
                            <span className="leaderboard-avatar">
                              {entry.avatarEmoji}
                            </span>
                            <span>
                              {entry.nickname}
                            </span>
                          </span>
                        </td>
                        <td>
                          {entry.rating.toLocaleString(
                            'ru-RU'
                          )}
                        </td>
                        <td>
                          {entry.gamesPlayed}
                        </td>
                        <td>
                          {entry.bestScore.toLocaleString(
                            'ru-RU'
                          )}
                        </td>
                        <td>
                          {new Date(
                            entry.bestScoreDate
                          ).toLocaleDateString(
                            'ru-RU'
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="extra-card leaderboard-card">
              <h3>Лучшие игроки</h3>
              <div className="leaderboard-grid">
                {sortedEntries.map(
                  (entry, index) => (
                    <div
                      className="leaderboard-grid-item"
                      key={entry.id}>
                      <div className="leaderboard-grid-rank">
                        {index + 1}
                      </div>
                      <div className="leaderboard-grid-main">
                        <div className="leaderboard-avatar-large">
                          {entry.avatarEmoji}
                        </div>
                        <div className="leaderboard-grid-text">
                          <div className="leaderboard-grid-nickname">
                            {entry.nickname}
                          </div>
                          <div className="leaderboard-grid-rating">
                            Рейтинг:{' '}
                            {entry.rating.toLocaleString(
                              'ru-RU'
                            )}
                          </div>
                          <div className="leaderboard-grid-meta">
                            Игр:{' '}
                            {entry.gamesPlayed} •
                            Рекорд:{' '}
                            {entry.bestScore.toLocaleString(
                              'ru-RU'
                            )}{' '}
                            от{' '}
                            {new Date(
                              entry.bestScoreDate
                            ).toLocaleDateString(
                              'ru-RU'
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className="extra-card">
            <h3>Ваши друзья</h3>
            {user ? (
              <p>
                Вы вошли как {user.first_name}{' '}
                {user.second_name}
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
                    {friend.name}{' '}
                    {friend.secondName}
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

// export const initLeaderboardPage = ({ dispatch, state }: PageInitArgs) => {
//   const queue: Array<Promise<unknown>> = [dispatch(fetchFriendsThunk())]
//   if (!selectUser(state)) {
//     queue.push(dispatch(fetchUserThunk()))
//   }
//   return Promise.all(queue)
// }

export const initLeaderboardPage = () =>
  Promise.resolve()
