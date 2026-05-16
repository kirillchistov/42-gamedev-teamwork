import { SERVER_HOST } from '../../constants'
import type {
  ForumComment,
  ForumReactionAgg,
  ForumTopic,
} from '../../types/forum'

export class ForumApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ForumApiError'
    this.status = status
  }
}

function forumUrl(path: string): string {
  const base = SERVER_HOST.replace(/\/+$/, '')
  const p = path.startsWith('/')
    ? path
    : `/${path}`
  return `${base}${p}`
}

export async function forumRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const hasJsonBody =
    typeof init?.body === 'string' &&
    init.body.length > 0

  const headers: HeadersInit = {
    ...(init?.headers ?? {}),
    ...(hasJsonBody
      ? { 'Content-Type': 'application/json' }
      : {}),
  }

  const res = await fetch(forumUrl(path), {
    ...init,
    credentials: 'include',
    headers,
  })

  if (res.status === 204) {
    return undefined as T
  }

  const text = await res.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text) as unknown
    } catch {
      body = null
    }
  }

  if (!res.ok) {
    const reason =
      body &&
      typeof body === 'object' &&
      body !== null &&
      'reason' in body &&
      typeof (body as { reason: unknown })
        .reason === 'string'
        ? (body as { reason: string }).reason
        : res.statusText || 'Ошибка запроса'
    throw new ForumApiError(reason, res.status)
  }

  return body as T
}

export async function forumGetTopics(): Promise<
  ForumTopic[]
> {
  return forumRequest<ForumTopic[]>(
    '/api/forum/topics'
  )
}

export async function forumGetTopic(
  topicId: number
): Promise<ForumTopic> {
  return forumRequest<ForumTopic>(
    `/api/forum/topics/${topicId}`
  )
}

export type ForumCommentsPage = {
  items: ForumComment[]
  total: number
  limit: number
  offset: number
}

export async function forumGetAllComments(
  topicId: number
): Promise<ForumComment[]> {
  const limit = 100
  const all: ForumComment[] = []
  let offset = 0
  for (;;) {
    const page =
      await forumRequest<ForumCommentsPage>(
        `/api/forum/topics/${topicId}/comments?limit=${limit}&offset=${offset}`
      )
    all.push(...page.items)
    if (
      page.items.length < limit ||
      all.length >= page.total
    ) {
      break
    }
    offset += limit
  }
  return all
}

export async function forumCreateTopic(body: {
  title: string
  content: string
}): Promise<ForumTopic> {
  return forumRequest<ForumTopic>(
    '/api/forum/topics',
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  )
}

export async function forumCreateComment(
  topicId: number,
  body: {
    content: string
    parentCommentId: number | null
  }
): Promise<ForumComment> {
  return forumRequest<ForumComment>(
    `/api/forum/topics/${topicId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  )
}

export type ForumReactionsResponse = {
  items: ForumReactionAgg[]
}

export async function forumGetCommentReactions(
  topicId: number,
  commentId: number
): Promise<ForumReactionsResponse> {
  return forumRequest<ForumReactionsResponse>(
    `/api/forum/topics/${topicId}/comments/${commentId}/reactions`
  )
}

export async function forumFetchReactionsMap(
  topicId: number,
  comments: ForumComment[]
): Promise<Record<number, ForumReactionAgg[]>> {
  const map: Record<number, ForumReactionAgg[]> =
    {}
  await Promise.all(
    comments.map(async c => {
      try {
        const r = await forumGetCommentReactions(
          topicId,
          c.id
        )
        map[c.id] = r.items
      } catch {
        map[c.id] = []
      }
    })
  )
  return map
}

export async function forumPostCommentReaction(
  commentId: number,
  emoji: string
): Promise<unknown> {
  return forumRequest(
    `/api/forum/comments/${commentId}/reactions`,
    {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }
  )
}

export async function forumDeleteCommentReaction(
  commentId: number,
  emoji: string
): Promise<void> {
  const enc = encodeURIComponent(emoji)
  return forumRequest<void>(
    `/api/forum/comments/${commentId}/reactions/${enc}`,
    { method: 'DELETE' }
  )
}

export async function forumPatchTopic(
  topicId: number,
  body: { title?: string; content?: string }
): Promise<ForumTopic> {
  return forumRequest<ForumTopic>(
    `/api/forum/topics/${topicId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    }
  )
}

export async function forumDeleteTopic(
  topicId: number
): Promise<void> {
  return forumRequest<void>(
    `/api/forum/topics/${topicId}`,
    { method: 'DELETE' }
  )
}

export async function forumPatchComment(
  commentId: number,
  body: { content: string }
): Promise<ForumComment> {
  return forumRequest<ForumComment>(
    `/api/forum/comments/${commentId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    }
  )
}

export async function forumDeleteComment(
  commentId: number
): Promise<void> {
  return forumRequest<void>(
    `/api/forum/comments/${commentId}`,
    { method: 'DELETE' }
  )
}
