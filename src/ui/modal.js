export function openModal(dialog, onClose) {
  if (dialog.open) return;
  dialog.onclick = (e) => {
    if (e.target === dialog) dialog.close();
  };
  dialog.addEventListener('close', () => onClose?.(), { once: true });
  dialog.showModal();
}

export function closeModal(dialog) {
  dialog.close();
}
