
  const carousel = document.querySelector<HTMLElement>('.personas-carousel')
  const track = carousel?.querySelector<HTMLElement>('[data-personas-track]')
  const slides = track ? [...track.querySelectorAll('.personas-slide')] : []
  const statusElement = carousel?.querySelector<HTMLElement>('.personas-status')

  if (carousel && track && slides.length && statusElement) {
    let current = 0
    let scrollFrame = 0
    let settleTimer: number | undefined
    let userScrolled = false
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const previousButton = carousel.querySelector<HTMLButtonElement>('[data-direction="previous"]')
    const nextButton = carousel.querySelector<HTMLButtonElement>('[data-direction="next"]')

    const targetLeft = (slide: HTMLElement) => slide.offsetLeft

    const nearestIndex = () => {
      const position = track.scrollLeft
      return slides.reduce((nearest, slide, index) => {
        const distance = Math.abs(targetLeft(slide) - position)
        const nearestDistance = Math.abs(targetLeft(slides[nearest]) - position)
        return distance < nearestDistance ? index : nearest
      }, 0)
    }

    const update = (announce = false) => {
      slides.forEach((slide, index) => {
        const active = index === current
        slide.classList.toggle('is-active', active)
        slide.querySelector('[data-lanyard-badge]')?.dispatchEvent(new CustomEvent('lanyard:visibility', {
          detail: { active },
        }))
      })
      previousButton?.toggleAttribute('disabled', current === 0)
      nextButton?.toggleAttribute('disabled', current === slides.length - 1)
      if (announce) statusElement.textContent = `Persona ${current + 1} de ${slides.length}`
    }

    const activate = (index: number, direction: number) => {
      slides[index].querySelector('[data-lanyard-badge]')?.dispatchEvent(new CustomEvent('lanyard:activate', {
        detail: { direction },
      }))
    }

    const changeTo = (next: number) => {
      if (next === current || next < 0 || next >= slides.length) return
      const direction = next > current ? 1 : -1
      current = next
      update()
      const trackRect = track.getBoundingClientRect()
      const slideRect = slides[next].getBoundingClientRect()
      const left = track.scrollLeft + slideRect.left - trackRect.left
      track.scrollTo({
        left,
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
      })
      activate(next, direction)
    }

    carousel.querySelectorAll<HTMLButtonElement>('[data-direction]').forEach((button) => {
      const onButtonClick = (event: MouseEvent) => {
        event.preventDefault()
        const next = current + (button.dataset.direction === 'next' ? 1 : -1)
        changeTo(Math.max(0, Math.min(slides.length - 1, next)))
      }
      button.addEventListener('click', onButtonClick)
      button.addEventListener('pointerdown', (event) => event.stopPropagation())
    })

    const onScroll = () => {
      userScrolled = true
      cancelAnimationFrame(scrollFrame)
      scrollFrame = requestAnimationFrame(() => {
        const next = nearestIndex()
        if (next !== current) {
          const direction = next > current ? 1 : -1
          current = next
          update()
          activate(next, direction)
        }
      })
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(() => {
        if (userScrolled) {
          statusElement.textContent = `Persona ${current + 1} de ${slides.length}`
          userScrolled = false
        }
      }, 140)
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    update()
    window.requestAnimationFrame(() => {
      carousel.dataset.ready = 'true'
    })
  }
