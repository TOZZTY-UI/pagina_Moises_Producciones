import { gsap } from 'gsap';
import { playCameraFlash } from './HeroFlash';

const hero = document.querySelector<HTMLElement>('.hero');

if (hero && !hero.dataset.heroAnimationReady) {

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
    let hasPlayedFlash = false;
    const cta = hero.querySelector<HTMLAnchorElement>('.hero__cta');
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    cta?.addEventListener('click', (event) => {
      if (!cta.hash) return;

      const target = document.querySelector<HTMLElement>(cta.hash);
      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: reduceMotion.matches ? 'auto' : 'smooth',
        block: 'start',
      });

      history.pushState(null, '', cta.hash);
    });


    /* ========================================
       CONFIGURACIÓN DE LA ANIMACIÓN
    ======================================== */

    const config = {
      revealDuration: 1.8,
      zoomDuration: 2,
      zoomScale: 1.08,

      sheenFadeDuration: 0.2,

      titleStart: 1.85,
      titleDuration: 0.8,

      footerStart: 2.15,
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


    /* ========================================
       ACCESIBILIDAD
    ======================================== */

    media.add(
      '(prefers-reduced-motion: reduce)',
      () => {

        setScrollLock(false);

        hero.removeAttribute('data-hero-intro');

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
      }
    );


    /* ========================================
       ANIMACIÓN PRINCIPAL
    ======================================== */

    media.add(
      '(prefers-reduced-motion: no-preference)',
      () => {
        let cameraFlashPlayback:
          ReturnType<typeof playCameraFlash> | undefined;

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
          filter: 'blur(16px)',
        });

        gsap.set(footer, {
          autoAlpha: 0,
          y: 26,
        });

        gsap.set(image, {
          scale: config.zoomScale,
          xPercent: -1.5,
          yPercent: 1,
        });


        /* TIMELINE */

        const timeline = gsap.timeline({

          defaults: {
            ease: 'power3.out',
          },

          onComplete: () => {

            hero.removeAttribute('data-hero-intro');

            gsap.set(image, {
              clearProps: 'transform',
            });

            gsap.set([title, footer], {
              clearProps: 'filter,transform',
            });

            if (flash && exposure && !hasPlayedFlash) {
              cameraFlashPlayback = playCameraFlash(
                flash,
                exposure,
                image
              );
              hasPlayedFlash = Boolean(cameraFlashPlayback);

              if (cameraFlashPlayback) {
                cameraFlashPlayback.finished.then(
                  () => setScrollLock(false),
                  () => setScrollLock(false)
                );
              } else {
                setScrollLock(false);
              }
            } else {
              setScrollLock(false);
            }
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


        /* LIMPIEZA */

        return () => {
          cameraFlashPlayback?.cancel();
          setScrollLock(false);
          timeline.kill();

          hero.removeAttribute('data-hero-intro');

          setScrollLock(false);
        };

      }
    );

  } else {
    hero.removeAttribute('data-hero-intro');
  }
}
