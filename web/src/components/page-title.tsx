import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"

const PageTitleContext = createContext<{
  title: string | null
  setTitle: (title: string | null) => void
  mobileAction: ReactNode | null
  setMobileAction: (node: ReactNode | null) => void
}>({
  title: null,
  setTitle: () => {},
  mobileAction: null,
  setMobileAction: () => {},
})

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null)
  const [mobileAction, setMobileAction] = useState<ReactNode | null>(null)
  return (
    <PageTitleContext.Provider value={{ title, setTitle, mobileAction, setMobileAction }}>
      {children}
    </PageTitleContext.Provider>
  )
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

export function usePageHeaderAction(node: ReactNode | null) {
  const { setMobileAction } = useContext(PageTitleContext)
  useEffect(() => {
    setMobileAction(node)
    return () => setMobileAction(null)
  }, [node, setMobileAction])
}

export function usePageHeaderActionValue(): ReactNode | null {
  return useContext(PageTitleContext).mobileAction
}
