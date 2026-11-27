const galleries = document.querySelectorAll<HTMLElement>(".photo-gallery");

galleries.forEach((gallery) => {
  const dialog = gallery.querySelector<HTMLDialogElement>("[data-gallery-dialog]");
  const dialogImage = gallery.querySelector<HTMLImageElement>("[data-gallery-dialog-image]");
  const triggers = gallery.querySelectorAll<HTMLButtonElement>("[data-gallery-trigger]");

  if (!dialog || !dialogImage) return;

  gallery.addEventListener("contextmenu", (event) => {
    if ((event.target as Element).closest("img")) {
      event.preventDefault();
    }
  });

  gallery.addEventListener("dragstart", (event) => {
    if ((event.target as Element).closest("img")) {
      event.preventDefault();
    }
  });

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      dialogImage.src = trigger.dataset.gallerySrc ?? "";
      dialogImage.alt = trigger.dataset.galleryAlt ?? "";
      dialog.showModal();
    });
  });

  // Fallback para navegadores que aún no soportan closedby="any".
  if (!("closedBy" in HTMLDialogElement.prototype)) {
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside =
        event instanceof MouseEvent &&
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside) dialog.close();
    });
  }

  dialog.addEventListener("close", () => {
    dialogImage.src = "";
    dialogImage.alt = "";
  });
});
