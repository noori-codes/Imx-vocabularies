import { useAppShell } from "../../state/appShell";

export function Toast() {
  const { toast } = useAppShell();
  if (!toast) return null;
  return (
    <div
      id="speakToast"
      className={`speak-toast is-visible${toast.isError ? " is-error" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {toast.message}
    </div>
  );
}
