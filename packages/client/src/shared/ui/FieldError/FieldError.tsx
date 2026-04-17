// Общий компонент ошибки поля
import React from 'react'
import clsx from 'clsx'

interface FieldErrorProps {
  message?: string
  className?: string
}

export const FieldError: React.FC<
  FieldErrorProps
> = ({ message, className }) => {
  if (!message) return null

  return (
    <span
      className={clsx(className)}
      style={{
        color: '#ef4444',
        fontSize: 12,
        marginTop: 2,
      }}>
      {message}
    </span>
  )
}

export default FieldError
