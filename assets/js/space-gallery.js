/* Visor nativo y sin dependencias. Sin JavaScript, los enlaces abren la foto. */
(() => {
  const viewer = document.querySelector('[data-space-viewer]');
  const photos = [...document.querySelectorAll('[data-space-photo]')];
  if (!viewer || !photos.length || typeof viewer.showModal !== 'function') return;

  const image = viewer.querySelector('[data-viewer-image]');
  const close = viewer.querySelector('[data-viewer-close]');
  const previous = viewer.querySelector('[data-viewer-prev]');
  const next = viewer.querySelector('[data-viewer-next]');
  const count = viewer.querySelector('[data-viewer-count]');
  const error = viewer.querySelector('[data-viewer-error]');
  const stage = viewer.querySelector('.space-viewer-stage');
  if (!image || !close || !previous || !next || !count || !error || !stage) return;

  let current = 0;
  let opener = null;
  let request = 0;
  let backdropPressed = false;

  const showPhoto = index => {
    current = (index + photos.length) % photos.length;
    const selection = photos[current];
    const version = ++request;
    image.hidden = true;
    error.hidden = true;
    image.alt = selection.querySelector('img')?.alt || '';
    count.textContent = `${current + 1} / ${photos.length}`;
    stage.setAttribute('aria-busy', 'true');
    image.onload = () => {
      if (version !== request || !viewer.open) return;
      image.hidden = false;
      stage.setAttribute('aria-busy', 'false');
    };
    image.onerror = () => {
      if (version !== request || !viewer.open) return;
      error.hidden = false;
      stage.setAttribute('aria-busy', 'false');
    };
    // La versión ampliada solo se solicita al abrirla o cambiar de fotografía.
    image.src = selection.href;
  };

  photos.forEach((photo, index) => {
    photo.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
          event.ctrlKey || event.shiftKey || event.altKey) return;
      const touch = event.detail > 0 && (event.pointerType === 'touch' ||
        event.pointerType === 'pen' || photo.classList.contains('uses-touch'));
      // Tocar la fotografía revela su color mientras se mantiene pulsada.
      // La flecha conserva el acceso al visor; Enter y la activación asistida
      // siguen abriendo la imagen completa desde el enlace.
      if (touch && !event.target.closest('.space-expand')) {
        event.preventDefault();
        return;
      }
      try {
        viewer.showModal();
      } catch {
        return; // Si el visor no se puede abrir, el enlace sigue funcionando.
      }
      event.preventDefault();
      opener = photo;
      document.documentElement.classList.add('space-viewer-open');
      showPhoto(index);
      close.focus({ preventScroll: true });
    });
  });

  close.addEventListener('click', () => viewer.close());
  previous.addEventListener('click', () => showPhoto(current - 1));
  next.addEventListener('click', () => showPhoto(current + 1));
  previous.disabled = next.disabled = photos.length < 2;

  viewer.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    // Mantiene el ciclo dentro de los tres controles también en navegadores
    // que permiten saltar desde el diálogo a la barra del navegador.
    if (event.key === 'Tab') {
      const last = next.disabled ? close : next;
      if (event.shiftKey && document.activeElement === close) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        close.focus();
      }
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
    // Escape y el fondo inerte pertenecen al diálogo nativo del navegador.
  });

  const isBackdrop = event => {
    const rect = viewer.getBoundingClientRect();
    return event.target === viewer && (event.clientX < rect.left ||
      event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
  };
  viewer.addEventListener('pointerdown', event => {
    backdropPressed = isBackdrop(event);
  });
  viewer.addEventListener('click', event => {
    if (backdropPressed && isBackdrop(event)) viewer.close();
    backdropPressed = false;
  });
  viewer.addEventListener('close', () => {
    ++request;
    document.documentElement.classList.remove('space-viewer-open');
    image.onload = image.onerror = null;
    image.removeAttribute('src');
    image.alt = '';
    image.hidden = true;
    error.hidden = true;
    stage.setAttribute('aria-busy', 'false');
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
    backdropPressed = false;
  });
})();
