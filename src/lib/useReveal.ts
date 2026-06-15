import { useEffect, useRef } from 'react'

/**
 * Adds the `in` class to children with `.reveal` once they scroll into view.
 * Attach the returned ref to a container section.
 *
 * Pass `deps` when the revealable content renders asynchronously (e.g. after a
 * fetch) so the observer re-attaches once that content is in the DOM.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const targets = root.classList.contains('reveal')
      ? [root, ...Array.from(root.querySelectorAll<HTMLElement>('.reveal'))]
      : Array.from(root.querySelectorAll<HTMLElement>('.reveal'))

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }
      },
      // threshold 0 (any pixel) is essential: elements taller than the
      // viewport — e.g. a long card grid stacked on mobile — can never reach a
      // higher ratio, so a non-zero threshold would leave them invisible.
      { threshold: 0, rootMargin: '0px 0px -10% 0px' },
    )
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
