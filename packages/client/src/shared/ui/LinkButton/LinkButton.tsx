// Переиспользуемая кнопка-ссылка
import React from 'react'
import { Link, LinkProps } from 'react-router-dom'
import clsx from 'clsx'

type ButtonVariant = 'primary' | 'outline' | 'flat'

type LinkButtonProps = Omit<LinkProps, 'to'> & {
  to: LinkProps['to']
  variant?: ButtonVariant
}

export const LinkButton: React.FC<LinkButtonProps> = ({
  to,
  variant = 'primary',
  className,
  children,
  ...rest
}) => {
  return (
    <Link
      to={to}
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
    </Link>
  )
}

export default LinkButton
