import { useEffect, type ReactNode } from "react"
import { useRouter, useRouterState } from "@tanstack/react-router"

let pathStack: string[] = []
let currentDirection: "forward" | "back" | null = null

export function RouteTransition({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    return router.subscribe("onBeforeNavigate", ({ toLocation, pathChanged }) => {
      if (!pathChanged) return
      const to = toLocation.pathname
      if (pathStack.length === 0) {
        pathStack = [to]
        currentDirection = null
        return
      }
      const backIndex = pathStack.lastIndexOf(to)
      if (backIndex >= 0) {
        pathStack = pathStack.slice(0, backIndex + 1)
        currentDirection = "back"
      } else {
        pathStack = [...pathStack, to]
        currentDirection = "forward"
      }
    })
  }, [router])

  const dirClass = currentDirection ? ` route-transition-${currentDirection}` : ""
  return (
    <div key={pathname} className={`flex flex-1 flex-col${dirClass}`}>
      {children}
    </div>
  )
}