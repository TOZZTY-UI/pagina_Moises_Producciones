  const loader = document.getElementById("preloader");
  const word = document.getElementById("loader-word");

  if (loader && word) {
    const words = [
      "Hola",
      "Hello",
      "Bienvenidos",
      "a",
      "SaxEventos Producciones"
    ];

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const started = performance.now();
    let index = 0;
    const displayDuration = 3500;

    // La preferencia de movimiento reducido desactiva las transiciones,
    // pero no debe impedir que el texto del preloader cambie.
    const ticker = window.setInterval(() => {
      word.classList.add("out");

      window.setTimeout(() => {
        index = (index + 1) % words.length;
        word.textContent = words[index];
        word.classList.remove("out");
      }, 180);
    }, 750);

    function finish() {
      const delay = Math.max(
        0,
        displayDuration - (performance.now() - started)
      );

      window.setTimeout(() => {
        clearInterval(ticker);
        loader?.classList.add("hide");

        if (!reduced) {
          const path = loader?.querySelector("path");
          const start = performance.now();

          function morph(time) {
            const progress = Math.min(1, (time - start) / 1000);
            const curve = 180 * (1 - progress);
            path?.setAttribute("d", `M0 0 H100 Q50 ${curve} 0 0 Z`);

            if (progress < 1) requestAnimationFrame(morph);
          }

          requestAnimationFrame(morph);
        }

        // Entrega la pantalla al hero cuando la cortina ya ha salido.
        Promise.allSettled(loader.getAnimations().map((animation) => animation.finished)).then(() => {
          loader.remove();
          document.documentElement.style.overflow = previousOverflow;
          document.documentElement.dataset.preloaderFinished = 'true';
          window.dispatchEvent(new CustomEvent('preloader:complete'));
        });
      }, delay);
    }

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
    }
  }
