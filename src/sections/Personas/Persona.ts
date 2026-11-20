const carousel = document.querySelector<HTMLElement>('.personas-carousel')
const track = carousel?.querySelector<HTMLElement>('[data-personas-track]')
const slides = track ? [...track.querySelectorAll<HTMLElement>('.personas-slide')] : []
const controls = carousel?.querySelector<HTMLElement>('.personas-controls')
const previousButton = controls?.querySelector<HTMLButtonElement>('[data-direction="previous"]')
const nextButton = controls?.querySelector<HTMLButtonElement>('[data-direction="next"]')
const statusElement = carousel?.querySelector<HTMLElement>('.personas-status')

if (track && slides.length > 1 && controls && previousButton && nextButton && statusElement) {
  const mobile = window.matchMedia('(max-width: 800px)')
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const badges = slides.map((slide) => slide.querySelector('[data-lanyard-badge]'))
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

  const hasScrollEnd = 'onscrollend' in track
  if (hasScrollEnd) track.addEventListener('scrollend', settle)
  track.addEventListener('scroll', () => {
    if (!mobile.matches) return
    if (!reducedMotion.matches && !pullFrame) pullFrame = requestAnimationFrame(pullVisibleBadges)
    if (!hasScrollEnd) {
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(settle, 160)
    }
  }, { passive: true })

  mobile.addEventListener('change', () => {
    clearPending()
    resetPull()
    window.clearTimeout(settleTimer)
    if (mobile.matches) syncSelection(nearestIndex())
  })
  reducedMotion.addEventListener('change', resetPull)

  syncSelection(nearestIndex())
  controls.hidden = false
}
