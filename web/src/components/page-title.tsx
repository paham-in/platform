import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"

const PageTitleContext = createContext<{ title: string | null; setTitle: (title: string | null) => void }>({
  title: null,
  setTitle: () => {},
})

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null)
  return <PageTitleContext.Provider value={{ title, setTitle }}>{children}</PageTitleContext.Provider>
}

export function usePageTitle(title?: string | null) {
  const { setTitle } = useContext(PageTitleContext)
  useEffect(() => {
    setTitle(title ?? null)
    return () => setTitle(null)
  }, [title, setTitle])
}

export function usePageTitleValue(): string | null {
  return useContext(PageTitleContext).title
}
