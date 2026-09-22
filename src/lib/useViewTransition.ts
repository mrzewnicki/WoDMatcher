import { useEffect, useRef, useState, type RefObject } from 'react'
import { flushSync } from 'react-dom'

type DocumentWithVT = Document & {
  startViewTransition?: (update: () => void) => {
    finished: Promise<void>
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type Options = {
  /** CSS class toggled on fallback swap (no View Transitions API). */
  fallbackClass?: string
  fallbackRef?: RefObject<HTMLElement | null>
}

/**
 * Soften abrupt list swaps with the View Transition API when available.
 * `key` should change only when the displayed content meaningfully changes.
 */
export function useViewTransitionValue<T>(
  value: T,
  key: string,
  options: Options = {},
): T {
  const [displayed, setDisplayed] = useState(value)
  const valueRef = useRef(value)
  const optionsRef = useRef(options)
  const isFirst = useRef(true)
  valueRef.current = value
  optionsRef.current = options

  useEffect(() => {
    const next = valueRef.current
    if (isFirst.current) {
      isFirst.current = false
      setDisplayed(next)
      return
    }

    const doc = document as DocumentWithVT
    if (
      typeof doc.startViewTransition === 'function' &&
      !prefersReducedMotion()
    ) {
      doc.startViewTransition(() => {
        flushSync(() => setDisplayed(next))
      })
      return
    }

    const { fallbackClass, fallbackRef } = optionsRef.current
    const target = fallbackRef?.current
    if (target && fallbackClass && !prefersReducedMotion()) {
      target.classList.remove(fallbackClass)
      void target.offsetWidth
      target.classList.add(fallbackClass)
      const onEnd = () => target.classList.remove(fallbackClass)
      target.addEventListener('animationend', onEnd, { once: true })
      setDisplayed(next)
      return
    }

    setDisplayed(next)
  }, [key])

  return displayed
}
