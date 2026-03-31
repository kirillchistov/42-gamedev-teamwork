// Переиспользуемое поле текстового ввода
import React from 'react'
import clsx from 'clsx'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  fullWidth?: boolean
}

export const Input: React.FC<InputProps> = ({
  className,
  fullWidth,
  ...rest
}) => {
  return (
    <input
      className={clsx(
        className,
        // в landing.pcss селекторы .auth-form input, .contact-form input и т.п.
        fullWidth && 'w-full'
      )}
      {...rest}
    />
  )
}

export default Input
