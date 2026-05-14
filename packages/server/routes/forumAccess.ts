/**
 * Модераторы форума: id юзеров из env (через запятую / пробел).
 * Если пусто, то только автор может править/удалять свои сущности.
 */
export function getForumModeratorPraktikumIds(): Set<number> {
  const raw =
    process.env.FORUM_MODERATOR_PRAKTIKUM_IDS?.trim()
  if (!raw) {
    return new Set()
  }
  const out = new Set<number>()
  for (const part of raw.split(/[\s,]+/)) {
    if (part === '') {
      continue
    }
    const n = Number(part)
    if (Number.isFinite(n)) {
      out.add(Math.floor(n))
    }
  }
  return out
}

export function isForumModeratorUser(
  userId: number
): boolean {
  return getForumModeratorPraktikumIds().has(
    userId
  )
}

export function canForumAuthorOrModerator(
  actorPraktikumId: number,
  resourceAuthorPraktikumId: number
): boolean {
  return (
    actorPraktikumId ===
      resourceAuthorPraktikumId ||
    isForumModeratorUser(actorPraktikumId)
  )
}
