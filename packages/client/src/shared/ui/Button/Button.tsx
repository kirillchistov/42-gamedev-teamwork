// Переиспользуемая кнопка
import React from 'react'
import clsx from 'clsx'

type ButtonVariant = 'primary' | 'outline' | 'flat'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  as?: 'button'
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className,
  children,
  ...rest
}) => {
  return (
    <button
      className={clsx(
        'btn',
        {
          'btn--primary': variant === 'primary',
          'btn--outline': variant === 'outline',
          'btn--flat': variant === 'flat',
        },
        className
      )}
      {...rest}>
      {children}
    </button>
  )
}

export default Button
