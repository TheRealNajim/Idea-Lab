import { useEffect, useState } from 'react'

// `revive` lets callers repair values that were persisted by an older version of
// the app (shape drift). Without it, a stored object missing a key that current
// code dereferences will crash the render.
export function useLocalStorage(key, initialValue, revive) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      const parsed = saved === null ? initialValue : JSON.parse(saved)
      return revive ? revive(parsed) : parsed
    } catch {
      return revive ? revive(initialValue) : initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage can be unavailable (private browsing) or full. The app stays
      // usable for the current session instead of breaking on every update.
    }
  }, [key, value])

  return [value, setValue]
}
