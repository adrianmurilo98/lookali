"use client"

import type React from "react"

interface CategoryTabsProps {
  categories: string[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
  disabled?: boolean
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, selectedCategory, onSelectCategory, disabled }) => {
  return (
    <div className="flex gap-2 border-b border-brand-border dark:border-dark-border">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => !disabled && onSelectCategory(category)}
          disabled={disabled}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            selectedCategory === category
              ? "text-brand-dark dark:text-dark-heading border-b-2 border-brand-dark dark:border-brand-green"
              : "text-brand-inactive-text dark:text-dark-body hover:text-brand-dark dark:hover:text-dark-heading"
          } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          {category}
        </button>
      ))}
    </div>
  )
}

export default CategoryTabs
