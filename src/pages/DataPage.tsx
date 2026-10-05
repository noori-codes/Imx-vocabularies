import { useState } from "react";
import { useLibrary } from "../state/libraryStore";
import { useAppShell } from "../state/appShell";

export async function forceClearAppCacheAndReload() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn("Cache clear failed", error);
  }
  const url = new URL(window.location.href);
  url.searchParams.set("v", String(Date.now()));
  window.location.replace(url.toString());
}

export function DataPage() {
  const { exportBackup, importBackup, importCsv, restoreBuiltInLibrary } = useLibrary();
  const { showToast, setBanner } = useAppShell();
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [importStatus, setImportStatus] = useState("");
  const [csvStatus, setCsvStatus] = useState("");
  const [forceStatus, setForceStatus] = useState("");

  return (
    <section id="data" className="page page--active">
      <div className="page-header">
        <div>
          <p className="eyebrow">Backup</p>
          <h2>Export &amp; import</h2>
        </div>
      </div>

      <div className="data-grid">
        <article className="data-card">
          <h3>Export library</h3>
          <p>
            Download your custom words, topics, idioms, favorites, deletions, and quiz progress as
            a JSON backup.
          </p>
          <button
            id="exportBtn"
            className="primary-btn"
            type="button"
            onClick={() => {
              exportBackup();
              setBanner({ kind: "hidden" });
              showToast("Backup downloaded");
            }}
          >
            Download backup
          </button>
        </article>

        <article className="data-card">
          <h3>Import vocabulary CSV</h3>
          <p>
            Upload a CSV with columns for word, meaning, category, and sentence (header row
            optional). Rows merge into your custom library.
          </p>
          <label className="file-btn">
            Choose CSV file
            <input
              id="csvImportInput"
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setCsvStatus("Importing CSV…");
                try {
                  const { imported, errors } = await importCsv(file);
                  const errNote =
                    errors > 0 ? ` · ${errors} row warning${errors === 1 ? "" : "s"}` : "";
                  setCsvStatus(`Imported ${imported} word${imported === 1 ? "" : "s"}${errNote}.`);
                  showToast(`Imported ${imported} words from CSV`);
                } catch (error) {
                  setCsvStatus(error instanceof Error ? error.message : "CSV import failed.");
                }
                e.target.value = "";
              }}
            />
          </label>
          <p id="csvImportStatus" className="data-status" role="status">
            {csvStatus}
          </p>
        </article>

        <article className="data-card">
          <h3>Phone stuck on old version?</h3>
          <p>
            If the app on your phone does not show new topics or design changes, clear the offline
            cache and reload. Your favorites and custom words stay saved.
          </p>
          <button
            id="forceRefreshBtn"
            className="primary-btn"
            type="button"
            onClick={async () => {
              setForceStatus("Clearing offline cache…");
              await forceClearAppCacheAndReload();
            }}
          >
            Clear cache &amp; reload
          </button>
          <p id="forceRefreshStatus" className="data-status" role="status">
            {forceStatus}
          </p>
        </article>

        <article className="data-card">
          <h3>Import backup</h3>
          <p>
            Restore from a previously exported JSON file. Merge keeps your current data; replace
            overwrites local custom data.
          </p>
          <label className="select-wrap">
            <span>Mode</span>
            <select
              id="importModeSelect"
              value={importMode}
              onChange={(e) => setImportMode(e.target.value as "merge" | "replace")}
            >
              <option value="merge">Merge</option>
              <option value="replace">Replace</option>
            </select>
          </label>
          <label className="file-btn">
            Choose JSON file
            <input
              id="importFileInput"
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImportStatus("Importing…");
                try {
                  await importBackup(file, importMode);
                  setImportStatus(`Import complete (${importMode}).`);
                } catch (error) {
                  setImportStatus(error instanceof Error ? error.message : "Import failed.");
                }
                e.target.value = "";
              }}
            />
          </label>
          <button
            id="restoreBuiltInBtn"
            className="ghost-btn"
            type="button"
            onClick={() => {
              if (
                !confirm(
                  "Restore all built-in words and topics? This clears your deletion list (custom words are kept).",
                )
              ) {
                return;
              }
              restoreBuiltInLibrary();
              setBanner({ kind: "hidden" });
              setImportStatus("Built-in words, topics, and idioms restored.");
            }}
          >
            Restore built-in library
          </button>
          <p id="importStatus" className="data-status" role="status">
            {importStatus}
          </p>
        </article>
      </div>
    </section>
  );
}
