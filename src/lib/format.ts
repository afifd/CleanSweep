export const fmt = (n: number | string) => {
  const v = Number(n);
  return Number.isFinite(v) ? v.toLocaleString('en-US', { maximumFractionDigits: 4 }) : '0';
};
