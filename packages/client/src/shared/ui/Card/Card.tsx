// Переиспользуемая карточка
import React from 'react'
import clsx from 'clsx'

type CardVariant = 'default' | 'extra'

type CardProps =
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: CardVariant
  }

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  className,
  children,
  ...rest
}) => {
  return (
    <div
      className={clsx(
        variant === 'default' && 'auth-card',
        variant === 'extra' && 'extra-card',
        className
      )}
      {...rest}>
      {children}
    </div>
  )
}

export default Card
