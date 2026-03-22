import redis from "../config/redis.js"

const REFRESH_TTL_SEC = 7 * 24 * 60 * 60

export const storeRefreshToken = async (userId, token) => {
  await redis.set(`refresh:${token}`, userId, "EX", REFRESH_TTL_SEC)
  await redis.sadd(`user_tokens:${userId}`, token)
}

export const verifyRefreshToken = async (token) => {
  return await redis.get(`refresh:${token}`)
}

/** Ensures the refresh token exists and belongs to the given user (logout safety). */
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
