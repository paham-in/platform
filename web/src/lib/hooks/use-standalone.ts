import { useEffect, useState } from "react"

function queryStandalone() {
  if (typeof window === "undefined") return false
  if (window.matchMedia("(display-mode: standalone)").matches) return true
  // iOS Safari: tidak ada display-mode, pakai navigator.standalone.
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}

// useIsStandalone: true bila aplikasi jalan sebagai PWA terpasang
// (standalone), bukan di tab browser biasa. Di mode ini tidak ada
// tombol Back browser sehingga navigasi mundur harus disediakan in-app.
export function useIsStandalone() {
  const [standalone, setStandalone] = useState(queryStandalone)

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)")
    const onChange = () => setStandalone(queryStandalone())
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  return standalone
}
