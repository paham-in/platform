import { useCallback, useEffect, useRef, useState } from "react"

interface DraftData {
  title: string
  content: string
  classId: string
  subjectId: string
  chapterId: string
}

const STORAGE_PREFIX = "draft:material"

function getKey(id?: string) {
  return id ? `${STORAGE_PREFIX}:edit:${id}` : `${STORAGE_PREFIX}:new`
}

function loadDraft(key: string): DraftData | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveDraft(key: string, data: DraftData) {
  localStorage.setItem(key, JSON.stringify(data))
}

function removeDraft(key: string) {
  localStorage.removeItem(key)
}

export function useDraft(id?: string) {
  const key = getKey(id)
  const draftOnMount = loadDraft(key)
  const [hasDraft, setHasDraft] = useState(!!draftOnMount)
  const [restored, setRestored] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const debouncedSave = useCallback(
    (data: DraftData) => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        saveDraft(key, data)
        setHasDraft(true)
      }, 800)
    },
    [key]
  )

  const clear = useCallback(() => {
    removeDraft(key)
    setHasDraft(false)
  }, [key])

  const restore = useCallback(() => {
    setRestored(true)
  }, [])

  const discard = useCallback(() => {
    removeDraft(key)
    setHasDraft(false)
    setRestored(false)
  }, [key])

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  return {
    draft: draftOnMount,
    hasDraft,
    restored,
    debouncedSave,
    clear,
    restore,
    discard,
  }
}
