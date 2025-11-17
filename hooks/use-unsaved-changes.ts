"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from 'next/navigation'

export function useUnsavedChanges(isDirty: boolean) {
  const router = useRouter()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const isNavigatingRef = useRef(false)

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isNavigatingRef.current) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isDirty])

  const confirmNavigation = () => {
    isNavigatingRef.current = true
    setShowConfirmDialog(false)
    if (pendingNavigation) {
      router.push(pendingNavigation)
    } else {
      router.back()
    }
  }

  const cancelNavigation = () => {
    setShowConfirmDialog(false)
    setPendingNavigation(null)
  }

  const handleNavigation = (path?: string) => {
    if (isDirty) {
      setPendingNavigation(path || null)
      setShowConfirmDialog(true)
      return false
    }
    if (path) {
      router.push(path)
    } else {
      router.back()
    }
    return true
  }

  return {
    showConfirmDialog,
    confirmNavigation,
    cancelNavigation,
    handleNavigation,
  }
}
