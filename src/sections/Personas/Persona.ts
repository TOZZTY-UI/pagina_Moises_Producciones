import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const carousel = document.querySelector<HTMLElement>('.personas-carousel')
const track = carousel?.querySelector<HTMLElement>('[data-personas-track]')
const slides = track ? [...track.querySelectorAll<HTMLElement>('.personas-slide')] : []
const controls = carousel?.querySelector<HTMLElement>('.personas-controls')
const previousButton = controls?.querySelector<HTMLButtonElement>('[data-direction="previous"]')
const nextButton = controls?.querySelector<HTMLButtonElement>('[data-direction="next"]')
const statusElement = carousel?.querySelector<HTMLElement>('.personas-status')
const stage = carousel?.querySelector<HTMLElement>('.personas-stage')
const intro = stage?.querySelector<HTMLElement>('.personas-intro')
const badges = slides.map((slide) => slide.querySelector<HTMLElement>('[data-lanyard-badge]'))
const details = stage ? [...stage.querySelectorAll<HTMLElement>('[data-personas-detail]')] : []

if (carousel && stage && intro && track && slides.length > 1) {
  const media = gsap.matchMedia()
  media.add('(min-width: 801px) and (prefers-reduced-motion: no-preference)', () => {
    carousel.classList.add('has-personas-sequence')
    const sequence = gsap.timeline({ paused: true })
    const groupScale = () => Math.min(
      1,
      (stage.clientWidth - 32) / track.offsetWidth,
      track.clientHeight / slides[0].offsetHeight,
    )
    const syncGroupScale = () => {
      if (track.dataset.view === 'group') gsap.set(track, { scale: groupScale() })
    }
    const pull = (targets: typeof badges, direction: number) => {
      const velocity = sequence.scrollTrigger?.getVelocity() ?? 0
      const offset = gsap.utils.clamp(-42, 42, direction * velocity * 0.012)
      if (Math.abs(offset) < 0.5) return
      targets.forEach((badge) => {
        badge?.dispatchEvent(new CustomEvent('lanyard:pull', { detail: { offset } }))
      })
    }

    // Keep the first frame deterministic. In particular, don't let a later
    // slide's initial state hide the first card while the group is still shown.
    gsap.set(track, { x: 0, scale: groupScale(), attr: { 'data-view': 'group' } })
    gsap.set(slides, { x: 0, scale: 1, autoAlpha: 1 })
    gsap.set(details, { x: 0, autoAlpha: 0 })
    gsap.set(intro, { autoAlpha: 1 })

    sequence.fromTo(track, { x: 0, scale: groupScale }, {
      x: () => -(stage.clientWidth + track.offsetWidth * groupScale()) / 2,
      scale: groupScale,
      duration: 1,
      ease: 'none',
      onUpdate: () => pull(badges, -1),
    })
      .to(intro, { autoAlpha: 0, duration: 0.5 }, 0)
      // The gallery is fully gone before the individual pass starts. Reset
      // every slide's transform as well as its visibility so no old slot
      // position leaks into the next phase.
      .set(slides, { x: 0, scale: 1, autoAlpha: 0 })
      .set(details, { x: 0, autoAlpha: 0 })
      .set(track, { x: 0, scale: 1, attr: { 'data-view': 'individual' } })

    const exitDuration = 0.35
    slides.forEach((slide, index) => {
      // Layout stays in one row. Move the whole badge (pins, canvas and card)
      // relative to its slot, so a change of person never cuts the cord.
      const center = () => (track.offsetWidth - slide.offsetWidth) / 2 - slide.offsetLeft
      const focusOffset = () => Math.min(stage.clientWidth * 0.25, 360)
      const focus = () => center() + focusOffset()
      const offRight = () => focus() + (stage.clientWidth + slide.offsetWidth) / 2
      const badge = badges[index]
      const detail = details[index]
      const showFront = () => { badge?.dispatchEvent(new Event('lanyard:show-front')) }
      const showDetail = () => {
        detail?.setAttribute('aria-hidden', 'false')
        if (detail) detail.inert = false
      }
      const hideDetail = () => {
        detail?.setAttribute('aria-hidden', 'true')
        if (detail) detail.inert = true
      }
      sequence
        .set(slide, { x: offRight, scale: 1, autoAlpha: 0 })
        .set(detail, { x: -24, autoAlpha: 0 })
        .to(slide, {
          x: focus,
          scale: () => Math.min(1, stage.clientHeight / slide.offsetHeight),
          autoAlpha: 1,
          duration: 0.4,
          ease: 'power2.out',
          immediateRender: false,
          onStart: () => {
            showFront()
            showDetail()
          },
          onUpdate: () => pull([badge], -1),
        })
        .to(detail, {
          x: 0,
          autoAlpha: 1,
          duration: 0.4,
          ease: 'power2.out',
          immediateRender: false,
        }, '<')
        .to(slide, {
          x: offRight,
          autoAlpha: 0,
          duration: exitDuration,
          ease: 'power2.in',
          onComplete: showFront,
          onUpdate: () => pull([badge], 1),
        }, '+=0.5')
        .to(detail, {
          x: -24,
          autoAlpha: 0,
          duration: exitDuration,
          ease: 'power2.in',
          onComplete: hideDetail,
        }, '<')
    })

    // One timeline unit is one viewport of scrolling. Release the sticky stage
    // during the last exit so the next section arrives with the last card.
    gsap.set(carousel, { height: `${(1 + sequence.duration() - exitDuration) * 100}svh` })
    window.addEventListener('resize', syncGroupScale)
    ScrollTrigger.create({
      trigger: carousel,
      start: 'top top',
      end: () => `+=${stage.clientHeight * sequence.duration()}`,
      animation: sequence,
      scrub: true,
      invalidateOnRefresh: true,
    })
    ScrollTrigger.refresh()
    return () => {
      window.removeEventListener('resize', syncGroupScale)
      carousel.classList.remove('has-personas-sequence')
    }
  })
  document.addEventListener('astro:before-swap', () => media.revert(), { once: true })
}

if (track && slides.length > 1 && controls && previousButton && nextButton && statusElement) {
  const mobile = window.matchMedia('(max-width: 800px)')
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let current = -1
  let pending: { index: number; from: number } | undefined
  let settleTimer: number | undefined
  let pullFrame = 0
  let lastLeft = track.scrollLeft
  let lastSample = 0

  const pullVisibleBadges = (now: number) => {
    pullFrame = 0
    const width = track.clientWidth
    if (!width) return
    const left = Math.max(0, Math.min(track.scrollLeft, track.scrollWidth - width))
    const elapsed = now - lastSample
    const delta = lastLeft - left
    lastSample = now
    lastLeft = left

    // Pull the pins in the direction the cards travel, opposite to scrollLeft.
    // A short velocity look-ahead makes the strap lead the card.
    const limit = Math.min(48, width * 0.12)
    const frameTime = elapsed >= 8 && elapsed <= 50 ? elapsed : 1000 / 60
    const offset = Math.max(-limit, Math.min(limit, delta * 55 / frameTime))
    if (Math.abs(offset) < 0.5) return

    for (let index = Math.floor(left / width); index <= Math.ceil(left / width); index++) {
      badges[index]?.dispatchEvent(new CustomEvent('lanyard:pull', { detail: { offset } }))
    }
  }

  const resetPull = () => {
    cancelAnimationFrame(pullFrame)
    pullFrame = 0
    lastLeft = track.scrollLeft
    lastSample = 0
  }

  const nearestIndex = () => {
    const left = track.scrollLeft
    return slides.reduce((nearest, slide, index) =>
      Math.abs(slide.offsetLeft - left) < Math.abs(slides[nearest].offsetLeft - left) ? index : nearest, 0)
  }

  const syncSelection = (index: number, announce = false) => {
    if (index === current) return
    current = index
    slides.forEach((slide, i) => {
      const active = i === current
      if (slide.classList.contains('is-active') === active) return
      slide.classList.toggle('is-active', active)
      badges[i]?.dispatchEvent(new CustomEvent('lanyard:visibility', { detail: { active } }))
    })

    const focused = document.activeElement
    previousButton.disabled = current === 0
    nextButton.disabled = current === slides.length - 1
    if (focused === previousButton && previousButton.disabled) nextButton.focus({ preventScroll: true })
    if (focused === nextButton && nextButton.disabled) previousButton.focus({ preventScroll: true })

    if (announce) statusElement.textContent = slides[current].getAttribute('aria-label')
  }

  const settle = () => {
    window.clearTimeout(settleTimer)
    if (!mobile.matches) return
    // A queued scrollend can still belong to the previous button press.
    if (pending && Math.abs(track.scrollLeft - pending.from) < 1) return
    pending = undefined
    syncSelection(nearestIndex(), true)
  }

  const step = (direction: number) => {
    const index = (pending?.index ?? nearestIndex()) + direction
    const slide = slides[index]
    if (!mobile.matches || !slide) return

    const from = track.scrollLeft
    const left = slide.offsetLeft
    if (Math.abs(left - from) < 1) {
      // The user reversed direction before the earlier scroll got underway.
      pending = undefined
      track.scrollTo({ left, behavior: 'instant' })
      syncSelection(index, true)
      return
    }
    pending = { index, from }
    track.scrollTo({ left })
  }

  previousButton.addEventListener('click', () => step(-1))
  nextButton.addEventListener('click', () => step(1))

  const clearPending = () => { pending = undefined }
  track.addEventListener('pointerdown', clearPending, { passive: true })
  track.addEventListener('wheel', clearPending, { passive: true })

  track.addEventListener('scrollend', settle)
  track.addEventListener('scroll', () => {
    if (!mobile.matches) return
    if (!reducedMotion.matches && !pullFrame) pullFrame = requestAnimationFrame(pullVisibleBadges)
    // Lenis can consume scrollend in capture, even in browsers that support it.
    window.clearTimeout(settleTimer)
    settleTimer = window.setTimeout(settle, 160)
  }, { passive: true })

  mobile.addEventListener('change', () => {
    clearPending()
    resetPull()
    window.clearTimeout(settleTimer)
    if (mobile.matches) {
      // Native snap can keep the old transformed position during the resize.
      // Align the selected slide after the desktop timeline has reverted.
      const index = Math.max(0, current)
      requestAnimationFrame(() => {
        if (!mobile.matches) return
        track.scrollTo({ left: slides[index].offsetLeft, behavior: 'instant' })
        syncSelection(index)
        resetPull()
      })
    }
  })
  reducedMotion.addEventListener('change', resetPull)

  syncSelection(nearestIndex())
  controls.hidden = false
}
