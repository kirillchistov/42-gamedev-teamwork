export interface ForumTopic {
  id: number
  title: string
  author: string
  createdAt: string
  content: string
  commentsCount: number
}

export interface ForumComment {
  id: number
  topicId: number
  author: string
  content: string
  createdAt: string
  parentCommentId: number | null
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
