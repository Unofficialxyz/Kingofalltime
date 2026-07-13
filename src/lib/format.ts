export function fmtNum(n: number, digits = 2): string { if (!isFinite(n)) return "\u2014"; return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }); }
export function fmtCompact(n: number): string { if (!isFinite(n)) return "\u2014"; const a = Math.abs(n); if (a >= 1e15) return (n/1e15).toFixed(2)+"Q"; if (a >= 1e12) return (n/1e12).toFixed(2)+"T"; if (a >= 1e9) return (n/1e9).toFixed(2)+"B"; if (a >= 1e6) return (n/1e6).toFixed(2)+"M"; if (a >= 1e3) return (n/1e3).toFixed(2)+"K"; return n.toFixed(0); }
export function fmtPct(n: number, digits = 2): string { if (!isFinite(n)) return "\u2014"; return (n*100).toFixed(digits)+"%"; }
export function fmtPctRaw(n: number, digits = 2): string { if (!isFinite(n)) return "\u2014"; return n.toFixed(digits)+"%"; }
export function fmtDate(iso: string): string { try { return new Date(iso).toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" }); } catch { return iso; } }
