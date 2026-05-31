import { getServerHost } from '../../constants'

export type FriendRecord = {
  nickname: string
  displayName: string
  avatar: string | null
}

export type AddFriendPayload = {
  nickname: string
  displayName?: string
  avatar?: string | null
  friendPraktikumId?: number
}

function friendsBaseUrl(): string {
  return `${getServerHost()}/friends`
}

async function readErrorReason(res: Response): Promise<string> {
  const text = await res.text()
  try {
    const json = JSON.parse(text) as { reason?: string }
    if (typeof json.reason === 'string') {
      return json.reason
    }
  } catch {
    /* not json */
  }
  return text || res.statusText
}

export async function fetchFriends(): Promise<FriendRecord[]> {
  const res = await fetch(friendsBaseUrl(), { credentials: 'include' })
  if (!res.ok) {
    throw new Error(await readErrorReason(res))
  }
  const payload: unknown = await res.json()
  if (!Array.isArray(payload)) {
    throw new Error('Invalid friends response')
  }
  return payload as FriendRecord[]
}

export async function addFriend(
  payload: AddFriendPayload
): Promise<FriendRecord> {
  const res = await fetch(friendsBaseUrl(), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new Error(await readErrorReason(res))
  }
  return (await res.json()) as FriendRecord
}

export async function removeFriend(nickname: string): Promise<void> {
  const res = await fetch(
    `${friendsBaseUrl()}/${encodeURIComponent(nickname)}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  )
  if (res.status === 204) {
    return
  }
  if (!res.ok) {
    throw new Error(await readErrorReason(res))
  }
}
