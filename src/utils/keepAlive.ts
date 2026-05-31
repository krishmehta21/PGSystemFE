const BACKEND_URL = import.meta.env.VITE_API_BASE_URL
const INTERVAL_MS = 4 * 60 * 1000 // every 4 minutes

export function startKeepAlive() {
  const ping = async () => {
    if (document.visibilityState !== 'visible') return
    try {
      await fetch(`${BACKEND_URL}/ping`, { method: 'GET' })
    } catch {
      // silently ignore — this is a background ping
    }
  }

  ping() // ping immediately on start
  return setInterval(ping, INTERVAL_MS)
}

export function stopKeepAlive(intervalId: ReturnType<typeof setInterval>) {
  clearInterval(intervalId)
}
