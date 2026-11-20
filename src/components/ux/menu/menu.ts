
  class ResizableNavbar extends HTMLElement {
    private controller?: AbortController;
    private scrollFrame = 0;

    connectedCallback() {
      this.controller?.abort();
      this.controller = new AbortController();

      const { signal } = this.controller;

      const toggle =
        this.querySelector<HTMLButtonElement>(".menu-toggle");

      const mobileMenu =
        this.querySelector<HTMLElement>(".mobile-menu");

      const navLinks =
        this.querySelector<HTMLElement>(".nav-links");

      const indicator =
        this.querySelector<HTMLElement>(".nav-indicator");

      const links =
        this.querySelectorAll<HTMLAnchorElement>(".nav-link");

      // Contraer el navbar al hacer scroll
      const updateScroll = () => {
        if (this.scrollFrame) return;
        this.scrollFrame = window.requestAnimationFrame(() => {
          this.scrollFrame = 0;
          this.toggleAttribute("data-scrolled", window.scrollY > 100);
        });
      };

      window.addEventListener("scroll", updateScroll, {
        passive: true,
        signal,
      });

      updateScroll();

      // Abrir y cerrar menú móvil
      const setOpen = (open: boolean) => {
        this.toggleAttribute("data-open", open);

        toggle?.setAttribute("aria-expanded", String(open));

        toggle?.setAttribute(
          "aria-label",
          open ? "Cerrar menú" : "Abrir menú"
        );

        if (mobileMenu) {
          mobileMenu.inert = !open;
        }
      };

      setOpen(false);

      toggle?.addEventListener(
        "click",
        () => {
          setOpen(!this.hasAttribute("data-open"));
        },
        { signal }
      );

      // Cerrar al seleccionar un enlace
      mobileMenu?.querySelectorAll("a").forEach((link) => {
        link.addEventListener(
          "click",
          () => setOpen(false),
          { signal }
        );
      });

      // Cerrar haciendo clic fuera
      document.addEventListener(
        "pointerdown",
        (event) => {
          if (
            event.target instanceof Node &&
            !this.contains(event.target) &&
            this.hasAttribute("data-open")
          ) {
            setOpen(false);
          }
        },
        { signal }
      );

      // Cerrar con Escape
      document.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key === "Escape" &&
            this.hasAttribute("data-open")
          ) {
            setOpen(false);
            toggle?.focus();
          }
        },
        { signal }
      );

      // Indicador animado al pasar sobre un enlace
      const moveIndicator = (link: HTMLElement) => {
        if (!indicator) return;

        indicator.style.width = `${link.offsetWidth}px`;

        indicator.style.transform =
          `translateX(${link.offsetLeft}px)`;

        indicator.style.opacity = "1";
      };

      links.forEach((link) => {
        link.addEventListener(
          "pointerenter",
          () => moveIndicator(link),
          { signal }
        );

        link.addEventListener(
          "focus",
          () => moveIndicator(link),
          { signal }
        );
      });

      const hideIndicator = () => {
        if (indicator) {
          indicator.style.opacity = "0";
        }
      };

      navLinks?.addEventListener(
        "pointerleave",
        hideIndicator,
        { signal }
      );

      navLinks?.addEventListener(
        "focusout",
        (event) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !navLinks.contains(event.relatedTarget)
          ) {
            hideIndicator();
          }
        },
        { signal }
      );

      // Restablecer menú al cambiar a escritorio
      const desktop = window.matchMedia("(min-width: 901px)");

      desktop.addEventListener(
        "change",
        () => {
          if (desktop.matches) setOpen(false);
        },
        { signal }
      );
    }

    disconnectedCallback() {
      // Evita dejar una actualización pendiente al desmontar el menú.
      cancelAnimationFrame(this.scrollFrame);
      this.scrollFrame = 0;
      this.controller?.abort();
    }
  }

  if (!customElements.get("resizable-navbar")) {
    customElements.define(
      "resizable-navbar",
      ResizableNavbar
    );
  }
