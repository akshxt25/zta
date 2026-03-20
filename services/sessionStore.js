import redis from "../config/redis.js"

export const storeRefreshToken = async (userId, token) => {
  await redis.set(`refresh:${token}`, userId, "EX", 7 * 24 * 60 * 60)
  await redis.sadd(`user_tokens:${userId}`, token)
}

export const verifyRefreshToken = async (token) => {
  return await redis.get(`refresh:${token}`)
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