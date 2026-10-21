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
        'relative flex h-8 w-full touch-none items-center select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-surface-2 ring-1 ring-line">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-accent" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={thumbLabel}
        aria-valuetext={valueText}
        className="block size-6 cursor-grab rounded-full border-2 border-accent bg-surface shadow-md transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:cursor-grabbing"
      />
    </SliderPrimitive.Root>
  )
}
