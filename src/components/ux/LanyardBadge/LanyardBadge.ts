  // El código se ejecuta en el navegador y no necesita React ni client:load.
// #region physics
type Pt = { x: number; y: number; px: number; py: number; w: number }
type Link = [number, number, number]

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

/** How far the card swings from hanging straight down, in radians. Right is positive. */
function swingAngle(top: Pt, bottom: Pt) {
  return Math.atan2(bottom.x - top.x, bottom.y - top.y)
}
// #endregion
const DISPLAY = '"Oswald", "Bebas Neue", "Arial Narrow", Impact, sans-serif'
const SCRIPT = '"Segoe Script", "Brush Script MT", "Snell Roundhand", cursive'
const ROPE_FRAME_MS = 1000 / 50

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
    const frontFace = root.querySelector<HTMLElement>('.badge-front');
    const backFace = root.querySelector<HTMLElement>('.badge-back');
    const flipButton = root.querySelector<HTMLButtonElement>('.flip-button');
    const flipLabel = root.querySelector<HTMLElement>('[data-flip-label]');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !card || !ctx) return;
    if (backFace) backFace.inert = true;

    const cw = Number(root.dataset.cardWidth || 240);
    const ch = Math.round(cw * 1.5);
    const ringR = Math.max(7, Math.round(cw * 0.036));
    const clipH = Math.round(cw * 0.1);
    const look = {
      strapText: root.dataset.strapText || '',
      strapLabel: root.dataset.strapLabel || '',
      strapColor: root.dataset.strapColor || '#161516',
      cordColor: root.dataset.cordColor || '#ffffff',
      inkColor: root.dataset.inkColor || '#B38E59'
    };
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 800px)');
    const section = root.closest<HTMLElement>('.personas-carousel');
    const slide = root.closest('.personas-slide');
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
    let canvasX = 0
    let canvasY = 0
    let expanded = false
    let ink: { x: number; y: number; width: number; height: number } | undefined

    const resizeCanvas = (acrossSection: boolean) => {
      expanded = acrossSection && !!section
      let width = W
      let height = H
      canvasX = canvasY = 0
      if (expanded && section) {
        // Only the bitmap changes coordinate space. The pins and pointer stay
        // in badge coordinates, so the cord can follow across every column.
        const area = section.getBoundingClientRect()
        const origin = root.getBoundingClientRect()
        canvasX = area.left - origin.left
        canvasY = area.top - origin.top
        width = area.width
        height = area.height
      }
      const pxWidth = Math.ceil(width * dpr)
      const pxHeight = Math.ceil(height * dpr)
      if (canvas.width !== pxWidth) canvas.width = pxWidth
      if (canvas.height !== pxHeight) canvas.height = pxHeight
      canvas.style.left = `${canvasX}px`
      canvas.style.top = `${canvasY}px`
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }
    let strapTex: HTMLCanvasElement | null = null
    let plainTex: HTMLCanvasElement | null = null
    const tug = { x: 0, v: 0, target: 0, updatedAt: -Infinity }

    const add = (x: number, y: number, w: number) => {
      pts.push({ x, y, px: x, py: y, w })
      return pts.length - 1
    }
    const strand = (from: number, to: number, n: number) => {
      const a = pts[from]
      const b = pts[to]
      const rest = Math.hypot(b.x - a.x, b.y - a.y) / n
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
      tug.x = tug.v = tug.target = 0
      tug.updatedAt = -Infinity
      resizeCanvas(false)

      pts = []
      links = []
      const cx = W / 2
      const spread = Math.min(W * 0.16, cw * 0.55)
      const top = -sw * 2
      // hang the buckle so the whole card fits, but never above a sixth of the frame
      const bY = Math.max(H * 0.16, Math.min(H * 0.42, H - (lowLen + ringR * 2 + clipH + ch) - 28))

      const aL = add(cx - spread, top, 0)
      iB = add(cx, bY, 1.4)
      const l = strand(aL, iB, N)
      const aR = add(cx + spread, top, 0)
      const r = strand(aR, iB, N)
      iT = add(cx, bY + lowLen, 0.8)
      const lo = strand(iB, iT, 3)
      iC = add(cx, bY + lowLen + arm, 0.25)
      links.push([iT, iC, arm])
      left = l.ids
      right = r.ids
      low = lo.ids
      strandRest = l.rest

      const c = look
      const opts = { color: c.cordColor, ink: c.inkColor, text: c.strapText, label: c.strapLabel }
      strapTex = makeStrap(strandRest * N + 4, sw, dpr, opts)
      plainTex = makeStrap(lowLen + 4, sw * 0.8, dpr, { ...opts, plain: true })
    }

    const STEP = 1 / 90
    const GRAVITY = 2400
    const ITER = 12

    const movePins = (now: number) => {
      const target = now - tug.updatedAt < 64 ? tug.target : 0
      // Spring only the two pinned points. Gravity and the rope constraints
      // transfer that motion to the buckle and lastly to the card.
      tug.v += ((target - tug.x) * 400 - tug.v * 34) * STEP
      tug.x += tug.v * STEP
      const spread = Math.min(W * 0.16, cw * 0.55)
      const center = W / 2 + tug.x
      const height = -sw * 2 - Math.abs(tug.x) * 0.2
      const aL = pts[left[0]]
      const aR = pts[right[0]]
      aL.x = center - spread
      aR.x = center + spread
      aL.y = aR.y = height
    }

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
        ctx.setTransform(nx, ny, tx * k, ty * k, (a.x - canvasX) * dpr - (nx * Wt) / 2 - tx * k * v0, (a.y - canvasY) * dpr - (ny * Wt) / 2 - ty * k * v0)
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
      g.addColorStop(0, "#f7f7f7")
      g.addColorStop(0.35, "#9b9b9b")
      g.addColorStop(0.5, "#ffffff")
      g.addColorStop(0.7, "#777777")
      g.addColorStop(1, "#f7f7f7")
      return g
    }

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      if (ink) ctx.clearRect(ink.x, ink.y, ink.width, ink.height)
      if (!strapTex || !plainTex) return
      // Erase only the previous cord on the next frame, even on a wide drag.
      // The card's centre of mass is simulated but is never drawn on the canvas.
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (let i = 0; i < iC; i++) {
        const p = pts[i]
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
      }
      const pad = sw * 2
      ink = {
        x: Math.floor((minX - pad - canvasX) * dpr),
        y: Math.floor((minY - pad - canvasY) * dpr),
        width: Math.ceil((maxX - minX + pad * 2) * dpr) + 1,
        height: Math.ceil((maxY - minY + pad * 2) * dpr) + 1,
      }
      ctx.imageSmoothingEnabled = true
      ribbon(left, strapTex, strandRest, -1)
      ribbon(right, strapTex, strandRest, 1)
      ribbon(low, plainTex, (lowLen * 1) / 3, 0)

      // side-release buckle, turned to follow the short strap
      const B = pts[iB]
      const T = pts[iT]
      const ang = Math.atan2(T.x - B.x, T.y - B.y)
      const u = sw / 20
      ctx.setTransform(dpr, 0, 0, dpr, (B.x - canvasX) * dpr, (B.y - canvasY) * dpr)
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
      ctx.setTransform(dpr, 0, 0, dpr, (T.x - canvasX) * dpr, (T.y + ringR * 0.8 - canvasY) * dpr)
      ctx.lineWidth = Math.max(2.5, ringR * 0.38)
      ctx.strokeStyle = metal(-ringR, -ringR, ringR, ringR)
      ctx.beginPath()
      ctx.arc(0, 0, ringR, 0, Math.PI * 2)
      ctx.stroke()

      const swing = swingAngle(T, pts[iC])
      card.style.transform = `translate(${(T.x - cw / 2).toFixed(2)}px, ${(T.y + ringR).toFixed(2)}px) rotate(${(-swing).toFixed(4)}rad)`
    }

    // ---- interaction -----------------------------------------------------
    type Drag = { id: number; startX: number; startY: number; pinX: number; pinY: number; tx: number; ty: number; active: boolean }
    let drag: Drag | null = null
    const flip = () => {
      const flipped = card.classList.toggle('is-flipped')
      if (frontFace) frontFace.inert = flipped
      if (backFace) backFace.inert = !flipped
      flipButton?.setAttribute("aria-pressed", String(flipped))
      if (flipLabel) flipLabel.textContent = flipped ? "Mostrar frente" : "Mostrar reverso"
    }
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || !e.isPrimary || drag) return
      if ((e.target as Element).closest("a, button")) return
      const T = pts[iT]
      drag = { id: e.pointerId, startX: e.pageX, startY: e.pageY, pinX: T.x, pinY: T.y, tx: T.x, ty: T.y, active: false }
      card.setPointerCapture(e.pointerId)
    }
    const clearPointer = () => {
      if (!drag) return
      const { id, active } = drag
      drag = null
      if (active) pts[iT].w = 0.8
      root.classList.remove('is-dragging')
      if (card.hasPointerCapture(id)) card.releasePointerCapture(id)
    }
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return
      const dx = e.pageX - drag.startX
      const dy = e.pageY - drag.startY
      if (!drag.active) {
        const touch = e.pointerType === 'touch'
        if (Math.hypot(dx, dy) < (touch ? 8 : 5)) return
        if (mobileQuery.matches || (touch && Math.abs(dy) > Math.abs(dx))) {
          clearPointer() // Let the native carousel or page scroll handle the swipe.
          return
        }
        drag.active = true
        pts[iT].w = 0
        if (!expanded) resizeCanvas(true)
        root.classList.add('is-dragging')
      }
      drag.tx = drag.pinX + dx
      drag.ty = drag.pinY + dy
      wake()
    }
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return
      const wasDragging = drag.active
      clearPointer()
      if (wasDragging) {
        if (motionQuery.matches) rebuild()
        else wake() // Let the badge swing back before retiring the wide canvas.
      } else if (e.type === 'pointerup') {
        flip()
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target !== card) return
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        flip()
      }
    }
    // ---- loop --------------------------------------------------------------
    let raf = 0
    let acc = 0
    let last = 0
    let nextFrame = 0
    let quietFor = 0
    let moving = false
    let isVisible = false
    const slideActive = () => !mobileQuery.matches || !slide || slide.classList.contains('is-active')
    let isActive = slideActive()
    const canRun = (now: number) => isVisible && !document.hidden && (isActive || now - tug.updatedAt < 500)
    const stopFrames = () => {
      cancelAnimationFrame(raf)
      raf = 0
      root.classList.remove('is-moving')
    }
    const tick = () => {
      const now = performance.now()
      raf = 0
      if (!canRun(now)) {
        stopFrames()
        return
      }
      if (now < nextFrame) {
        raf = requestAnimationFrame(tick)
        return
      }
      // Skip missed drawing slots rather than painting a burst of catch-up frames.
      nextFrame += (Math.floor((now - nextFrame) / ROPE_FRAME_MS) + 1) * ROPE_FRAME_MS
      acc += Math.max(0, Math.min(0.05, (now - last) / 1000))
      last = now
      const mobile = mobileQuery.matches
      let steps = 0
      while (acc >= STEP) {
        acc -= STEP
        steps++
        if (mobile) movePins(now)
        if (drag?.active) {
          const T = pts[iT]
          T.px = T.x
          T.py = T.y
          T.x += (drag.tx - T.x) * 0.35
          T.y += (drag.ty - T.y) * 0.35
        }
        integrate(pts, STEP, GRAVITY, mobile ? 0.948 : drag?.active ? 0.992 : 0.972)
        solve(pts, links, ITER)
      }
      if (steps) {
        const T = pts[iT]
        const atTarget = !drag?.active || Math.abs(drag.tx - T.x) + Math.abs(drag.ty - T.y) < 0.15
        const pinsStill = !mobile || (now - tug.updatedAt > 64 && Math.abs(tug.x) < 0.1 && Math.abs(tug.v) < 0.5)
        const still = atTarget && pinsStill && pts.every(p => !p.w || Math.abs(p.x - p.px) + Math.abs(p.y - p.py) < 0.07)
        // Require several quiet steps: a pendulum is also still for one instant at its apex.
        quietFor = still ? quietFor + steps * STEP : 0
        if (quietFor >= 0.2) {
          moving = false
          root.classList.remove('is-moving')
          if (expanded && !drag?.active) resizeCanvas(false)
        }
        draw()
      }
      if (moving) raf = requestAnimationFrame(tick)
    }

    const syncLoop = () => {
      if (!moving || !canRun(performance.now())) return stopFrames()
      if (!raf) {
        root.classList.add('is-moving')
        last = performance.now()
        nextFrame = last
        acc = 0
        raf = requestAnimationFrame(tick)
      }
    }
    const wake = () => {
      moving = true
      quietFor = 0
      if (!raf) syncLoop()
    }
    const rebuild = () => {
      clearPointer()
      stopFrames()
      moving = false
      build()
      draw()
    }
    const syncVisibility = () => {
      const visible = isVisible && !document.hidden
      root.classList.toggle('can-preview', visible && isActive && mobileQuery.matches)
      if (!visible && expanded) rebuild()
      else if (!visible) clearPointer()
      syncLoop()
    }

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      syncVisibility()
    })
    const onPull = (event: Event) => {
      if (motionQuery.matches || !mobileQuery.matches) return
      const offset = (event as CustomEvent<{ offset: number }>).detail.offset
      tug.target = offset
      tug.updatedAt = performance.now()
      wake()
    }
    const onSlideVisibility = () => {
      isActive = slideActive()
      syncVisibility()
    }
    const onBreakpointChange = () => {
      rebuild()
      onSlideVisibility()
    }
    const onMotionChange = () => {
      if (motionQuery.matches && (moving || expanded)) rebuild()
    }
    card.addEventListener('keydown', onKeyDown)
    flipButton?.addEventListener('click', flip)
    card.addEventListener('pointerdown', onDown)
    card.addEventListener('pointermove', onMove)
    card.addEventListener('pointerup', onUp)
    card.addEventListener('pointercancel', onUp)
    card.addEventListener('lostpointercapture', onUp)
    visibilityObserver.observe(root)
    document.addEventListener('visibilitychange', syncVisibility)
    root.addEventListener('lanyard:pull', onPull)
    root.addEventListener('lanyard:visibility', onSlideVisibility)
    mobileQuery.addEventListener('change', onBreakpointChange)
    motionQuery.addEventListener('change', onMotionChange)

    build()
    draw()

    const observer = new ResizeObserver(() => {
      const widthChanged = Math.abs(root.clientWidth - W) >= 1
      const heightChanged = Math.abs(root.clientHeight - H) >= 1
      // Chrome changes the visual height while its mobile toolbar expands or
      // collapses. Do not rebuild the Verlet chain for that transient change.
      if (!widthChanged && (!heightChanged || mobileQuery.matches)) return
      rebuild()
    })
    observer.observe(root)



    return () => {
      clearPointer()
      stopFrames()
      visibilityObserver.disconnect()
      document.removeEventListener('visibilitychange', syncVisibility)
      root.removeEventListener('lanyard:pull', onPull)
      root.removeEventListener('lanyard:visibility', onSlideVisibility)
      mobileQuery.removeEventListener('change', onBreakpointChange)
      observer.disconnect();
      motionQuery.removeEventListener('change', onMotionChange);
      flipButton?.removeEventListener('click', flip);
      card.removeEventListener('keydown', onKeyDown);
      card.removeEventListener('pointerdown', onDown);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerup', onUp);
      card.removeEventListener('pointercancel', onUp);
      card.removeEventListener('lostpointercapture', onUp);
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
