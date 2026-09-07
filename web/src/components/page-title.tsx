import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"

const PageTitleContext = createContext<{
  mobileAction: ReactNode | null
  setMobileAction: (node: ReactNode | null) => void
}>({
  mobileAction: null,
  setMobileAction: () => {},
})

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [mobileAction, setMobileAction] = useState<ReactNode | null>(null)
  return (
    <PageTitleContext.Provider value={{ mobileAction, setMobileAction }}>
      {children}
    </PageTitleContext.Provider>
  )
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
