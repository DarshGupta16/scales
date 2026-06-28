export const parseLocalDatetime = (dateStr: string) => {
  if (!dateStr) return NaN;
  const parsed = new Date(dateStr).getTime();
  return Number.isNaN(parsed) ? NaN : parsed;
};

export const formatTimestampToDatetimeLocal = (ts: number) => {
  if (!ts || ts === 0 || ts === Infinity) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear().toString().padStart(4, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const r = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${r}T${h}:${min}`;
};

export const isValidDateStr = (str: string) => {
  if (str.length !== 16) return false;
  const [datePart, timePart] = str.split("T");
  if (!datePart || !timePart) return false;
  const dateParts = datePart.split("-");
  if (dateParts.length !== 3) return false;
  const [y, m, d] = dateParts.map(Number);
  return (
    !Number.isNaN(y) &&
    !Number.isNaN(m) &&
    !Number.isNaN(d) &&
    y > 1000 &&
    m >= 1 &&
    m <= 12 &&
    d >= 1 &&
    d <= 31
  );
};
