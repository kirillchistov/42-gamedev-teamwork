// Переиспользуемое поле текстового ввода
import React from 'react'
import clsx from 'clsx'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  fullWidth?: boolean
}

export function Input({ className, fullWidth, ...rest }: InputProps) {
  return (
    <input
      className={clsx(
        className,
        // см. auth.pcss (.auth-form input), landing.pcss / contact (.contact-form input)
        fullWidth && 'w-full'
      )}
      {...rest}
    />
  )
}

export default Input
