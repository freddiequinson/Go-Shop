import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Filter } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FilterOption {
  label: string
  value: string
}

interface SearchFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  placeholder?: string
  filters?: {
    label: string
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
  }[]
  onClear?: () => void
  showFilterButton?: boolean
  onFilterClick?: () => void
}

export function SearchFilter({
  searchValue,
  onSearchChange,
  placeholder = "Search...",
  filters = [],
  onClear,
  showFilterButton = false,
  onFilterClick
}: SearchFilterProps) {
  const hasActiveFilters = searchValue || filters.some(f => f.value)

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Selects */}
      {filters.map((filter, index) => (
        <Select key={index} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All {filter.label}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {/* Filter Button */}
      {showFilterButton && (
        <Button
          variant="outline"
          onClick={onFilterClick}
          className="whitespace-nowrap"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      )}

      {/* Clear All Button */}
      {hasActiveFilters && onClear && (
        <Button
          variant="ghost"
          onClick={onClear}
          className="whitespace-nowrap text-gray-600"
        >
          <X className="w-4 h-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  )
}
