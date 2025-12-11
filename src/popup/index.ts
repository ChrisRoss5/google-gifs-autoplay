const moreSettings = document.querySelector<HTMLElement>("#more-settings")!;
const enabledCbx = document.querySelector<HTMLInputElement>("#enabled-cbx")!;
const rulesCbx = document.querySelector<HTMLInputElement>("#rules-cbx")!;
const columnCountEl = document.querySelector<HTMLInputElement>(
  "#column-count-range-input"
)!;
const columnCountValue =
  document.querySelector<HTMLSpanElement>("#column-count")!;
const columnCountLabel = columnCountEl.closest("label") as HTMLElement;

chrome.storage.sync.get(
  ["enabled", "rulesetEnabled", "columnCount"],
  ({ enabled, rulesetEnabled, columnCount }) => {
    enabledCbx.checked = !!enabled;
    rulesCbx.checked = !!rulesetEnabled;
    columnCountEl.value = String(columnCount);
    columnCountValue.textContent = String(columnCount);
    moreSettings.style.display = enabled ? "" : "none";
    columnCountLabel.style.display = rulesetEnabled ? "" : "none";
  }
);

enabledCbx.addEventListener("change", () => {
  const enabled = enabledCbx.checked;
  chrome.storage.sync.set({ enabled });
  moreSettings.style.display = enabled ? "" : "none";
});

rulesCbx.addEventListener("change", () => {
  const rulesetEnabled = rulesCbx.checked;
  chrome.storage.sync.set({ rulesetEnabled });
  columnCountLabel.style.display = rulesetEnabled ? "" : "none";
});

columnCountEl.addEventListener("input", () => {
  const v = Number(columnCountEl.value || 1);
  columnCountValue.textContent = String(v);
  chrome.storage.sync.set({ columnCount: v });
});
