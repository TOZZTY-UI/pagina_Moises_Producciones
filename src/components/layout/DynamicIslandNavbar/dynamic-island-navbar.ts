  const nav = document.querySelector<HTMLElement>('[data-island-nav]');
  const toggle = nav?.querySelector<HTMLButtonElement>('[data-island-toggle]');
  const menu = nav?.querySelector<HTMLElement>('[data-island-menu]');

  if (nav && toggle && menu) {
    const widthDuration = 700;
    const heightDuration = 700;
    const closeDuration = 700;
    let phaseTimer: number | undefined;
    let closeTimer: number | undefined;

    const setOpen = (open: boolean) => {
      window.clearTimeout(phaseTimer);
      window.clearTimeout(closeTimer);
      nav.dataset.open = String(open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar navegación' : 'Abrir navegación');

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

    toggle.addEventListener('click', () => setOpen(nav.dataset.open !== 'true'));

    nav.addEventListener('mouseenter', () => {
      setOpen(true);
    });

    nav.addEventListener('mouseleave', () => {
      setOpen(false);
    });

    nav.addEventListener('focusin', () => setOpen(true));

    nav.addEventListener('focusout', (event) => {
      if (!nav.contains(event.relatedTarget as Node)) setOpen(false);
    });

    document.addEventListener('click', (event) => {
      if (!nav.contains(event.target as Node)) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.focus();
      }
    });

    nav.querySelectorAll<HTMLAnchorElement>('[data-nav-link], .island-nav__contact').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });

    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    nav.querySelectorAll<HTMLAnchorElement>('[data-nav-link]').forEach((link) => {
      const linkPath = new URL(link.href).pathname.replace(/\/$/, '') || '/';
      if (linkPath === currentPath) {
        link.dataset.active = 'true';
        link.setAttribute('aria-current', 'page');
      }
    });
  }
