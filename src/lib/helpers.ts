export const formatDate = (isoString: string) => {
  if (!isoString) return "";
  const date = new Date(`${isoString.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
