// token 对比度检查器：把“文字看不看得清”变成可机械验证的数字，供质感打磨每轮自查。
// 用法：node contrast.mjs   → 跑下方 THEMES 里的 token 组（改一个值就重跑，确认没改坏可读性）
// 判据：WCAG 2.1 — 正文 <4.5:1 不达标，大字/图形/图标 <3:1 不达标。
const lin = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const rgb = (hex) => {
  const h = hex.replace('#', '');
  const s = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const lum = (hex) => {
  const [r, g, b] = rgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
// rgba() 前景与背景都要先合成成实色再算（背景本身也可能是半透明 token，需再落到 base 上）
const solid = (c, base) => {
  const m = String(c).match(/rgba\(([^)]+)\)/);
  if (!m) return c;
  const [r, g, b, a = 1] = m[1].split(',').map((x) => parseFloat(x));
  const [R, G, B] = rgb(base);
  const f = (v, V) => Math.round(v * a + V * (1 - a));
  return `#${[f(r, R), f(g, G), f(b, B)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};
const ratio = (fg, bg, base) => {
  const B = solid(bg, base);
  const F = solid(fg, B);
  const [a, b] = [lum(F), lum(B)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
};

const THEMES = {
  // 方向 C（2026-10-26，D41 / S23）：冷米白 + 深靛蓝。
  // 两条硬约束：① 深色下 accent 必须提亮（原靛蓝在近黑上仅约 2.1:1）；
  // ② 深色下靛蓝实底必须配深字（accentInk），白字仅约 2.8:1。
  dark: {
    bg: '#131415', surface: '#1a1c1f', elevated: '#232629',
    ink: '#e8e6e1', ink2: '#a0a6ad', ink3: '#8a9099',
    accent: '#6e9be0', accentInk: '#0f1215', accentSoft: 'rgba(110,155,224,.14)',
    accentFg: '#8fb4e8', cta: '#6e9be0', ctaInk: '#0f1215'
  },
  light: {
    bg: '#fcf9f8', surface: '#ffffff', elevated: '#f6f3f2',
    ink: '#1c1b1b', ink2: '#55606b', ink3: '#667080',
    accent: '#1a4d8f', accentInk: '#ffffff', accentSoft: '#e8eef7',
    accentFg: '#1a4d8f', cta: '#1a4d8f', ctaInk: '#ffffff'
  }
};
// [前景, 背景, 场景, 门槛, 背景所落的 base（默认 surface）]
const CASES = [
  ['ink', 'surface', '正文 / 卡片', 4.5],
  ['ink2', 'surface', '摘要 / 次级文字', 4.5],
  // meta 是 12.5px 小字，必须走 4.5 正文标准（3:1 只适用于大字/图形/图标）
  ['ink3', 'surface', 'meta / 三级文字', 4.5],
  ['accentInk', 'accent', '主按钮文字', 4.5],
  ['accentFg', 'surface', '链接 / 标题 hover', 4.5],
  ['accentFg', 'accentSoft', 'chip 文字', 4.5, 'surface'],
  // 黄 CTA 已作废（D41），--cta 在 tokens.css 中重定向到 --accent；此条作为实底主按钮的等价回归
  ['ctaInk', 'cta', 'CTA 实底按钮文字', 4.5],
  ['ink', 'bg', '正文 / 页面底', 4.5],
  ['ink3', 'bg', 'meta / 页面底（chip 场景）', 4.5]
];

for (const [name, t] of Object.entries(THEMES)) {
  console.log(`\n== ${name} ==`);
  for (const [f, b, scene, min, base] of CASES) {
    const r = ratio(t[f], t[b], t[base || 'surface']);
    const ok = r >= min;
    console.log(`  ${ok ? '✓' : '✗'} ${r.toFixed(2).padStart(5)}:1  (≥${min})  ${scene}  ${f} on ${b}`);
  }
}
