import redis from "../config/redis.js"

const REFRESH_TTL_SEC = 7 * 24 * 60 * 60

export const storeRefreshToken = async (userId, token) => {
  await redis.set(`refresh:${token}`, userId, "EX", REFRESH_TTL_SEC)
  await redis.sadd(`user_tokens:${userId}`, token)
}

export const verifyRefreshToken = async (token) => {
  return await redis.get(`refresh:${token}`)
}

export const refreshTokenBelongsToUser = async (token, expectedUserId) => {
  const userId = await redis.get(`refresh:${token}`)
  if (!userId) return false
  return String(userId) === String(expectedUserId)
}

export const deleteRefreshToken = async (token) => {
  const userId = await redis.get(`refresh:${token}`)

  if (userId) {
    await redis.srem(`user_tokens:${userId}`, token)
  }

  await redis.del(`refresh:${token}`)
}

export const deleteAllUserSessions = async (userId) => {
  const tokens = await redis.smembers(`user_tokens:${userId}`)

  for (const token of tokens) {
    await redis.del(`refresh:${token}`)
  }

  await redis.del(`user_tokens:${userId}`)
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// Logs out every user by deleting all refresh tokens in Redis.
// Access tokens will still expire by themselves, but we also force WS logout.
export const deleteAllSessionsForAllUsers = async () => {
  const refreshKeys = []

  for await (const userTokensKey of redis.scanIterator({
    match: "user_tokens:*",
    count: 200
  })) {
    const tokens = await redis.smembers(userTokensKey)
    if (tokens?.length) {
      for (const setToken of tokens) {
        refreshKeys.push(`refresh:${setToken}`)
      }
    }
    await redis.del(userTokensKey)
  }

  if (refreshKeys.length === 0) return

  const chunks = chunk(refreshKeys, 500)
  for (const c of chunks) {
    await redis.del(...c)
  }
}
