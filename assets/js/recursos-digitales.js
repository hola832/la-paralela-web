(() => {
  const previews = document.querySelectorAll('.digital-preview');
  const showColor = (preview, visible) => preview.setAttribute('aria-pressed', String(visible));
  const isTouch = event => event.pointerType === 'touch' || event.pointerType === 'pen';
  let press = null;

  const endPress = () => {
    if (!press) return;
    showColor(press.preview, false);
    press = null;
  };
  const endPointerPress = event => {
    if (event.pointerId === press?.pointerId) endPress();
  };

  previews.forEach(preview => {
    preview.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') showColor(preview, true);
    });
    preview.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse') showColor(preview, false);
      endPointerPress(event);
    });
    preview.addEventListener('pointerdown', event => {
      if (!isTouch(event) || !event.isPrimary || event.button !== 0) return;
      endPress();
      press = { preview, pointerId: event.pointerId };
      showColor(preview, true);
    }, { passive: true });
    preview.addEventListener('pointermove', event => {
      if (event.pointerId !== press?.pointerId) return;
      const { left, right, top, bottom } = preview.getBoundingClientRect();
      if (event.clientX < left || event.clientX > right ||
          event.clientY < top || event.clientY > bottom) endPress();
    }, { passive: true });
    preview.addEventListener('contextmenu', event => {
      if (press?.preview === preview || isTouch(event)) event.preventDefault();
    });
    preview.addEventListener('click', event => {
      // La activación por teclado o lector de pantalla puede alternar la vista.
      if (event.detail === 0 && !event.pointerType) {
        showColor(preview, preview.getAttribute('aria-pressed') !== 'true');
      }
    });
  });

  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => {
    document.addEventListener(type, endPointerPress, { capture: true, passive: true });
  });
  document.addEventListener('scroll', endPress, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) endPress();
  });
  window.addEventListener('blur', endPress);
})();
