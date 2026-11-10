"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { cn } from "@/shared/lib/utils";

function Slider({ className, showThumb = false, ...props }: React.ComponentProps<typeof SliderPrimitive.Root> & { showThumb?: boolean }) {
  const thumbs = Array.isArray(props.value) ? props.value : (props.defaultValue ?? [0]);
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("group/slider relative flex w-full touch-none items-center select-none py-2 data-[disabled]:opacity-50", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-[2px] w-full grow bg-foreground/25 transition-[height] group-hover/slider:h-[3px]">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {thumbs.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn("block size-3 rounded-full bg-primary transition-opacity focus-visible:opacity-100", showThumb ? "size-4" : "opacity-0 group-hover/slider:opacity-100")}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
