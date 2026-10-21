import * as Menu from '@radix-ui/react-dropdown-menu'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const DropdownMenu = Menu.Root
export const DropdownMenuTrigger = Menu.Trigger

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-56 rounded-xl border border-line bg-surface p-1.5 text-sm shadow-card',
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  )
}

export function DropdownMenuItem({
  className,
  destructive,
  ...props
}: ComponentProps<typeof Menu.Item> & { destructive?: boolean }) {
  return (
    <Menu.Item
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 outline-none select-none data-[highlighted]:bg-surface-2 [&_svg]:size-4 [&_svg]:text-muted',
        destructive && 'text-danger data-[highlighted]:bg-danger-soft [&_svg]:text-danger',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof Menu.Label>) {
  return (
    <Menu.Label
      className={cn('px-2.5 pt-1.5 pb-1 text-xs font-medium text-faint', className)}
      {...props}
    />
  )
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof Menu.Separator>) {
  return <Menu.Separator className={cn('my-1.5 h-px bg-line', className)} {...props} />
}
