import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Native-scroll-safe reveal: targets are only hidden after GSAP has
// initialized, so content stays visible if animation setup never runs.
export default function useScrollReveal(ref, { selector = '[data-reveal]', stagger = 0.1, y = 28, start = 'top 86%' } = {}) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return undefined

    const context = gsap.context(() => {
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const targets = gsap.utils.toArray(selector, root)
        if (!targets.length) return
        // Explicit end values: gsap.from would record the current computed
        // style, which a CSS transition can leave mid-flight after a re-mount.
        gsap.fromTo(targets, { opacity: 0, y }, {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: 'power3.out',
          stagger,
          scrollTrigger: { trigger: root, start, once: true },
        })
      })
      return () => media.revert()
    }, root)

    return () => context.revert()
  }, [ref, selector, stagger, y, start])
}