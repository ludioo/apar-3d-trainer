export function openModal(dialog, onClose) {
  if (dialog.open) return;
  const trigger = document.activeElement;
  dialog.onclick = (e) => {
    if (e.target === dialog) dialog.close();
  };
  dialog.onkeydown = (event) => {
    if (event.key !== 'Tab') return;
    const items = [...dialog.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')]
      .filter((el) => el.tabIndex >= 0 && !el.disabled && el.getClientRects().length);
    const first = items[0];
    const last = items.at(-1);
    const active = document.activeElement;
    if (!items.includes(active) || (event.shiftKey ? active === first : active === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
    }
  };
  dialog.addEventListener('close', () => {
    if (trigger?.isConnected && trigger.getClientRects().length && !trigger.disabled) trigger.focus({ preventScroll: true });
    onClose?.();
  }, { once: true });
  dialog.showModal();
}

export function closeModal(dialog) {
  dialog.close();
}
