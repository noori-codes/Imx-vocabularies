export const formatDate = (isoString) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const fadeText = (element, nextText) => {
  if (!element) return;
  element.classList.add("text-fade-out");
  window.setTimeout(() => {
    element.textContent = nextText;
    element.classList.remove("text-fade-out");
  }, 180);
};
