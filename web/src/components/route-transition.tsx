import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react"
import { useRouter, useRouterState } from "@tanstack/react-router"

let pathStack: string[] = []
let currentDirection: "forward" | "back" | null = null
let resetInProgress = false
const resetListeners = new Set<() => void>()

export function getNavStack(): string[] {
  return pathStack
}

export function resetNavStack() {
  pathStack = []
  currentDirection = null
}

export function setResetInProgress(v: boolean) {
  if (resetInProgress === v) return
  resetInProgress = v
  resetListeners.forEach((l) => l())
}

export function RouteTransition({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const seeded = useRef(false)
  const resetting = useSyncExternalStore(
    (cb) => {
      resetListeners.add(cb)
      return () => resetListeners.delete(cb)
    },
    () => resetInProgress
  )

  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true
      pathStack = [pathname]
      currentDirection = null
    }
    return router.subscribe("onBeforeNavigate", ({ toLocation, pathChanged }) => {
      if (!pathChanged) return
      const to = toLocation.pathname
      const backIndex = pathStack.lastIndexOf(to)
      if (backIndex >= 0) {
        pathStack = pathStack.slice(0, backIndex + 1)
        currentDirection = "back"
      } else {
        pathStack = [...pathStack, to]
        currentDirection = "forward"
      }
    })
  }, [router, pathname])

  if (resetting) {
    return <div className="flex flex-1 flex-col" />
  }

  const dirClass = currentDirection ? ` route-transition-${currentDirection}` : ""
  return (
    <div key={pathname} className={`flex flex-1 flex-col${dirClass}`}>
      {children}
    </div>
  )
}