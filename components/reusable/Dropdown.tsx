"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "left" | "right"
  width?: string
  className?: string
}

export const DropdownItem: React.FC<{
  onClick: () => void
  children: React.ReactNode
}> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="w-full text-left px-4 py-2 text-sm text-brand-dark dark:text-dark-heading hover:bg-gray-100 dark:hover:bg-dark-border"
  >
    {children}
  </button>
)

const Dropdown: React.FC<DropdownProps> = ({ trigger, children, align = "left", width = "w-48", className }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute z-50 mt-2 ${width} bg-white dark:bg-dark-surface border border-brand-border dark:border-dark-border rounded-lg shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export default Dropdown
