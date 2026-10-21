import * as SliderPrimitive from '@radix-ui/react-slider'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface SliderProps extends ComponentProps<typeof SliderPrimitive.Root> {
  thumbLabel: string
  valueText?: string
}

export function Slider({ className, thumbLabel, valueText, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      className={cn(
        'relative flex h-9 w-full touch-none items-center select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 grow overflow-hidden rounded-full bg-line">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-gradient-to-r from-accent to-accent-bright" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={thumbLabel}
        aria-valuetext={valueText}
        className="block size-7 cursor-grab rounded-full border-[3px] border-accent bg-surface shadow-[0_2px_8px_rgb(0_0_0/0.18)] transition-[transform,box-shadow] duration-200 hover:scale-110 hover:shadow-[0_0_0_8px_var(--accent-soft)] focus-visible:shadow-[0_0_0_8px_var(--accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95 active:cursor-grabbing"
      />
    </SliderPrimitive.Root>
  )
}
