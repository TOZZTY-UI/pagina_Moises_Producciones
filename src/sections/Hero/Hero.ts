import { gsap } from 'gsap';
import { playCameraFlash } from './HeroFlash';

const hero = document.querySelector<HTMLElement>('.hero');

if (hero && !hero.dataset.heroAnimationReady) {
  const initialHash = window.location.hash;
  if (initialHash) {
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`
    );
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  const sheen = hero.querySelector<HTMLElement>(
    '.hero__sheen'
  );

  const flash = hero.querySelector<HTMLElement>(
    '.hero__camera-flash'
  );

  const exposure = hero.querySelector<HTMLElement>(
    '.hero__camera-exposure'
  );

  const image = hero.querySelector<HTMLImageElement>(
    '.hero__image'
  );

  const title = hero.querySelector<HTMLElement>(
    '.hero__title-wrap'
  );

  const footer = hero.querySelector<HTMLElement>(
    '.hero__footer'
  );

  if (sheen && image && title && footer) {

    hero.dataset.heroAnimationReady = 'true';

    const media = gsap.matchMedia();

    const root = document.documentElement;
    const body = document.body;
    body.classList.add('hero-intro-pending');
    const cta = hero.querySelector<HTMLAnchorElement>('.hero__cta');
    let introFinished = false;
    let pendingLink: HTMLAnchorElement | undefined;

    const followSection = (link: HTMLAnchorElement) => {
      const target = document.getElementById(link.dataset.section || link.hash.slice(1));
      if (!target) return;

      if (location.hash !== link.hash) {
        history.pushState(history.state, '', location.pathname + location.search + link.hash);
      }
      target.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      });
    };

    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
      if (link !== cta && (introFinished || !link.dataset.section)) return;
      if (link.origin !== location.origin || link.pathname !== location.pathname) return;

      event.preventDefault();
      if (introFinished) followSection(link);
      else pendingLink = link;
    }, { capture: true });


    /* ========================================
       CONFIGURACIÓN DE LA ANIMACIÓN
    ======================================== */

    const config = {
      revealDuration: 1.8,
      zoomDuration: 2,
      zoomScale: 1.08,

      sheenFadeDuration: 0.2,

       titleStart: 2.05,
       titleDuration: 0.8,

       footerStart: 2.35,
      footerDuration: 0.75,
    };

    /* ========================================
       BLOQUEO DEL SCROLL
    ======================================== */

    const setScrollLock = (locked: boolean) => {
      root.classList.toggle(
        'hero-scroll-locked',
        locked
      );

      body.classList.toggle(
        'hero-scroll-locked',
        locked
      );
    };

    const finishIntro = () => {
      if (introFinished) return;
      introFinished = true;
      body.classList.remove('hero-intro-pending');
      hero.removeAttribute('data-hero-intro');
      setScrollLock(false);
      hero.dispatchEvent(new Event('hero:intro-complete'));
      if (pendingLink) {
        followSection(pendingLink);
        pendingLink = undefined;
      }
    };


    /* ========================================
       ACCESIBILIDAD
    ======================================== */

    media.add(
      '(prefers-reduced-motion: reduce)',
      () => {

        gsap.set(sheen, {
          autoAlpha: 0,
        });

        gsap.set(image, {
          clearProps: 'transform,opacity',
        });

        gsap.set([title, footer], {
          autoAlpha: 1,
          clearProps: 'filter,transform',
        });
        finishIntro();
      }
    );


    /* ========================================
       ANIMACIÓN PRINCIPAL
    ======================================== */

    media.add(
      '(prefers-reduced-motion: no-preference)',
      () => {
        if (introFinished) return;
        let disposed = false;
        let cameraFlashPlayback:
          ReturnType<typeof playCameraFlash> | undefined;
        let ambientFlashTimer: number | undefined;

        const playFlash = () => {
          if (disposed || !introFinished || document.hidden || !flash || !exposure) return;
          cameraFlashPlayback?.cancel();
          cameraFlashPlayback = playCameraFlash(flash, exposure, image);
        };

        const scheduleAmbientFlashes = () => {
          const scheduleNext = () => {
            if (disposed) return;

            const delay = 650 + Math.random() * 1800;
            ambientFlashTimer = window.setTimeout(() => {
              playFlash();
              scheduleNext();
            }, delay);
          };

          scheduleNext();
        };

        const shootCameraFlash = () => {
          const afterFlash = () => {
            if (disposed) return;
            finishIntro();
            scheduleAmbientFlashes();
          };
          cameraFlashPlayback = flash && exposure ? playCameraFlash(flash, exposure, image) : undefined;

          if (cameraFlashPlayback) {
            cameraFlashPlayback.finished.then(afterFlash, afterFlash);
          } else afterFlash();
        };

        setScrollLock(true);

        hero.setAttribute('data-hero-intro', '');


        /* ESTADOS INICIALES */

        gsap.set(hero, {
          '--hero-progress': 0,
        });

        gsap.set(sheen, {
          autoAlpha: 1,
        });

        gsap.set(title, {
          autoAlpha: 0,
          y: 18,
          filter: 'blur(8px)',
        });

        gsap.set(footer, {
          autoAlpha: 0,
          y: 14,
        });

        gsap.set(image, {
          scale: config.zoomScale,
          xPercent: -1.5,
          yPercent: 1,
        });


        /* TIMELINE */

        const timeline = gsap.timeline({
          paused: true,
          defaults: {
            ease: 'power3.out',
          },

          onComplete: () => {

            gsap.set(image, {
              clearProps: 'transform',
            });

            gsap.set([title, footer], {
              clearProps: 'filter,transform',
            });

            shootCameraFlash();
          },
        });


        timeline

          /* ========================================
             REVELADO Y DESTELLO SINCRONIZADOS
          ======================================== */

          .to(
            hero,
            {
              '--hero-progress': 1,

              duration: config.revealDuration,

              ease: 'none',
            },
            0
          )


          /* ========================================
             ZOOM CINEMATOGRÁFICO
          ======================================== */

          .to(
            image,
            {
              scale: 1,

              xPercent: 0,
              yPercent: 0,

              duration: config.zoomDuration,

              ease: 'power2.out',
            },
            0
          )


          /* ========================================
             DESAPARICIÓN DEL DESTELLO
          ======================================== */

          .to(
            sheen,
            {
              autoAlpha: 0,

              duration: config.sheenFadeDuration,

              ease: 'power1.out',
            },
            config.revealDuration
          )

          /* ========================================
             APARICIÓN DEL TÍTULO
          ======================================== */

          .to(
            title,
            {
              autoAlpha: 1,

              y: 0,

              filter: 'blur(0px)',

              duration: config.titleDuration,
            },
            config.titleStart
          )


          /* ========================================
             APARICIÓN DEL FOOTER
          ======================================== */

          .to(
            footer,
            {
              autoAlpha: 1,

              y: 0,

              duration: config.footerDuration,
            },
             config.footerStart
           );

        const waitingForLoader = () => root.dataset.preloaderFinished !== 'true' && !!document.getElementById('preloader');
        const startReveal = () => {
          if (!waitingForLoader() && !document.hidden && timeline.progress() < 1) timeline.play();
        };
        const handleVisibilityChange = () => {
          if (document.hidden) {
            timeline.pause();
          }
          else startReveal();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        if (waitingForLoader()) window.addEventListener('preloader:complete', startReveal, { once: true });
        else startReveal();

        /* LIMPIEZA */

        return () => {
          disposed = true;
          window.removeEventListener('preloader:complete', startReveal);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          cameraFlashPlayback?.cancel();
          if (ambientFlashTimer !== undefined) {
            window.clearTimeout(ambientFlashTimer);
          }
          timeline.kill();
          finishIntro();
        };

      }
    );

  } else {
    hero.removeAttribute('data-hero-intro');
  }
}
