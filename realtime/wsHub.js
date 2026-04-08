// In-memory websocket hub (demo/prototype).
// Maps authenticated users/admins to active websocket connections.
const socketsByUserId = new Map() // userId -> Set<WebSocket>
const socketsByAdmin = new Set() // Set<WebSocket>

export function addSocketForUser({ userId, role, ws }) {
  if (!userId) return

  const set = socketsByUserId.get(userId) || new Set()
  set.add(ws)
  socketsByUserId.set(userId, set)

  if (role === "admin") socketsByAdmin.add(ws)
}

export function removeSocket(ws) {
  // Remove from user maps
  for (const [, set] of socketsByUserId) {
    if (set.has(ws)) {
      set.delete(ws)
    }
  }

  // Remove empty user sets
  for (const [userId, set] of socketsByUserId) {
    if (set.size === 0) socketsByUserId.delete(userId)
  }

  socketsByAdmin.delete(ws)
}

export function broadcastToUser(userId, message) {
  const set = socketsByUserId.get(userId)
  if (!set || set.size === 0) return

  const payload = JSON.stringify(message)
  for (const ws of set) {
    try {
      ws.send(payload)
    } catch {
      // Ignore send failures; connection cleanup happens via close handler.
    }
  }
}

export function broadcastToAdmins(message) {
  const payload = JSON.stringify(message)
  for (const ws of socketsByAdmin) {
    try {
      ws.send(payload)
    } catch {
      // Ignore send failures
    }
  }
}

export function broadcastToAll(message) {
  const payload = JSON.stringify(message)
  const sent = new Set()

  for (const set of socketsByUserId.values()) {
    for (const ws of set) {
      if (sent.has(ws)) continue
      sent.add(ws)
      try {
        ws.send(payload)
      } catch {
        // Ignore send failures
      }
    }
  }
}

