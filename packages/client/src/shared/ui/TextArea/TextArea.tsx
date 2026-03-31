// Переиспользуемое текстовое поле
import React from 'react'
import clsx from 'clsx'

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  fullWidth?: boolean
}

export const TextArea: React.FC<TextAreaProps> = ({
  className,
  fullWidth,
  ...rest
}) => {
  return (
    <textarea className={clsx(className, fullWidth && 'w-full')} {...rest} />
  )
}

export default TextArea
