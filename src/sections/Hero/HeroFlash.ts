// Centro del panel blanco del flash, medido en píxeles sobre cada foto original.
const flashPoint = { x: 564 / 1672, y: 149 / 941 };
const mobileFlashPoint = { x: 318 / 941, y: 447 / 1672 };
const tabletFlashPoint = { x: 603 / 1586, y: 140 / 992 };

export function playCameraFlash(
  flash: HTMLElement,
  exposure: HTMLElement,
  image: HTMLImageElement
) {
  const { naturalWidth, naturalHeight } = image;
  if (document.hidden || !image.complete || !naturalWidth || !naturalHeight) return;

  const photo = image.getBoundingClientRect();
  // <picture> usa una composición distinta en móvil, tablet y escritorio.
  const point = window.matchMedia('(max-width: 600px)').matches
    ? mobileFlashPoint
    : window.matchMedia('(max-width: 1100px)').matches
      ? tabletFlashPoint
      : flashPoint;
  const [positionX, positionY] = getComputedStyle(image).objectPosition
    .split(/\s+/)
    .map((percent) => Number.parseFloat(percent) / 100);

  // Aplica el mismo recorte que object-fit: cover para apuntar al cabezal.
  const scale = Math.max(photo.width / naturalWidth, photo.height / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  const x = (photo.width - width) * positionX + width * point.x;
  const y = (photo.height - height) * positionY + height * point.y;
  const screenY = photo.top + y;

  if (!(x > 0 && x < photo.width && y > 0 && y < photo.height &&
    screenY > 0 && screenY < window.innerHeight)) return;

  const centerX = `${x}px`;
  const centerY = `${y}px`;
  flash.style.left = centerX;
  flash.style.top = centerY;
  flash.style.setProperty('--hero-flash-diameter', `${width * 0.18}px`);
  exposure.style.setProperty('--hero-flash-x', centerX);
  exposure.style.setProperty('--hero-flash-y', centerY);

  const timing = { delay: 180, duration: 360 };
  const peak = 0.1;
  const glow = flash.animate([
    { opacity: 0, transform: 'scale(0.72)', easing: 'ease-out' },
    { offset: peak, opacity: 1, transform: 'scale(1)', easing: 'ease-out' },
    { opacity: 0, transform: 'scale(1.18)' },
  ], timing);
  const wash = exposure.animate([
    { opacity: 0, easing: 'ease-out' },
    { offset: peak, opacity: 0.78, easing: 'ease-out' },
    { offset: 0.58, opacity: 0 },
    { opacity: 0 },
  ], timing);

  return {
    finished: Promise.all([
      glow.finished,
      wash.finished,
    ]).then(() => undefined),
    cancel: () => {
      glow.cancel();
      wash.cancel();
    },
  };
}
