// Переиспользуемое текстовое поле
import React from 'react'
import clsx from 'clsx'

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  fullWidth?: boolean
}

export function TextArea({ className, fullWidth, ...rest }: TextAreaProps) {
  return (
    <textarea className={clsx(className, fullWidth && 'w-full')} {...rest} />
  )
}

export default TextArea
