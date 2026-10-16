/* Intro de la portada: las puertas se abren (o el vídeo avanza) según el
   scroll dentro de la sección. Sin movimiento reducido, nada de esto corre:
   el CSS muestra directamente la cocina con el texto. */

const intro = document.querySelector<HTMLElement>('[data-intro]');
const escena = intro?.querySelector<HTMLElement>('[data-intro-escena]');
const animar = document.documentElement.classList.contains('anima');

const limitar = (v: number) => Math.min(1, Math.max(0, v));
const suave = (t: number) => 1 - Math.pow(1 - t, 3);
const entrada = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

if (intro && escena && animar) {
  const canvas = intro.querySelector<HTMLCanvasElement>('[data-intro-canvas]');
  const fotogramas = canvas ? cargarFotogramas(canvas) : null;

  let pendiente = false;
  let ultimo = -1;

  const pintar = () => {
    pendiente = false;
    const caja = intro.getBoundingClientRect();
    const recorrido = caja.height - window.innerHeight;
    const p = recorrido > 0 ? limitar(-caja.top / recorrido) : 1;
    if (Math.abs(p - ultimo) < 0.0005) return;
    ultimo = p;

    const abrir = entrada(limitar((p - 0.04) / 0.6));
    const zoom = suave(limitar(p / 0.8));
    escena.style.setProperty('--abrir', abrir.toFixed(4));
    escena.style.setProperty('--zoom', zoom.toFixed(4));
    intro.classList.toggle('is-abierta', p > (fotogramas ? 0.82 : 0.55));
    intro.classList.toggle('is-empezada', p > 0.02);
    fotogramas?.mostrar(p);
  };

  const pedir = () => {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(pintar);
    }
  };

  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', () => {
    ultimo = -1;
    fotogramas?.redimensionar();
    pedir();
  });
  pintar();
}

/** Secuencia de fotogramas pintada en un canvas (vídeo controlado por el scroll). */
function cargarFotogramas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  const base = canvas.dataset.base ?? '';
  const total = Number(canvas.dataset.total ?? 0);
  const ext = canvas.dataset.ext ?? 'webp';
  if (!ctx || total < 2) return null;

  const imagenes: HTMLImageElement[] = [];
  let actual = 0;

  for (let i = 0; i < total; i++) {
    const img = new Image();
    img.decoding = 'async';
    img.src = `${base}/${String(i + 1).padStart(4, '0')}.${ext}`;
    img.onload = () => {
      if (i === actual) dibujar(i);
    };
    imagenes.push(img);
  }

  function redimensionar() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(canvas.clientHeight * ratio);
    dibujar(actual);
  }

  function dibujar(i: number) {
    // Si el fotograma no ha llegado, se usa el último cargado anterior
    let n = i;
    while (n > 0 && !imagenes[n]?.complete) n--;
    const img = imagenes[n];
    if (!img?.complete || !img.naturalWidth || !ctx) return;
    const escala = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = img.naturalWidth * escala;
    const h = img.naturalHeight * escala;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    canvas.classList.add('is-lista');
  }

  redimensionar();

  return {
    redimensionar,
    mostrar(p: number) {
      const i = Math.round(p * (total - 1));
      if (i !== actual) {
        actual = i;
        dibujar(i);
      }
    },
  };
}
