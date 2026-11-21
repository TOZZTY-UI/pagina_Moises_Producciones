
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

  class ResizableNavbar extends HTMLElement {
    private controller?: AbortController;
    private scrollFrame = 0;
    private sectionTriggers: ScrollTrigger[] = [];

  connectedCallback() {
    this.controller?.abort();
    this.sectionTriggers.forEach((trigger) => trigger.kill());
    this.sectionTriggers = [];
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

      const links = this.querySelectorAll<HTMLAnchorElement>(".nav-link");
      const allSectionLinks = this.querySelectorAll<HTMLAnchorElement>(
        "[data-section]"
      );
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );
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

      // Marca en el menú la sección que cruza el centro de la pantalla.
      const moveIndicator = (link: HTMLElement, show = true) => {
        if (!indicator) return;

        gsap.to(indicator, {
          width: link.offsetWidth,
          x: link.offsetLeft,
          autoAlpha: show ? 1 : 0,
          duration: reduceMotion.matches ? 0 : 0.7,
          ease: "power4.out",
          overwrite: "auto",
        });
      };

      let activeSection = "";

      const setActiveSection = (sectionId: string) => {
        if (activeSection === sectionId) return;
        activeSection = sectionId;

        allSectionLinks.forEach((link) => {
          const isActive = link.dataset.section === sectionId;
          link.classList.toggle("is-active", isActive);

          if (isActive) {
            link.setAttribute("aria-current", "page");
          } else {
            link.removeAttribute("aria-current");
          }
        });

        const desktopLink = this.querySelector<HTMLAnchorElement>(
          `.nav-link[data-section="${sectionId}"]`
        );

        if (desktopLink) moveIndicator(desktopLink);
      };

      const sectionLinks = Array.from(links).filter(
        (link) => link.dataset.section
      );

      const setInitialSection = () => {
        const marker = window.scrollY + window.innerHeight * 0.55;
        const visibleSections = sectionLinks
          .map((link) => {
            const sectionId = link.dataset.section;
            const section = sectionId
              ? document.getElementById(sectionId)
              : null;

            return section && sectionId && section.offsetTop <= marker
              ? { sectionId, top: section.offsetTop }
              : null;
          })
          .filter(
            (entry): entry is { sectionId: string; top: number } =>
              entry !== null
          )
          .sort((a, b) => b.top - a.top)[0];

        if (visibleSections) {
          setActiveSection(visibleSections.sectionId);
        }
      };

      // Se actualiza en ambas direcciones para que Inicio también se active
      // correctamente al volver hacia arriba desde Personas.
      this.sectionTriggers.push(
        ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: () => {
            setInitialSection();
          },
        })
      );

      setInitialSection();
      ScrollTrigger.refresh();

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
        if (activeSection) {
          const activeLink = this.querySelector<HTMLAnchorElement>(
            `.nav-link[data-section="${activeSection}"]`
          );

          if (activeLink) {
            moveIndicator(activeLink);
            return;
          }
        }

        gsap.to(indicator, {
          autoAlpha: 0,
          duration: reduceMotion.matches ? 0 : 0.18,
          overwrite: "auto",
        });
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

      reduceMotion.addEventListener(
        "change",
        () => {
          if (activeSection) {
            const activeLink = this.querySelector<HTMLAnchorElement>(
              `.nav-link[data-section="${activeSection}"]`
            );

            if (activeLink) moveIndicator(activeLink);
          }
        },
        { signal }
      );
    }

    disconnectedCallback() {
      // Evita dejar una actualización pendiente al desmontar el menú.
      cancelAnimationFrame(this.scrollFrame);
      this.scrollFrame = 0;
      this.sectionTriggers.forEach((trigger) => trigger.kill());
      this.sectionTriggers = [];
      this.controller?.abort();
    }
  }

  if (!customElements.get("resizable-navbar")) {
    customElements.define(
      "resizable-navbar",
      ResizableNavbar
    );
  }
