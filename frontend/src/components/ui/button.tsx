import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "relative overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  ripple?: boolean
}

function Button({ className, variant, size, ripple = true, onPointerDown, ...props }: ButtonProps) {
  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (ripple && !props.disabled) {
      const button = event.currentTarget
      const rect = button.getBoundingClientRect()
      const diameter = Math.max(rect.width, rect.height)
      const span = document.createElement('span')
      span.className =
        'animate-ripple pointer-events-none absolute rounded-full bg-current opacity-25'
      span.style.width = span.style.height = `${diameter}px`
      span.style.left = `${event.clientX - rect.left - diameter / 2}px`
      span.style.top = `${event.clientY - rect.top - diameter / 2}px`
      button.appendChild(span)
      window.setTimeout(() => span.remove(), 650)
    }
    onPointerDown?.(event)
  }

  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      onPointerDown={handlePointerDown}
      {...props}
    />
  )
}

export { Button, buttonVariants }
