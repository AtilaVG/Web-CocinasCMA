/* Página de contacto: validación accesible del formulario, envío (Formspree
   o mailto) y carga del mapa de Google solo cuando el visitante lo pide. */

const form = document.querySelector<HTMLFormElement>('[data-formulario]');

if (form) {
  const error = form.querySelector<HTMLElement>('[data-error]');
  const ok = document.querySelector<HTMLElement>('[data-ok]');
  const campo = (nombre: string) => form.elements.namedItem(nombre) as HTMLInputElement | null;

  function validar(): HTMLElement[] {
    const invalidos: HTMLElement[] = [];
    form!.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[required]').forEach((el) => {
      const vacio = el.type === 'checkbox' ? !(el as HTMLInputElement).checked : !el.value.trim();
      el.setAttribute('aria-invalid', String(vacio));
      if (vacio) invalidos.push(el);
    });
    const email = campo('email');
    if (email && email.value.trim() && !email.checkValidity()) {
      email.setAttribute('aria-invalid', 'true');
      invalidos.push(email);
    } else email?.removeAttribute('aria-invalid');
    return invalidos;
  }

  function mostrarError(texto: string) {
    if (!error) return;
    error.textContent = texto;
    error.hidden = !texto;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const invalidos = validar();
    if (invalidos.length) {
      const nombres = invalidos.map((el) => form.querySelector(`label[for="${el.id}"]`)?.textContent?.replace(/\s*\*\s*$/, '').trim());
      mostrarError(`Revisa estos campos: ${nombres.filter(Boolean).join(', ')}.`);
      invalidos[0].focus();
      return;
    }
    mostrarError('');

    const datos = new FormData(form);
    if (datos.get('_gotcha')) return; // spam

    const destino = form.dataset.formspree;
    const boton = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    if (destino) {
      boton?.setAttribute('disabled', '');
      try {
        const res = await fetch(destino, { method: 'POST', body: datos, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
        form.hidden = true;
        if (ok) {
          ok.hidden = false;
          ok.focus();
        }
      } catch {
        mostrarError('No hemos podido enviar el mensaje. Inténtalo de nuevo o llámanos por teléfono.');
      } finally {
        boton?.removeAttribute('disabled');
      }
      return;
    }

    // Sin servicio de envío: preparar el correo en el programa del visitante
    const texto = (k: string) => String(datos.get(k) ?? '').trim();
    const lineas = [`Nombre: ${texto('nombre')}`, `Teléfono: ${texto('telefono')}`];
    if (texto('email')) lineas.push(`Correo: ${texto('email')}`);
    if (texto('localidad')) lineas.push(`Localidad: ${texto('localidad')}`);
    lineas.push(`Me interesa: ${texto('interes')}`, '', texto('mensaje'));
    const cuerpo = lineas.join('\n');
    const asunto = `Consulta web: ${texto('interes')} (${texto('nombre')})`;
    window.location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    if (ok) {
      const h = ok.querySelector('h3');
      const p = ok.querySelector('p');
      if (h) h.textContent = 'Tu mensaje está listo en tu programa de correo.';
      if (p) p.textContent = 'Solo falta pulsar «Enviar». Si no se ha abierto, escríbenos a ' + form.dataset.email + ' o llámanos.';
      ok.hidden = false;
      ok.focus();
    }
  });

  // Quitar el aviso de error de un campo al corregirlo
  form.addEventListener('input', (e) => {
    const el = e.target as HTMLElement;
    if (el.getAttribute('aria-invalid') === 'true') el.removeAttribute('aria-invalid');
  });
}

// Mapa: se carga bajo demanda (rendimiento y cookies de terceros)
const mapa = document.querySelector<HTMLElement>('[data-mapa]');
mapa?.querySelector('[data-cargar-mapa]')?.addEventListener('click', () => {
  const iframe = document.createElement('iframe');
  iframe.src = mapa.dataset.src ?? '';
  iframe.title = 'Mapa: Cocinas CMA en Humanes de Madrid';
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'no-referrer-when-downgrade';
  iframe.allowFullscreen = true;
  mapa.replaceChildren(iframe);
  iframe.focus();
});
