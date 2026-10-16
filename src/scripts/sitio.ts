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

// Texto que se "pinta" palabra a palabra al hacer scroll ([data-pintar])
const pintables = document.querySelectorAll<HTMLElement>('[data-pintar]');
if (pintables.length && document.documentElement.classList.contains('anima')) {
  const grupos = [...pintables].map((el) => {
    const palabras: HTMLElement[] = [];
    const recorrer = (nodo: Node) => {
      for (const hijo of [...nodo.childNodes]) {
        if (hijo.nodeType === Node.TEXT_NODE) {
          const trozos = (hijo.textContent ?? '').split(/(\s+)/);
          const frag = document.createDocumentFragment();
          for (const t of trozos) {
            if (!t) continue;
            if (/^\s+$/.test(t)) {
              frag.append(t);
            } else {
              const span = document.createElement('span');
              span.className = 'palabra';
              span.textContent = t;
              palabras.push(span);
              frag.append(span);
            }
          }
          hijo.replaceWith(frag);
        } else if (hijo.nodeType === Node.ELEMENT_NODE) {
          recorrer(hijo);
        }
      }
    };
    recorrer(el);
    el.classList.add('is-pintable');
    return { el, palabras, encendidas: -1 };
  });

  let pendiente = false;
  const pintar = () => {
    pendiente = false;
    const alto = window.innerHeight;
    for (const g of grupos) {
      const caja = g.el.getBoundingClientRect();
      // Empieza cuando el texto entra por abajo y termina cuando llega a un tercio de la pantalla
      const inicio = alto * 0.9;
      const fin = alto * 0.35;
      const p = Math.min(1, Math.max(0, (inicio - caja.top) / (inicio - fin + caja.height * 0.5)));
      const n = Math.round(p * g.palabras.length);
      if (n === g.encendidas) continue;
      g.palabras.forEach((w, i) => w.classList.toggle('is-on', i < n));
      g.encendidas = n;
    }
  };
  const pedir = () => {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(pintar);
    }
  };
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
  pintar();
}
