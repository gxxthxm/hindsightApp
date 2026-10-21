import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'press relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl font-medium whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-accent-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(0_0_0/0.12),0_6px_16px_-6px_var(--accent)] hover:bg-accent-hover before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-1/3 before:-translate-x-[120%] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent hover:before:animate-[shimmer_900ms_ease-out]',
        secondary:
          'bg-surface text-ink border border-line shadow-[0_1px_2px_rgb(0_0_0/0.04)] hover:border-line-strong hover:bg-surface-2',
        ghost: 'text-muted hover:text-ink hover:bg-surface-2',
        danger:
          'bg-surface text-danger border border-line hover:bg-danger-soft hover:border-danger/40',
        inverse: 'bg-ink text-bg hover:bg-ink/90',
        link: 'text-accent-text underline-offset-4 hover:underline px-0',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-5 text-[15px]',
        xl: 'h-14 px-6 text-base',
        icon: 'size-10',
        'icon-sm': 'size-8 rounded-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      type={asChild ? undefined : (type ?? 'button')}
      {...props}
    />
  )
}
