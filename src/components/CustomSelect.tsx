import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
  color?: string // Optional color for status indicators
}

interface CustomSelectProps {
  id?: string
  name: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  showStatusDot?: boolean // Show colored dot indicator
}

// Status color mapping
const STATUS_COLORS: Record<string, string> = {
  available: '#22c55e',      // Green
  borrowed: '#f97316',       // Orange
  in_maintenance: '#ef4444', // Red
  lost: '#6b7280',           // Gray
  damaged: '#dc2626',        // Dark Red
}

export default function CustomSelect({
  id,
  name,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  showStatusDot = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div 
      ref={containerRef} 
      className={`custom-select ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
    >
      <button
        type="button"
        id={id}
        className="custom-select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <span className={`custom-select-value ${!selectedOption ? 'placeholder' : ''}`}>
          {showStatusDot && selectedOption && (
            <span 
              className="status-dot" 
              style={{ backgroundColor: selectedOption.color || STATUS_COLORS[selectedOption.value] || '#6b7280' }}
            />
          )}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`custom-select-arrow ${isOpen ? 'rotated' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="custom-select-dropdown" role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`custom-select-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
              role="option"
              aria-selected={option.value === value}
            >
              <span className="custom-select-option-content">
                {showStatusDot && (
                  <span 
                    className="status-dot" 
                    style={{ backgroundColor: option.color || STATUS_COLORS[option.value] || '#6b7280' }}
                  />
                )}
                <span>{option.label}</span>
              </span>
              {option.value === value && <Check size={14} className="check-icon" />}
            </button>
          ))}
        </div>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={value} />
    </div>
  )
}

