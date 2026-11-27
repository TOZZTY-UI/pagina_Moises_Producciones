"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";

import socialLinks from "../../../data/socialLinks.json";
import "./navigation-menu.css";

export interface NavigationMenuItem {
  name: string;
  href: string;
  sectionId?: string;
}

export interface ResponsiveNavbarProps {
  items: NavigationMenuItem[];
  compact?: boolean;
}

export function ResponsiveNavbar({
  items,
  compact = false,
}: ResponsiveNavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isWide, setIsWide] = React.useState(false);
  const [pathname, setPathname] = React.useState("");
  const [activeHref, setActiveHref] = React.useState("");
  const [isHidden, setIsHidden] = React.useState(false);
  const [isInPersonas, setIsInPersonas] = React.useState(false);
  const rootRef = React.useRef<HTMLElement>(null);
  const menuRef = React.useRef<HTMLElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const menuId = React.useId().replaceAll(":", "");

  const visibleItems = compact
    ? items.filter((item) => !item.sectionId)
    : items;
  const contactItem = visibleItems.find((item) => item.href === "/contacto");
  const navigationItems = visibleItems.filter(
    (item) => item.href !== "/contacto",
  );

  React.useEffect(() => {
    const media = window.matchMedia("(min-width: 901px)");
    let previousScrollY = window.scrollY;

    const syncLayout = () => {
      setIsWide(media.matches);
      if (media.matches) setIsOpen(false);
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > previousScrollY;

      if (currentScrollY <= 12 || !scrollingDown) {
        setIsHidden(false);
      } else if (currentScrollY > 80) {
        setIsHidden(true);
        setIsOpen(false);
      }

      previousScrollY = currentScrollY;
    };

    syncLayout();
    setPathname(window.location.pathname);
    setActiveHref(
      window.location.hash
        ? `${window.location.pathname}${window.location.hash}`
        : "",
    );
    media.addEventListener("change", syncLayout);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("hashchange", () => {
      setActiveHref(`${window.location.pathname}${window.location.hash}`);
    });

    return () => {
      media.removeEventListener("change", syncLayout);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  React.useEffect(() => {
    const personasSection = document.querySelector("#personas");
    if (!personasSection) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInPersonas(entry.isIntersecting),
      { threshold: 0.1 },
    );

    observer.observe(personasSection);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const sectionItems = visibleItems.filter((item) => item.sectionId);
    const sections = sectionItems
      .map((item) => ({
        item,
        element: document.getElementById(item.sectionId as string),
      }))
      .filter(
        (
          section,
        ): section is {
          item: NavigationMenuItem & { sectionId: string };
          element: HTMLElement;
        } => Boolean(section.element),
      );

    if (!sections.length) return;

    let frame = 0;

    const syncActiveSection = () => {
      frame = 0;
      const marker = window.innerHeight * 0.45;
      const activeSection = sections
        .filter(({ element }) => {
          const rect = element.getBoundingClientRect();
          return rect.top <= marker && rect.bottom >= marker;
        })
        .at(-1);

      const nextHash =
        activeSection && activeSection.item.sectionId !== "inicio"
          ? `#${activeSection.item.sectionId}`
          : "";
      const nextActiveHref = activeSection
        ? `${window.location.pathname}#${activeSection.item.sectionId}`
        : "";

      if (window.location.hash !== nextHash) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${nextHash}`,
        );
      }

      setActiveHref((current) =>
        current === nextActiveHref ? current : nextActiveHref,
      );
    };

    const requestSync = () => {
      if (!frame) frame = window.requestAnimationFrame(syncActiveSection);
    };

    syncActiveSection();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
    };
  }, [visibleItems]);

  React.useEffect(() => {
    if (menuRef.current) {
      menuRef.current.inert = !isWide && !isOpen;
    }
  }, [isOpen, isWide]);

  React.useEffect(() => {
    if (!isOpen || isWide) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        menuButtonRef.current?.focus({ preventScroll: true });
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isWide]);

  const isCurrentItem = (item: NavigationMenuItem) => {
    if (item.sectionId) {
      return activeHref === `${pathname}#${item.sectionId}`;
    }
    if (item.href.includes("#")) return activeHref === item.href;
    return Boolean(pathname && !activeHref && item.href === pathname);
  };

  const closeAfterNavigation = (item: NavigationMenuItem) => {
    setActiveHref(
      item.sectionId
        ? `${window.location.pathname}#${item.sectionId}`
        : item.href.includes("#")
          ? item.href
          : "",
    );
    setIsOpen(false);
  };

  return (
    <header
      className="site-header"
      data-hidden={isHidden || isInPersonas}
      ref={rootRef}
    >
      <div className="site-header__inner">
        <button
          ref={menuButtonRef}
          className="menu-toggle"
          type="button"
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isWide || isOpen}
          aria-controls={menuId}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav
          ref={menuRef}
          id={menuId}
          className="site-nav"
          data-open={isOpen}
          aria-label="Navegación principal"
        >
          <ul className="site-nav__list">
            {navigationItems.map((item) => (
              <li key={`${item.name}-${item.href}`}>
                <a
                  className="site-nav__link"
                  href={item.href}
                  data-section={item.sectionId}
                  aria-current={
                    isCurrentItem(item)
                      ? item.href.includes("#")
                        ? "location"
                        : "page"
                      : undefined
                  }
                  onClick={() => closeAfterNavigation(item)}
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ul>

          {contactItem && (
            <a
              className="site-contact"
              href={contactItem.href}
              aria-current={
                isCurrentItem(contactItem) ? "page" : undefined
              }
              onClick={() => closeAfterNavigation(contactItem)}
            >
              {contactItem.name}
            </a>
          )}

          {socialLinks.length > 0 && (
            <ul className="dcf-bar__social" aria-label="Redes sociales">
              {socialLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.url}
                    aria-label={link.name}
                    title={link.name}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span
                      className="social-icon"
                      dangerouslySetInnerHTML={{ __html: link.icon }}
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </div>
    </header>
  );
}
