import { apiClient } from './apiClient'

export interface Topic {
  id: number
  title: string
  content: string
  authorId: number
  authorName: string
  createdAt: string
  updatedAt: string
  commentCount: number
}

export interface Comment {
  id: number
  topicId: number
  content: string
  authorId: number
  authorName: string
  createdAt: string
  updatedAt: string
}

export interface CreateTopicData {
  title: string
  content: string
}

export interface CreateCommentData {
  topicId: number
  content: string
}

export const forumApi = {
  getTopics: () =>
    apiClient.get<Topic[]>('/forum/topics'),

  getTopic: (topicId: number) =>
    apiClient.get<{
      topic: Topic
      comments: Comment[]
    }>(`/forum/topics/${topicId}`),

  createTopic: (data: CreateTopicData) =>
    apiClient.post<Topic>('/forum/topics', data),

  createComment: (data: CreateCommentData) =>
    apiClient.post<Comment>(
      '/forum/comments',
      data
    ),

  deleteTopic: (topicId: number) =>
    apiClient.delete(`/forum/topics/${topicId}`),

  deleteComment: (commentId: number) =>
    apiClient.delete(
      `/forum/comments/${commentId}`
    ),
}
