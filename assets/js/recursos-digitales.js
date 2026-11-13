/* La misma entrada por puntero que las fotos de la web, con un cambio persistente al tocar. */
document.querySelectorAll('.digital-preview').forEach(preview => {
  const setColor = visible => preview.setAttribute('aria-pressed', String(visible));
  let touchPress = false;

  preview.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') setColor(true);
  });
  preview.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse') setColor(false);
  });
  preview.addEventListener('pointerdown', event => {
    touchPress = event.pointerType === 'touch' || event.pointerType === 'pen';
  }, { passive: true });
  preview.addEventListener('click', event => {
    if (touchPress || event.detail === 0) {
      setColor(preview.getAttribute('aria-pressed') !== 'true');
    }
  });
});
