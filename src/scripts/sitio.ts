/* Comportamiento común a todas las páginas: cabecera, menú móvil y
   animaciones suaves al hacer scroll. */

// Cabecera: se vuelve opaca al bajar
const cabecera = document.querySelector<HTMLElement>('[data-cabecera]');
if (cabecera) {
  // En la portada con intro animada, la cabecera sigue transparente mientras dura la intro
  const intro = document.querySelector<HTMLElement>('[data-intro]');
  const umbral = () =>
    intro && document.documentElement.classList.contains('anima')
      ? intro.offsetHeight - window.innerHeight * 0.9
      : 24;
  const actualizar = () => cabecera.classList.toggle('is-scrolled', window.scrollY > umbral());
  actualizar();
  window.addEventListener('scroll', actualizar, { passive: true });
}

// Menú móvil (dialog modal)
const menu = document.querySelector<HTMLDialogElement>('[data-menu]');
const abrir = document.querySelector<HTMLButtonElement>('[data-abrir-menu]');
if (menu && abrir) {
  abrir.addEventListener('click', () => {
    menu.showModal();
    abrir.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
  });
  menu.addEventListener('close', () => {
    abrir.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
  });
  menu.querySelector('[data-cerrar-menu]')?.addEventListener('click', () => menu.close());
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => menu.close()));
  // Si se agranda la ventana con el menú abierto, se cierra
  window.matchMedia('(min-width: 64em)').addEventListener('change', (e) => {
    if (e.matches && menu.open) menu.close();
  });
}

// Animaciones al entrar en pantalla
const revelables = document.querySelectorAll<HTMLElement>('[data-reveal]');
const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (sinMovimiento || !('IntersectionObserver' in window)) {
  revelables.forEach((el) => el.classList.add('is-visible'));
} else {
  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('is-visible');
          observador.unobserve(entrada.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0 },
  );
  revelables.forEach((el) => observador.observe(el));
}
