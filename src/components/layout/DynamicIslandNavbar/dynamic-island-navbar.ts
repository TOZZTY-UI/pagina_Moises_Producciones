const nav = document.querySelector<HTMLElement>('[data-island-nav]');
  const menu = nav?.querySelector<HTMLElement>('[data-island-menu]');
  const dragHandle = nav?.querySelector<HTMLElement>('[data-drag-handle]');

  if (nav && menu && dragHandle) {
    const isMobile = window.matchMedia(
      '(max-width: 520px), (hover: none), (pointer: coarse)',
    ).matches;
    const widthDuration = 700;
    const heightDuration = 700;
    const closeDuration = 700;
    let phaseTimer: number | undefined;
    let closeTimer: number | undefined;

    const setOpen = (open: boolean) => {
      window.clearTimeout(phaseTimer);
      window.clearTimeout(closeTimer);
      nav.dataset.open = String(open);
      nav.setAttribute('aria-expanded', String(open));

      if (open) {
        nav.dataset.phase = 'expanding-width';
        phaseTimer = window.setTimeout(() => {
          nav.dataset.phase = 'expanding-height';
          phaseTimer = window.setTimeout(() => {
            nav.dataset.phase = 'open';
          }, heightDuration);
        }, widthDuration);
      } else {
        nav.dataset.phase = 'closing-height';
        closeTimer = window.setTimeout(() => {
          nav.dataset.phase = 'closing-width';
          closeTimer = window.setTimeout(() => {
            delete nav.dataset.phase;
          }, closeDuration);
        }, closeDuration);
      }
    };

    if (!isMobile) {
      nav.addEventListener('mouseenter', () => {
        setOpen(true);
      });

      nav.addEventListener('mouseleave', () => {
        setOpen(false);
      });
    }

    if (isMobile) {
      dragHandle.addEventListener('click', (event) => {
        if ((event.target as HTMLElement).closest('a')) return;
        setOpen(nav.dataset.open !== 'true');
      });

      document.addEventListener('pointerdown', (event) => {
        if (nav.dataset.open === 'true' && !nav.contains(event.target as Node)) {
          setOpen(false);
        }
      });
    }

    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    nav.querySelectorAll<HTMLAnchorElement>('[data-nav-link]').forEach((link) => {
      const linkPath = new URL(link.href).pathname.replace(/\/$/, '') || '/';
      if (linkPath === currentPath) {
        link.dataset.active = 'true';
        link.setAttribute('aria-current', 'page');
      }
    });
  }
