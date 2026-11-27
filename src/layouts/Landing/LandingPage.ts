import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const curtain = document.querySelector('#page-curtain');
let animating = false;
let curtainAnimation: Animation | null = null;

const resetCurtain = () => {
  if (!curtain) return;

  curtainAnimation?.cancel();
  curtainAnimation = null;
  curtain.style.clipPath = 'polygon(-60% 0, -30% 0, -5% 100%, -60% 100%)';
  animating = false;
};

// pageshow también se dispara cuando el navegador restaura la página
// desde el back-forward cache. La cortina no debe conservar el estado
// cubierto de la navegación anterior.
window.addEventListener('pageshow', resetCurtain);

  const revealSections = () => {
    const sections = document.querySelectorAll<HTMLElement>('[data-stagger-reveal]');
    if (!sections.length) return;

    const motion = gsap.matchMedia();

    motion.add('(prefers-reduced-motion: no-preference)', () => {
      const scrollSections = document.querySelectorAll<HTMLElement>(
        'main[data-section-scroller] > section:not(.personas-carousel)',
      );

      scrollSections.forEach((section) => {
        const transition = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.7,
            invalidateOnRefresh: true,
          },
        });

        transition
          .fromTo(
            section,
            { autoAlpha: 0.45 },
            { autoAlpha: 1, duration: 0.42, ease: 'power2.out' },
          )
          .to(
            section,
            { autoAlpha: 0.58, duration: 0.58, ease: 'none' },
          );
      });

      sections.forEach((section) => {
        const items = section.querySelectorAll<HTMLElement>('[data-reveal-item]');
        if (!items.length) return;
        const personasIntro = section.matches('.personas-carousel');
        gsap.from(items, {
          opacity: 0,
          y: personasIntro ? 28 : 32,
          duration: personasIntro ? 0.7 : 0.8,
          ease: 'power3.out',
          stagger: personasIntro ? 0.2 : 0.12,
          clearProps: 'transform',
          scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            end: 'bottom 18%',
            toggleActions: 'play none none none',
            invalidateOnRefresh: true,
          },
        });
      });

      ScrollTrigger.refresh();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      revealSections();
    }, { once: true });
  } else {
    revealSections();
  }

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
      curtainAnimation = curtain.animate(
        [{ clipPath: initial }, { clipPath: covered }],
        {
          duration,
          easing: 'cubic-bezier(0.77, 0, 0.18, 1)',
          fill: 'forwards',
        },
      );
      await Promise.race([
        curtainAnimation.finished,
        new Promise<void>((resolve) => { fallback = window.setTimeout(resolve, duration + 150); }),
      ]);
    } catch {
      // A cancelled transition must not prevent navigation.
    } finally {
      window.clearTimeout(fallback);
      window.location.href = destination.href;
    }
  });
