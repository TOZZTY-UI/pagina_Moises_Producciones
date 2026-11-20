  // El código se ejecuta en el navegador y no necesita React ni client:load.
// #region physics
type Pt = { x: number; y: number; px: number; py: number; w: number }
type Link = [number, number, number]
type Spin = { a: number; v: number }

/** Verlet step. `w` is inverse mass; 0 pins a point in place. */
function integrate(pts: Pt[], dt: number, gravity: number, damping: number) {
  for (const p of pts) {
    if (!p.w) continue
    const vx = (p.x - p.px) * damping
    const vy = (p.y - p.py) * damping
    p.px = p.x
    p.py = p.y
    p.x += vx
    p.y += vy + gravity * dt * dt
  }
}

/** Relax distance constraints, heavier points moving less. */
function solve(pts: Pt[], links: Link[], iterations: number) {
  for (let k = 0; k < iterations; k++) {
    for (const [i, j, rest] of links) {
      const a = pts[i]
      const b = pts[j]
      const ws = a.w + b.w
      if (!ws) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.hypot(dx, dy) || 1e-6
      const f = (d - rest) / (d * ws)
      a.x += dx * f * a.w
      a.y += dy * f * a.w
      b.x -= dx * f * b.w
      b.y -= dy * f * b.w
    }
  }
}

/**
 * The card's turn on the ring. The strap's own twist is the spring pulling it
 * back to `target`; `drive` is whatever is twisting it right now.
 */
function spinStep(s: Spin, target: number, dt: number, drive: number) {
  s.v += (-(s.a - target) * 18 - s.v * 3.2 + drive) * dt
  s.a += s.v * dt
}

/** How far the card swings from hanging straight down, in radians. Right is positive. */
function swingAngle(top: Pt, bottom: Pt) {
  return Math.atan2(bottom.x - top.x, bottom.y - top.y)
}
// #endregion
const DISPLAY = '"Oswald", "Bebas Neue", "Arial Narrow", Impact, sans-serif'
const SCRIPT = '"Segoe Script", "Brush Script MT", "Snell Roundhand", cursive'
const AUTO_HOVER_INTERVAL = 2000

/** A mandala: rings, petals, a bead circle and a flower in the middle. */
function drawMandala(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.lineWidth = Math.max(0.8, r * 0.018)
  for (const k of [1, 0.9, 0.62, 0.26]) {
    ctx.beginPath()
    ctx.arc(0, 0, r * k, 0, Math.PI * 2)
    ctx.stroke()
  }
  for (let i = 0; i < 16; i++) {
    ctx.save()
    ctx.rotate((i / 16) * Math.PI * 2)
    ctx.beginPath()
    ctx.ellipse(0, -r * 0.76, r * 0.07, r * 0.13, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.rotate(Math.PI / 16)
    ctx.beginPath()
    ctx.arc(0, -r * 0.95, r * 0.018, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  for (let i = 0; i < 8; i++) {
    ctx.save()
    ctx.rotate((i / 8) * Math.PI * 2)
    ctx.beginPath()
    ctx.moveTo(0, -r * 0.26)
    ctx.bezierCurveTo(r * 0.12, -r * 0.4, r * 0.1, -r * 0.52, 0, -r * 0.6)
    ctx.bezierCurveTo(-r * 0.1, -r * 0.52, -r * 0.12, -r * 0.4, 0, -r * 0.26)
    ctx.stroke()
    ctx.restore()
  }
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.07, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/**
 * The printed strap, `length` css px long, laid out along the canvas height so
 * each rope segment can crop its own slice. Returns a canvas in device px.
 */
function makeStrap(
  length: number,
  width: number,
  dpr: number,
  opts: { color: string; ink: string; text: string; label: string; plain?: boolean },
) {
  const c = document.createElement("canvas")
  c.width = Math.max(1, Math.round(width * dpr))
  c.height = Math.max(1, Math.round(length * dpr))
  const ctx = c.getContext("2d")!
  // strap space: x runs down the strap, y runs across it
  ctx.setTransform(0, dpr, -dpr, 0, c.width, 0)
  ctx.fillStyle = opts.color
  ctx.fillRect(0, 0, length, width)
  ctx.strokeStyle = ctx.fillStyle = opts.ink

  if (!opts.plain) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, length, width)
    ctx.clip()
    ctx.textBaseline = "middle"
    const scriptFont = "400 " + Math.round(width * 0.5) + "px " + SCRIPT
    const labelFont = "700 " + Math.round(width * 0.36) + "px " + DISPLAY
    ctx.font = scriptFont
    const scriptW = ctx.measureText(opts.text).width
    ctx.font = labelFont
    const labelW = ctx.measureText(opts.label).width
    const gap = width * 0.6
    let x = width * 0.4
    let flip = 1
    while (x < length) {
      // a mandala too big for the strap, so only an arc of it shows
      ctx.globalAlpha = 0.55
      drawMandala(ctx, x + width * 1.3, width * (0.5 + flip * 0.28), width * 1.35)
      x += width * 2.8
      ctx.globalAlpha = 0.95
      ctx.font = scriptFont
      ctx.fillText(opts.text, x, width * 0.52)
      x += scriptW + gap
      if (opts.label) {
        ctx.font = labelFont
        ctx.fillText("-  " + opts.label + "  -", x, width * 0.53)
        x += labelW + ctx.measureText("-    -").width + gap
      }
      flip = -flip
    }
    ctx.restore()
  }

  // woven edges catch a little light
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, 1.5)
  ctx.lineTo(length, 1.5)
  ctx.moveTo(0, width - 1.5)
  ctx.lineTo(length, width - 1.5)
  ctx.stroke()
  return c
}



  type Destroy = () => void;
  const instances = new Map<HTMLElement, Destroy>();

  function initBadge(root: HTMLElement): Destroy | undefined {
    const canvas = root.querySelector<HTMLCanvasElement>('.lanyard-canvas');
    const card = root.querySelector<HTMLDivElement>('.lanyard-card');
    const inner = root.querySelector<HTMLDivElement>('.lanyard-inner');
    const hoverImage = root.querySelector<HTMLImageElement>('.badge-image--hover');
    const flipButton = root.querySelector<HTMLButtonElement>('.flip-button');
    const flipLabel = root.querySelector<HTMLElement>('[data-flip-label]');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !card || !inner || !ctx) return;

    const cw = Number(root.dataset.cardWidth || 240);
    const ch = Math.round(cw * 1.5);
    const ringR = Math.max(7, Math.round(cw * 0.036));
    const clipH = Math.round(cw * 0.1);
    const look = {
      strapText: root.dataset.strapText || '',
      strapLabel: root.dataset.strapLabel || '',
      strapColor: root.dataset.strapColor || '#141312',
      inkColor: root.dataset.inkColor || '#b59a6c'
    };
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = motionQuery.matches;
    const sw = Math.max(14, Math.round(cw * 0.1)) // strap width
    const lowLen = sw * 2.2 // buckle to ring
    const arm = ringR * 2 + clipH + ch * 0.55 // ring to the card's centre of mass
    const N = 14

    let pts: Pt[] = []
    let links: Link[] = []
    let left: number[] = []
    let right: number[] = []
    let low: number[] = []
    let iB = 0
    let iT = 0
    let iC = 0
    let strandRest = 1
    let dpr = 1
    let W = 1
    let H = 1
    // Extra drawing room prevents the swinging cord from being clipped by
    // the canvas bitmap when the card is dragged toward a section edge.
    // Each badge can be dragged across its whole Personas section. Keep
    // enough bitmap room on both sides for the complete cord and its swing.
    const baseBleed = Math.max(120, cw * 0.75)
    let bleed = baseBleed

    const resizeCanvas = () => {
      canvas.width = Math.round((W + bleed * 2) * dpr)
      canvas.height = Math.round((H + bleed * 2) * dpr)
      canvas.style.left = `${-bleed}px`
      canvas.style.top = `${-bleed}px`
      canvas.style.width = `calc(100% + ${bleed * 2}px)`
      canvas.style.height = `calc(100% + ${bleed * 2}px)`
    }
    let strapTex: HTMLCanvasElement | null = null
    let plainTex: HTMLCanvasElement | null = null
    const spin: Spin = { a: 0, v: 0 }
    let spinTarget = 0
    spin.a = spinTarget
    let autoHoverTimer: number | undefined
    let autoHoverPaused = false

    const add = (x: number, y: number, w: number) => {
      pts.push({ x, y, px: x, py: y, w })
      return pts.length - 1
    }
    const strand = (from: number, to: number, n: number, slack: number) => {
      const a = pts[from]
      const b = pts[to]
      const rest = (Math.hypot(b.x - a.x, b.y - a.y) * slack) / n
      const ids = [from]
      for (let i = 1; i < n; i++) ids.push(add(a.x + ((b.x - a.x) * i) / n, a.y + ((b.y - a.y) * i) / n, 1))
      ids.push(to)
      for (let i = 0; i < n; i++) links.push([ids[i], ids[i + 1], rest])
      return { ids, rest }
    }

    const build = () => {
      // 1.5x keeps the cord crisp without multiplying every canvas operation
      // unnecessarily on high-density displays.
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      W = Math.max(1, root.clientWidth)
      H = Math.max(1, root.clientHeight)
      resizeCanvas()

      pts = []
      links = []
      const cx = W / 2
      const spread = Math.min(W * 0.16, cw * 0.55)
      const top = -sw * 2
      // hang the buckle so the whole card fits, but never above a sixth of the frame
      const bY = Math.max(H * 0.16, Math.min(H * 0.42, H - (lowLen + ringR * 2 + clipH + ch) - 28))

      const aL = add(cx - spread, top, 0)
      iB = add(cx, bY, 1.4)
      const l = strand(aL, iB, N, 1.03)
      const aR = add(cx + spread, top, 0)
      const r = strand(aR, iB, N, 1.03)
      iT = add(cx, bY + lowLen, 0.8)
      const lo = strand(iB, iT, 3, 1)
      iC = add(cx, bY + lowLen + arm, 0.25)
      links.push([iT, iC, arm])
      left = l.ids
      right = r.ids
      low = lo.ids
      strandRest = l.rest

      const c = look
      const opts = { color: c.strapColor, ink: c.inkColor, text: c.strapText, label: c.strapLabel }
      strapTex = makeStrap(strandRest * N + 4, sw, dpr, opts)
      plainTex = makeStrap(lowLen + 4, sw * 0.8, dpr, { ...opts, plain: true })

      if (reduced) {
        for (let i = 0; i < 900; i++) {
          integrate(pts, STEP, GRAVITY, 0.98)
          solve(pts, links, ITER)
        }
      } else {
        // enter mid-swing, as if someone just let go of it
        pts[iC].x += cw * 0.55
        pts[iC].px = pts[iC].x - 2
        spin.v = 5
      }
    }

    const STEP = 1 / 90
    const GRAVITY = 2400
    const ITER = 12

    // ---- drawing ---------------------------------------------------------
    const ribbon = (ids: number[], tex: HTMLCanvasElement, rest: number, light: number) => {
      const Wt = tex.width
      for (let i = 0; i < ids.length - 1; i++) {
        const a = pts[ids[i]]
        const b = pts[ids[i + 1]]
        const dx = (b.x - a.x) * dpr
        const dy = (b.y - a.y) * dpr
        const len = Math.hypot(dx, dy) || 1e-6
        const tx = dx / len
        const ty = dy / len
        // glyph tops face +n; this pairing keeps the print readable, not mirrored
        const nx = ty
        const ny = -tx
        const v0 = i * rest * dpr
        const dv = rest * dpr
        const k = len / dv
        ctx.setTransform(nx, ny, tx * k, ty * k, bleed * dpr + a.x * dpr - (nx * Wt) / 2 - tx * k * v0, bleed * dpr + a.y * dpr - (ny * Wt) / 2 - ty * k * v0)
        // +1.5 overlaps the next slice, so bends never show a hairline seam
        const src = Math.min(dv + 1.5, tex.height - v0)
        if (src > 0) ctx.drawImage(tex, 0, v0, Wt, src, 0, v0, Wt, src)
        // a strand turned away from the light reads darker, which sells the 3D
        const shade = 0.22 * (1 - Math.max(0, nx * light))
        ctx.fillStyle = "rgba(0,0,0," + shade.toFixed(3) + ")"
        ctx.fillRect(0, v0, Wt, dv + 1)
      }
    }

    const metal = (x0: number, y0: number, x1: number, y1: number) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1)
      g.addColorStop(0, "#f4efe4")
      g.addColorStop(0.45, "#b9b0a0")
      g.addColorStop(0.55, "#8f8778")
      g.addColorStop(1, "#ece6da")
      return g
    }

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (!strapTex || !plainTex) return
      ctx.imageSmoothingEnabled = true
      ribbon(left, strapTex, strandRest, -1)
      ribbon(right, strapTex, strandRest, 1)
      ribbon(low, plainTex, (lowLen * 1) / 3, 0)

      // side-release buckle, turned to follow the short strap
      const B = pts[iB]
      const T = pts[iT]
      const ang = Math.atan2(T.x - B.x, T.y - B.y)
      const u = sw / 20
      ctx.setTransform(dpr, 0, 0, dpr, (bleed + B.x) * dpr, (bleed + B.y) * dpr)
      ctx.rotate(-ang)
      ctx.shadowColor = "rgba(0,0,0,0.3)"
      ctx.shadowBlur = 6 * dpr
      ctx.shadowOffsetY = 2 * dpr
      ctx.fillStyle = metal(-16 * u, 0, 16 * u, 0)
      ctx.beginPath()
      ctx.roundRect(-15 * u, -14 * u, 30 * u, 17 * u, 3 * u)
      ctx.fill()
      ctx.beginPath()
      ctx.roundRect(-11 * u, 1 * u, 22 * u, 15 * u, [2 * u, 2 * u, 6 * u, 6 * u])
      ctx.fill()
      ctx.shadowColor = "transparent"
      ctx.fillStyle = "rgba(40,36,30,0.55)"
      ctx.fillRect(-10 * u, -9 * u, 20 * u, 2.2 * u)
      ctx.fillRect(-5 * u, 6 * u, 10 * u, 3 * u)
      ctx.strokeStyle = "rgba(255,255,255,0.6)"
      ctx.lineWidth = 0.8 * u
      ctx.beginPath()
      ctx.moveTo(-13 * u, -12.5 * u)
      ctx.lineTo(13 * u, -12.5 * u)
      ctx.stroke()

      // split ring
      ctx.setTransform(dpr, 0, 0, dpr, (bleed + T.x) * dpr, (bleed + T.y + ringR * 0.8) * dpr)
      ctx.lineWidth = Math.max(2.5, ringR * 0.38)
      ctx.strokeStyle = metal(-ringR, -ringR, ringR, ringR)
      ctx.beginPath()
      ctx.arc(0, 0, ringR, 0, Math.PI * 2)
      ctx.stroke()
    }

    const place = () => {
      const T = pts[iT]
      const C = pts[iC]
      const swing = swingAngle(T, C)
      card.style.transform =
        "translate3d(" + (T.x - cw / 2).toFixed(2) + "px," + (T.y + ringR).toFixed(2) + "px,0) rotate(" + (-swing).toFixed(4) + "rad)"
      inner.style.transform = "perspective(1100px) rotateY(" + spin.a.toFixed(4) + "rad)"
      const edge = 1 - Math.abs(Math.cos(spin.a))
      inner.style.setProperty("--lyd-dim", (edge * 0.5).toFixed(3))
      inner.style.setProperty("--lyd-shine", (50 + Math.sin(spin.a) * 70 + swing * 90).toFixed(1) + "%")
    }

    // ---- interaction -----------------------------------------------------
    type Drag = { id: number; ox: number; oy: number; tx: number; ty: number; sx: number; sy: number; moved: boolean; active: boolean }
    let drag: Drag | null = null
    let mobileTap: { id: number; x: number; y: number } | null = null
    const local = (e: PointerEvent) => {
      const r = root.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top]
    }
    const flip = () => {
      spinTarget = spinTarget === 0 ? Math.PI : 0
      const flipped = spinTarget !== 0
      card.setAttribute("aria-pressed", String(flipped))
      flipButton?.setAttribute("aria-pressed", String(flipped))
      if (flipLabel) flipLabel.textContent = flipped ? "Mostrar frente" : "Mostrar reverso"
    }
    const onDown = (e: PointerEvent) => {
      if (e.button > 0) return
      if ((e.target as Element).closest("a, button")) return
      if (mobileQuery.matches) {
        mobileTap = { id: e.pointerId, x: e.clientX, y: e.clientY }
        return
      }
      const [x, y] = local(e)
      const T = pts[iT]
      const active = e.pointerType !== 'touch'
      drag = { id: e.pointerId, ox: T.x - x, oy: T.y - y, tx: T.x, ty: T.y, sx: x, sy: y, moved: false, active }
      if (active) {
        pts[iT].w = 0
        const section = root.closest<HTMLElement>('.personas-carousel')
        bleed = Math.max(baseBleed, section?.clientWidth || root.clientWidth)
        resizeCanvas()
        root.classList.add('is-dragging')
        card.setPointerCapture(e.pointerId)
        card.style.cursor = "grabbing"
      }
    }
    const onMove = (e: PointerEvent) => {
      if (mobileTap?.id === e.pointerId) {
        if (Math.hypot(e.clientX - mobileTap.x, e.clientY - mobileTap.y) > 8) mobileTap = null
        return
      }
      if (!drag || e.pointerId !== drag.id) return
      const [x, y] = local(e)
      if (!drag.active && e.pointerType === 'touch') {
        const dx = x - drag.sx
        const dy = y - drag.sy
        if (Math.hypot(dx, dy) < 8) return
        if (Math.abs(dy) > Math.abs(dx)) {
          drag = null
          return
        }
        drag.active = true
        pts[iT].w = 0
        const section = root.closest<HTMLElement>('.personas-carousel')
        bleed = Math.max(baseBleed, section?.clientWidth || root.clientWidth)
        resizeCanvas()
        root.classList.add('is-dragging')
        card.setPointerCapture(e.pointerId)
        card.style.cursor = "grabbing"
      }
      if (!drag.active) return
      drag.tx = x + drag.ox
      drag.ty = y + drag.oy
      if (Math.hypot(x - drag.sx, y - drag.sy) > 5) drag.moved = true
    }
    const onUp = (e: PointerEvent) => {
      if (e.type === 'pointercancel') {
        mobileTap = null
      } else if (mobileTap?.id === e.pointerId) {
        mobileTap = null
        flip()
        return
      }
      if (!drag || e.pointerId !== drag.id) return
      if (!drag.moved) flip()
      if (!drag.active) {
        drag = null
        return
      }
      drag = null
      pts[iT].w = 0.8
      root.classList.remove('is-dragging')
      card.style.cursor = "grab"
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        flip()
      }
    }
    const onFlipClick = () => flip()
    const onActivate = (event: Event) => {
      if (reduced) return
      const direction = Number((event as CustomEvent<{ direction?: number }>).detail?.direction) || 1
      const C = pts[iC]
      C.x += direction * cw * 0.62
      C.px = C.x - direction * 4
      spin.v = direction * 5.5
    }
    const setAutoHover = (active: boolean) => {
      if (!hoverImage || reduced || autoHoverPaused || !mobileQuery.matches) return
      card.classList.toggle('is-auto-hover', active)
    }
    const pauseAutoHover = () => {
      if (!hoverImage) return
      autoHoverPaused = true
      card.classList.remove('is-auto-hover')
      if (autoHoverTimer !== undefined) window.clearInterval(autoHoverTimer)
    }
    const resumeAutoHover = () => {
      if (!hoverImage || reduced || !mobileQuery.matches) return
      autoHoverPaused = false
      if (autoHoverTimer !== undefined) window.clearInterval(autoHoverTimer)
      autoHoverTimer = window.setInterval(() => {
        setAutoHover(!card.classList.contains('is-auto-hover'))
        }, AUTO_HOVER_INTERVAL)
    }
    const onMotionChange = (e: MediaQueryListEvent) => {
      reduced = e.matches
      if (reduced) {
        pauseAutoHover()
      } else {
        if (mobileQuery.matches) resumeAutoHover()
        else pauseAutoHover()
      }
      build()
      draw()
      place()
    }
    card.addEventListener("keydown", onKeyDown)
    flipButton?.addEventListener("click", onFlipClick)
    card.addEventListener("mouseenter", pauseAutoHover)
    card.addEventListener("mouseleave", resumeAutoHover)
    card.addEventListener("focusin", pauseAutoHover)
    card.addEventListener("focusout", resumeAutoHover)
    root.addEventListener("lanyard:activate", onActivate)
    motionQuery.addEventListener("change", onMotionChange)
    card.addEventListener("pointerdown", onDown)
    card.addEventListener("pointermove", onMove)
    card.addEventListener("pointerup", onUp)
    card.addEventListener("pointercancel", onUp)

    // ---- loop --------------------------------------------------------------
    let raf = 0
    let acc = 0
    let last = performance.now()
    let t = 0
    let isVisible = true
    let pageVisible = !document.hidden
    const mobileQuery = window.matchMedia('(max-width: 800px)')
    let isActive = !mobileQuery.matches || root.closest('.personas-slide')?.classList.contains('is-active') === true
    const tick = (now: number) => {
      acc += Math.min(0.05, (now - last) / 1000)
      last = now
      let steps = 0
      while (acc >= STEP && steps < 8) {
        acc -= STEP
        steps++
        t += STEP
        if (drag) {
          const T = pts[iT]
          T.px = T.x
          T.py = T.y
          T.x += (drag.tx - T.x) * 0.35
          T.y += (drag.ty - T.y) * 0.35
        }
        const C = pts[iC]
        if (!reduced && !drag) {
          // a draught in the room, so the badge is never perfectly still
          C.x += (22 * Math.sin(t * 0.7) + 12 * Math.sin(t * 1.9)) * STEP * STEP
        }
        integrate(pts, STEP, GRAVITY, 0.992)
        solve(pts, links, ITER)
        const vx = (C.x - C.px) / STEP
        spinStep(spin, spinTarget, STEP, vx * 0.03 + (reduced ? 0 : 0.6 * Math.sin(t * 0.5)))
      }
      draw()
      place()
      if (isVisible && pageVisible && isActive) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = 0
      }
    }

    const syncLoop = () => {
      if (!isVisible || !pageVisible || !isActive) {
        cancelAnimationFrame(raf)
        raf = 0
        return
      }
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      syncLoop()
    }, { rootMargin: '160px' })
    const onVisibilityChange = () => {
      pageVisible = !document.hidden
      syncLoop()
    }
    const onSlideVisibility = (event: Event) => {
      isActive = !mobileQuery.matches || Boolean((event as CustomEvent<{ active?: boolean }>).detail?.active)
        if (isActive) {
          build()
          draw()
          place()
          if (mobileQuery.matches) resumeAutoHover()
          else pauseAutoHover()
      } else {
        pauseAutoHover()
      }
      syncLoop()
    }
    const onBreakpointChange = () => {
      isActive = !mobileQuery.matches || root.closest('.personas-slide')?.classList.contains('is-active') === true
      if (isActive) {
        build()
        draw()
        place()
        if (mobileQuery.matches) resumeAutoHover()
        else pauseAutoHover()
      } else {
        pauseAutoHover()
      }
      syncLoop()
    }
    visibilityObserver.observe(root)
    document.addEventListener('visibilitychange', onVisibilityChange)
    root.addEventListener('lanyard:visibility', onSlideVisibility)
    mobileQuery.addEventListener('change', onBreakpointChange)

    build()
    draw()
    place()
    if (isActive && mobileQuery.matches) {
      resumeAutoHover()
    } else {
      pauseAutoHover()
    }
    syncLoop()

    const observer = new ResizeObserver(() => {
      const widthChanged = Math.abs(root.clientWidth - W) >= 1
      const heightChanged = Math.abs(root.clientHeight - H) >= 1
      // Chrome changes the visual height while its mobile toolbar expands or
      // collapses. Do not rebuild the Verlet chain for that transient change.
      if (!widthChanged && (!heightChanged || mobileQuery.matches)) return
      build()
      draw()
      place()
    })
    observer.observe(root)



    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove('is-dragging')
      visibilityObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      root.removeEventListener('lanyard:visibility', onSlideVisibility)
      mobileQuery.removeEventListener('change', onBreakpointChange)
      if (autoHoverTimer !== undefined) window.clearInterval(autoHoverTimer)
      observer.disconnect();
      motionQuery.removeEventListener('change', onMotionChange);
      flipButton?.removeEventListener('click', onFlipClick);
      card.removeEventListener('mouseenter', pauseAutoHover);
      card.removeEventListener('mouseleave', resumeAutoHover);
      card.removeEventListener('focusin', pauseAutoHover);
      card.removeEventListener('focusout', resumeAutoHover);
      root.removeEventListener('lanyard:activate', onActivate);
      card.removeEventListener('keydown', onKeyDown);
      card.removeEventListener('pointerdown', onDown);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerup', onUp);
      card.removeEventListener('pointercancel', onUp);
    };
  }

  function mountBadges() {
    document.querySelectorAll<HTMLElement>('[data-lanyard-badge]').forEach((root) => {
      if (instances.has(root)) return;
      const destroy = initBadge(root);
      if (destroy) instances.set(root, destroy);
    });
  }

  mountBadges();
  document.addEventListener('astro:page-load', mountBadges);
  document.addEventListener('astro:before-swap', () => {
    for (const [root, destroy] of instances) {
      if (root.isConnected) destroy();
    }
    instances.clear();
  });
