import { useEffect, useRef } from "react";
import { useAppShell } from "../../state/appShell";

export function ModalHost() {
  const { modal, closeModal } = useAppShell();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modal) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    const first = panelRef.current?.querySelector<HTMLElement>(
      "input, textarea, select, button",
    );
    first?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [modal, closeModal]);

  if (!modal) return null;

  return (
    <div id="modalRoot" className="modal">
      <div className="modal__backdrop" onClick={closeModal} data-close-modal />
      <div
        className="modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
        ref={panelRef}
      >
        <div className="modal__header">
          <h2 id="modalTitle">{modal.title}</h2>
          <button
            type="button"
            className="icon-btn"
            data-close-modal
            aria-label="Close dialog"
            onClick={closeModal}
          >
            <span className="ui-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 7l10 10M17 7 7 17"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </button>
        </div>
        <div id="modalBody" className="modal__body">
          {modal.content}
        </div>
      </div>
    </div>
  );
}
