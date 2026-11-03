/* Sin dependencias. La página y sus enlaces funcionan también sin JavaScript. */
(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  const mobile = window.matchMedia('(max-width: 960px)');
  if (toggle && nav) {
    toggle.hidden = false;
    const closeMenu = (returnFocus = false) => {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      if (returnFocus) toggle.focus();
    };
    document.documentElement.classList.add('has-menu');
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('.header-inner')) closeMenu();
    });
    document.addEventListener('focusin', event => {
      if (!event.target.closest('.header-inner')) closeMenu();
    });
    mobile.addEventListener('change', () => closeMenu());
  }

  const photographs = document.querySelectorAll('.brand-photo');
  if (photographs.length) {
    let pressedPhoto = null;
    let pressedPointer = null;
    const releasePhoto = () => {
      pressedPhoto?.classList.remove('is-color-revealed');
      pressedPhoto = null;
      pressedPointer = null;
    };
    photographs.forEach(photo => {
      const useMouse = event => {
        if (event.pointerType === 'mouse') photo.classList.remove('uses-touch');
      };
      photo.addEventListener('pointerenter', useMouse, { passive: true });
      photo.addEventListener('pointerdown', event => {
        const touch = event.pointerType === 'touch' || event.pointerType === 'pen';
        photo.classList.toggle('uses-touch', touch);
        if (!touch || !event.isPrimary || event.button !== 0) return;
        releasePhoto();
        pressedPhoto = photo;
        pressedPointer = event.pointerId;
        photo.classList.add('is-color-revealed');
      }, { passive: true });
      photo.addEventListener('pointermove', event => {
        useMouse(event);
        if (pressedPhoto !== photo || event.pointerId !== pressedPointer) return;
        const bounds = photo.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) releasePhoto();
      }, { passive: true });
      photo.addEventListener('pointerleave', event => {
        if (event.pointerId === pressedPointer) releasePhoto();
      }, { passive: true });
      photo.addEventListener('contextmenu', event => {
        if (pressedPhoto === photo || event.pointerType === 'touch' ||
            event.pointerType === 'pen') event.preventDefault();
      });
    });
    ['pointerup', 'pointercancel'].forEach(type => {
      document.addEventListener(type, event => {
        if (event.pointerId === pressedPointer) releasePhoto();
      }, { capture: true, passive: true });
    });
    document.addEventListener('scroll', releasePhoto, { capture: true, passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) releasePhoto();
    });
    window.addEventListener('blur', releasePhoto);
  }

  const brand = document.querySelector('[data-brand-animation]');
  if (brand) {
    const animation = brand.querySelector('video');
    const message = document.querySelector('.hero-copy .hero-message');
    const hero = brand.closest('.home-hero');
    const finalInkCentre = Number(brand.dataset.brandCenterY) || 0.5;
    const desktopHero = window.matchMedia('(min-width: 641px)');
    const alignFinalLogo = () => {
      if (!message || !desktopHero.matches) {
        brand.style.setProperty('--brand-offset-y', '0px');
        return;
      }
      const frame = brand.getBoundingClientRect();
      const textBlock = message.getBoundingClientRect();
      // Mover la caja completa mantiene intactos el vídeo y su respaldo.
      // Descontar el desplazamiento anterior evita acumularlo al redimensionar.
      const previousOffset = parseFloat(brand.style.getPropertyValue('--brand-offset-y')) || 0;
      const unshiftedTop = frame.top - previousOffset;
      const alignedTop = textBlock.top + textBlock.height / 2 - frame.height * finalInkCentre - 2;
      const safeTop = hero ? Math.max(hero.getBoundingClientRect().top + 8, alignedTop) : alignedTop;
      const offset = safeTop - unshiftedTop;
      brand.style.setProperty('--brand-offset-y', `${offset}px`);
    };
    const brandLayout = new ResizeObserver(alignFinalLogo);
    brandLayout.observe(brand);
    if (message) brandLayout.observe(message);
    window.addEventListener('resize', alignFinalLogo);
    document.fonts.ready.then(alignFinalLogo);
    alignFinalLogo();
    const showFinalLogo = () => {
      brand.classList.add('is-finished');
      animation.pause();
    };
    animation.muted = true;
    animation.defaultPlaybackRate = 1.25;
    animation.playbackRate = 1.25;
    animation.addEventListener('ended', showFinalLogo);
    animation.addEventListener('error', showFinalLogo);
    // Silenciosa, sin bucle ni controles. Si autoplay se bloquea, queda
    // el último fotograma extraído del vídeo, en el mismo marco.
    // A petición del usuario, esta animación breve de marca se mantiene
    // también en equipos que indican movimiento reducido. Solo una pasada.
    animation.play().catch(showFinalLogo);
  }

  document.querySelectorAll('[data-video]').forEach(shell => {
    const video = shell.querySelector('video');
    const button = shell.querySelector('.video-cover');
    const error = shell.querySelector('.video-error');
    video.muted = true;
    button.addEventListener('click', async event => {
      document.querySelectorAll('[data-video] video').forEach(other => {
        if (other !== video) other.pause();
      });
      if (!video.getAttribute('src')) {
        video.src = video.dataset.src;
      }
      // Cada arranque desde la portada es silencioso. Los controles nativos
      // permiten activar sonido y conservarlo al pausar/continuar ese vídeo.
      video.muted = true;
      shell.classList.add('is-active');
      video.removeAttribute('tabindex');
      video.removeAttribute('aria-hidden');
      // El ratón conserva el autoocultado normal de controles del navegador.
      if (event.detail === 0) video.focus({ preventScroll: true });
      error.hidden = true;
      try {
        await video.play();
      } catch (reason) {
        /* En dispositivos que bloquean play(), quedan los controles nativos. */
        if (video.error) error.hidden = false;
      }
    });
    video.addEventListener('play', () => {
      document.querySelectorAll('[data-video] video').forEach(other => {
        if (other !== video) other.pause();
      });
    });
    video.addEventListener('error', () => { error.hidden = false; });
    video.addEventListener('ended', () => {
      shell.classList.remove('is-active');
      video.setAttribute('tabindex', '-1');
      video.setAttribute('aria-hidden', 'true');
      if (document.activeElement === video) button.focus({ preventScroll: true });
    });
  });
})();
