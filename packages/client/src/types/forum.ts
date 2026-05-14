export interface ForumTopic {
  id: number
  title: string
  author: string
  /** Id Практикума автора — для прав на клиенте (сервер всё равно проверяет). */
  authorPraktikumId: number
  createdAt: string
  content: string
  commentsCount: number
  /** Текущая сессия в списке модераторов форума (env FORUM_MODERATOR_PRAKTIKUM_IDS). */
  viewerIsModerator: boolean
}

export interface ForumComment {
  id: number
  topicId: number
  author: string
  authorPraktikumId: number
  content: string
  createdAt: string
  parentCommentId: number | null
}

export interface ForumReactionAgg {
  emoji: string
  count: number
  mine: boolean
}

/** Тело POST /api/forum/topics — автора задаёт только сервер. */
export interface CreateTopicPayload {
  title: string
  content: string
}

export interface CreateCommentPayload {
  topicId: number
  content: string
  parentCommentId?: number | null
}
