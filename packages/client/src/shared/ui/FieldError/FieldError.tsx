// Общий компонент ошибки поля
import React from 'react'
import clsx from 'clsx'

interface FieldErrorProps {
  message?: string
  className?: string
}

export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) return null

  return <span className={clsx('field-error', className)}>{message}</span>
}

export default FieldError
