'use client'

import { useState, useRef, useEffect } from 'react'

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Seleccionar...',
  disabled = false,
  required = false,
  name,
  className = '',
  searchPlaceholder = 'Buscar...',
  noResultsText = 'No se encontraron resultados',
  renderOption,
  getOptionLabel,
  getOptionValue,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Default functions for getting label and value
  const defaultGetLabel = (option) => {
    if (typeof option === 'string') return option
    return option.label || option.name || ''
  }

  const defaultGetValue = (option) => {
    if (typeof option === 'string') return option
    return option.value || option.id || ''
  }

  const getLabel = getOptionLabel || defaultGetLabel
  const getValue = getOptionValue || defaultGetValue

  // Find selected option
  const selectedOption = options.find(opt => getValue(opt) === value)

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    const label = getLabel(option)
    return label.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (option) => {
    const newValue = getValue(option)
    onChange({
      target: {
        name,
        value: newValue,
      }
    })
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange({
      target: {
        name,
        value: '',
      }
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm('')
    }
    if (e.key === 'Enter' && filteredOptions.length === 1) {
      e.preventDefault()
      handleSelect(filteredOptions[0])
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          value={value || ''}
          required={required}
          className="sr-only"
          tabIndex={-1}
          onChange={() => {}}
        />
      )}

      {/* Select button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black text-left flex items-center justify-between ${
          disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? getLabel(selectedOption) : placeholder}
        </span>
        <div className="flex items-center space-x-1">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 focus:outline-none focus:border-black text-sm"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const optionValue = getValue(option)
                const isSelected = optionValue === value

                return (
                  <button
                    key={optionValue || index}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between ${
                      isSelected ? 'bg-gray-50 font-medium' : ''
                    }`}
                  >
                    <span>
                      {renderOption ? renderOption(option) : getLabel(option)}
                    </span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )
              })
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                {noResultsText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
