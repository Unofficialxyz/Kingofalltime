export function fmtNum(n: number, dec = 2): string {
  if (!isFinite(n)) return "--";
  return n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function fmtCompact(n: number): string {
  if (!isFinite(n)) return "--";
  const abs = Math.abs(n);
  if (abs >= 1e15) return (n / 1e15).toFixed(2) + "Q";
  if (abs >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(2);
}

export function fmtPct(n: number): string {
  if (!isFinite(n)) return "--";
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

export function fmtPctRaw(n: number): string {
  if (!isFinite(n)) return "--";
  return n.toFixed(2) + "%";
}

export function fmtDate(t: number): string {
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDateShort(t: number): string {
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
