import { useEffect, useState } from "react";
import { useAppShell } from "../../state/appShell";

export function AppBanner() {
  const { banner } = useAppShell();
  if (banner.kind === "hidden") {
    return <div id="appBanner" className="app-banner" hidden role="status" />;
  }
  if (banner.kind === "message") {
    return (
      <div
        id="appBanner"
        className="app-banner"
        role="status"
        data-variant={banner.variant}
      >
        {banner.message}
      </div>
    );
  }
  return (
    <div
      id="appBanner"
      className="app-banner"
      role="status"
      data-variant={banner.variant}
    >
      {banner.node}
    </div>
  );
}

export function OfflineBanner() {
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  return (
    <div
      id="offlineBanner"
      className="offline-banner"
      hidden={!offline}
      role="status"
      aria-live="polite"
    >
      Offline mode. You can keep studying with cached content.
    </div>
  );
}
