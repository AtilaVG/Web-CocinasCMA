/* Galería de proyectos: filtros por estilo y acabado (sincronizados con la
   URL, p. ej. ?estilo=moderno&acabado=laca-brillo) y visor de fotos accesible
   (teclado, gestos y foco). Sin JS, cada foto enlaza a su versión grande. */

const galeria = document.querySelector<HTMLElement>('[data-galeria]');

if (galeria) {
  const piezas = [...galeria.querySelectorAll<HTMLLIElement>('[data-pieza]')];
  const chips = [...galeria.querySelectorAll<HTMLButtonElement>('[data-filtro]')];
  const resultado = galeria.querySelector<HTMLElement>('[data-resultado]');
  const vacio = galeria.querySelector<HTMLElement>('[data-vacio]');
  const filtros = { estilo: '', acabado: '' };

  type Filtro = keyof typeof filtros;

  const valoresValidos = (tipo: Filtro) =>
    new Set(chips.filter((c) => c.dataset.filtro === tipo).map((c) => c.dataset.valor ?? ''));

  // Estado inicial desde la URL
  const params = new URLSearchParams(location.search);
  for (const tipo of Object.keys(filtros) as Filtro[]) {
    const valor = params.get(tipo) ?? '';
    if (valoresValidos(tipo).has(valor)) filtros[tipo] = valor;
  }

  function aplicar(animar = false) {
    let visibles = 0;
    for (const pieza of piezas) {
      const okEstilo = !filtros.estilo || (pieza.dataset.estilos ?? '').split(' ').includes(filtros.estilo);
      const okAcabado = !filtros.acabado || (pieza.dataset.acabados ?? '').split(' ').includes(filtros.acabado);
      const visible = okEstilo && okAcabado;
      pieza.hidden = !visible;
      if (visible) {
        visibles++;
        if (animar) {
          pieza.classList.remove('is-entrando');
          void pieza.offsetWidth;
          pieza.classList.add('is-entrando');
        }
      }
    }
    for (const chip of chips) {
      const tipo = chip.dataset.filtro as Filtro;
      chip.setAttribute('aria-pressed', String(filtros[tipo] === (chip.dataset.valor ?? '')));
    }
    if (resultado) {
      resultado.textContent = visibles === 1 ? '1 proyecto' : `${visibles} proyectos`;
    }
    if (vacio) vacio.hidden = visibles > 0;

    const url = new URL(location.href);
    for (const tipo of Object.keys(filtros) as Filtro[]) {
      if (filtros[tipo]) url.searchParams.set(tipo, filtros[tipo]);
      else url.searchParams.delete(tipo);
    }
    history.replaceState(null, '', url);
  }

  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      filtros[chip.dataset.filtro as Filtro] = chip.dataset.valor ?? '';
      aplicar(true);
    }),
  );

  galeria.querySelector('[data-limpiar]')?.addEventListener('click', () => {
    filtros.estilo = '';
    filtros.acabado = '';
    aplicar(true);
  });

  aplicar();

  // ---- Visor ----
  const visor = document.querySelector<HTMLDialogElement>('[data-visor]');
  const imagen = visor?.querySelector<HTMLImageElement>('[data-visor-img]');
  const titulo = visor?.querySelector<HTMLElement>('[data-visor-titulo]');
  const meta = visor?.querySelector<HTMLElement>('[data-visor-meta]');
  const contador = visor?.querySelector<HTMLElement>('[data-visor-contador]');
  let actual = 0;

  const enlacesVisibles = () =>
    piezas
      .filter((p) => !p.hidden)
      .map((p) => p.querySelector<HTMLAnchorElement>('[data-abrir]'))
      .filter((a): a is HTMLAnchorElement => a !== null);

  function mostrar(indice: number) {
    const enlaces = enlacesVisibles();
    if (!visor || !imagen || enlaces.length === 0) return;
    actual = (indice + enlaces.length) % enlaces.length;
    const enlace = enlaces[actual];
    imagen.src = enlace.href;
    imagen.alt = enlace.querySelector('img')?.alt ?? '';
    if (titulo) titulo.textContent = enlace.dataset.titulo ?? '';
    if (meta) meta.textContent = enlace.dataset.meta ?? '';
    if (contador) contador.textContent = `${actual + 1} / ${enlaces.length}`;
    const unaSola = enlaces.length < 2;
    visor.querySelectorAll<HTMLElement>('.visor__nav').forEach((b) => (b.hidden = unaSola));
    // Precarga de las vecinas
    [actual - 1, actual + 1].forEach((i) => {
      const vecina = enlaces[(i + enlaces.length) % enlaces.length];
      if (vecina) new Image().src = vecina.href;
    });
  }

  if (visor && imagen) {
    galeria.addEventListener('click', (e) => {
      const enlace = (e.target as Element).closest<HTMLAnchorElement>('[data-abrir]');
      if (!enlace || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      mostrar(enlacesVisibles().indexOf(enlace));
      visor.showModal();
      document.documentElement.style.overflow = 'hidden';
    });

    visor.addEventListener('close', () => {
      document.documentElement.style.overflow = '';
      imagen.removeAttribute('src');
    });

    visor.querySelector('[data-visor-cerrar]')?.addEventListener('click', () => visor.close());
    visor.querySelector('[data-visor-prev]')?.addEventListener('click', () => mostrar(actual - 1));
    visor.querySelector('[data-visor-next]')?.addEventListener('click', () => mostrar(actual + 1));

    visor.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') mostrar(actual - 1);
      if (e.key === 'ArrowRight') mostrar(actual + 1);
    });

    // Cerrar al pulsar fuera de la foto
    visor.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t === visor || t.classList.contains('visor__marco')) visor.close();
    });

    // Gestos en móvil
    let inicioX = 0;
    visor.addEventListener('touchstart', (e) => (inicioX = e.touches[0].clientX), { passive: true });
    visor.addEventListener(
      'touchend',
      (e) => {
        const dx = e.changedTouches[0].clientX - inicioX;
        if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1));
      },
      { passive: true },
    );
  }
}
