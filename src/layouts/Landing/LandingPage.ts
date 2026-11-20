  const curtain = document.querySelector('#page-curtain');
  let animating = false;

  document.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest('a[href]');
    if (!(link instanceof HTMLAnchorElement) || link.target === '_blank') return;
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.origin !== window.location.origin || link.hasAttribute('download')) return;

    const destination = new URL(link.href);
    if (destination.pathname === window.location.pathname && destination.hash) return;
    if (!curtain || animating) return;

    event.preventDefault();
    if (document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.location.href = destination.href;
      return;
    }

    animating = true;

    const isBackward = link.dataset.transitionDirection === 'backward'
      || (destination.pathname === '/' && !destination.hash);
    const initial = isBackward
      ? 'polygon(160% 0, 130% 0, 105% 100%, 160% 100%)'
      : 'polygon(-60% 0, -30% 0, -5% 100%, -60% 100%)';
    const covered = isBackward
      ? 'polygon(160% 0, -30% 0, -55% 100%, 160% 100%)'
      : 'polygon(-60% 0, 130% 0, 155% 100%, -60% 100%)';

    curtain.style.clipPath = initial;
    const duration = 650;
    let fallback: number | undefined;
    try {
      const animation = curtain.animate(
        [{ clipPath: initial }, { clipPath: covered }],
        {
          duration,
          easing: 'cubic-bezier(0.77, 0, 0.18, 1)',
          fill: 'forwards',
        },
      );
      await Promise.race([
        animation.finished,
        new Promise<void>((resolve) => { fallback = window.setTimeout(resolve, duration + 150); }),
      ]);
    } catch {
      // A cancelled transition must not prevent navigation.
    } finally {
      window.clearTimeout(fallback);
      window.location.href = destination.href;
    }
  });
