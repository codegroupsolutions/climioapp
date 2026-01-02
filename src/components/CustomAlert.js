'use client'

import { useState, useEffect } from 'react'
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa'

export default function CustomAlert({ type = 'info', message, onClose, duration = 5000, index = 0 }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10)

    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setIsVisible(false)
    setTimeout(() => {
      if (onClose) onClose()
    }, 300)
  }

  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-white',
          borderColor: 'border-green-500',
          textColor: 'text-gray-900',
          iconColor: 'text-green-600',
          icon: FaCheckCircle
        }
      case 'error':
        return {
          bgColor: 'bg-white',
          borderColor: 'border-red-500',
          textColor: 'text-gray-900',
          iconColor: 'text-red-600',
          icon: FaExclamationCircle
        }
      case 'info':
      default:
        return {
          bgColor: 'bg-white',
          borderColor: 'border-blue-500',
          textColor: 'text-gray-900',
          iconColor: 'text-blue-600',
          icon: FaInfoCircle
        }
    }
  }

  const styles = getAlertStyles()
  const Icon = styles.icon

  return (
    <div
      className={`
        fixed right-4 z-50
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      style={{ top: `${1 + index * 4.5}rem` }}
    >
      <div className={`
        min-w-[300px] max-w-md ${styles.bgColor} border-l-4 ${styles.borderColor}
        p-4 rounded-lg shadow-lg
      `}>
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${styles.iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${styles.textColor}`}>
              {message}
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors`}
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook para usar el sistema de toasts
export function useAlert() {
  const [toasts, setToasts] = useState([])

  const showAlert = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, type, duration }
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const AlertComponent = () => {
    if (toasts.length === 0) return null

    return (
      <>
        {toasts.map((toast, index) => (
          <CustomAlert
            key={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            index={index}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </>
    )
  }

  return { showAlert, AlertComponent }
}