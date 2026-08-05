/* ============ 机械设计助手 · 画图与建模速查 ============ */

/* ---------- 倒角与圆角 ---------- */
$("chamfer-calc").addEventListener("click", () => {
  const d = num("chamfer-d");
  if (!isFinite(d) || d <= 0) {
    setResult("chamfer-r", "请输入轴径", "bad");
    return;
  }
  const r = 0.1 * d;
  const std = FILLET_STD.find((v) => v >= r) || FILLET_STD[FILLET_STD.length - 1];
  setResult("chamfer-r", `R${fmt(std)}（推荐 r ≥ 0.1d = ${fmt(r)}，取标准圆角）`);
});

/* ---------- 拔模斜度 ---------- */
$("draft-calc").addEventListener("click", () => {
  const L = num("draft-L"), ang = num("draft-ang");
  if (![L, ang].every((v) => isFinite(v) && v >= 0)) {
    setResult("draft-off", "请输入有效数值", "bad");
    return;
  }
  const off = L * Math.tan(ang * Math.PI / 180);
  setResult("draft-off", `${fmt(off, 5)} mm（单边）`);
  setResult("draft-total", `${fmt(off * 2, 5)} mm（双边）`);
});

/* ---------- 键槽 ---------- */
$("keyway-calc").addEventListener("click", () => {
  const d = num("keyway-d");
  if (!isFinite(d) || d <= 0) {
    setResult("keyway-bh", "—"); setResult("keyway-t", "请输入有效轴径", "bad");
    return;
  }
  const row = KEYWAYS.find((k) => d > k[0] && d <= k[1]);
  if (!row) {
    setResult("keyway-bh", "—"); setResult("keyway-t", "轴径超出 6–500 mm 范围", "bad");
    return;
  }
  const [, , b, h, t, t1] = row;
  const Lrec = KEY_LENGTHS.find((L) => L >= 1.5 * d) || KEY_LENGTHS[KEY_LENGTHS.length - 1];
  setResult("keyway-bh", `${b} × ${h} mm`);
  setResult("keyway-t", `轴槽深 t=${fmt(t)}，毂槽深 t1=${fmt(t1)}`);
  setResult("keyway-dt", `轴槽底至表面 ${fmt(d - t)}，毂槽底至孔壁 ${fmt(d + t1)}`);
  setResult("keyway-L", `推荐键长 ≈ 1.5d = ${fmt(1.5 * d)}，取标准 ${Lrec} mm`);
});

/* ---------- O 型圈沟槽 ---------- */
$("oring-calc").addEventListener("click", () => {
  const d2 = num("oring-d2");
  const comp = num("oring-comp") / 100;
  if (![d2, comp].every((v) => isFinite(v) && v > 0) || comp >= 0.4) {
    setResult("oring-h", "请输入有效数值（压缩率 < 40%）", "bad");
    return;
  }
  const h = d2 * (1 - comp);
  const bmin = 1.3 * d2, bmax = 1.5 * d2;
  setResult("oring-h", `${fmt(h, 4)} mm`);
  setResult("oring-b", `${fmt(bmin, 3)} – ${fmt(bmax, 3)} mm`);
  setResult("oring-comp-out", `${fmt(comp * 100)} %（${fmt(d2 * comp, 4)} mm）`);
});

/* ---------- 轴承配合 ---------- */
$("bearingfit-cond").innerHTML = BEARING_FITS
  .map((r, i) => `<option value="${i}">${r.cond}</option>`)
  .join("");

$("bearingfit-calc").addEventListener("click", () => {
  const cond = $("bearingfit-cond").value;
  const row = BEARING_FITS[parseInt(cond, 10)];
  if (!row) return;
  setResult("bearingfit-shaft", row.shaft);
  setResult("bearingfit-housing", row.housing);
  setResult("bearingfit-cond-out", row.cond);
});

/* ---------- 钣金折弯 ---------- */
$("sheet-calc").addEventListener("click", () => {
  const t = num("sheet-t"), r = num("sheet-r"), ang = num("sheet-ang");
  const K = parseFloat($("sheet-K").value);
  if (![t, r, ang].every((v) => isFinite(v) && v > 0) || ang >= 180) {
    setResult("sheet-ba", "请输入有效数值（角度 < 180°）", "bad");
    return;
  }
  const rad = ang * Math.PI / 180;
  const BA = rad * (r + K * t);
  const BD = 2 * (r + t) * Math.tan(rad / 2) - BA;
  const Lmin = 4 * t;
  const holeDist = 2 * t + r;
  setResult("sheet-ba", `${fmt(BA, 5)} mm`);
  setResult("sheet-bd", `${fmt(BD, 5)} mm`);
  setResult("sheet-k", `K = ${fmt(K, 3)}`);
  setResult("sheet-min", `约 ${fmt(Lmin, 4)} mm`);
  setResult("sheet-hole", `约 ${fmt(holeDist, 4)} mm`);
});

/* ---------- 硬度换算 ---------- */
function interp(pairs, x) {
  if (x <= pairs[0][0]) {
    const [x0, y0] = pairs[0];
    const [x1, y1] = pairs[1];
    return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
  }
  for (let i = 1; i < pairs.length; i++) {
    if (x <= pairs[i][0]) {
      const [x0, y0] = pairs[i - 1];
      const [x1, y1] = pairs[i];
      return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
    }
  }
  const [x0, y0] = pairs[pairs.length - 2];
  const [x1, y1] = pairs[pairs.length - 1];
  return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
}

$("heat-calc").addEventListener("click", () => {
  const mode = $("heat-mode").value;
  const v = num("heat-in");
  if (!isFinite(v) || v <= 0) {
    setResult("heat-out", "请输入有效数值", "bad");
    return;
  }
  if (mode === "hrc2hb") {
    if (v < 15 || v > 70) { setResult("heat-out", "HRC 建议输入 15–70", "bad"); return; }
    const hb = interp(HRC_HB, v);
    setResult("heat-out", `约 ${fmt(hb)} HB`);
  } else {
    const hbPairs = HRC_HB.map(([a, b]) => [b, a]);
    if (v < 226 || v > 654) { setResult("heat-out", "HB 建议输入 226–654", "bad"); return; }
    const hrc = interp(hbPairs, v);
    setResult("heat-out", `约 ${fmt(hrc)} HRC`);
  }
});

/* ---------- 静态表格渲染 ---------- */
function tableRows(id, rows, cols) {
  $(id).innerHTML = rows.map((r) => `<tr>${cols.map((c) => `<td>${r[c]}</td>`).join("")}</tr>`).join("");
}

tableRows("draft-body", DRAFT_RECS, ["place", "value", "note"]);
tableRows("rough-proc-body", ROUGH_PROCESS, ["method", "ra"]);
tableRows("rough-app-body", ROUGH_APP, ["face", "ra"]);
tableRows("gdt-linear-body", ISO2768_LINEAR.map((r) => ({ rng: r[0], tol: r[1] })), ["rng", "tol"]);
tableRows("gdt-angle-body", ISO2768_ANGLE.map((r) => ({ rng: r[0], tol: r[1] })), ["rng", "tol"]);
tableRows("gdt-flat-body", ISO2768_FLAT.map((r) => ({ rng: r[0], tol: r[1] })), ["rng", "tol"]);
tableRows("gdt-perp-body", ISO2768_PERP.map((r) => ({ rng: r[0], tol: r[1] })), ["rng", "tol"]);
tableRows("keyway-body", KEYWAYS.map((k) => ({
  d: `>${k[0]}–${k[1]}`, bh: `${k[2]}×${k[3]}`, t: k[4], t1: k[5],
})), ["d", "bh", "t", "t1"]);
tableRows("oring-body", ORING_WIRE.map((d2) => ({
  d2, h15: fmt(d2 * 0.85, 4), h20: fmt(d2 * 0.8, 4), b: `${fmt(1.3 * d2, 3)}–${fmt(1.5 * d2, 3)}`,
})), ["d2", "h15", "h20", "b"]);
tableRows("bearingfit-body", BEARING_FITS.map((r, i) => ({
  cond: r.cond, shaft: r.shaft, housing: r.housing,
})), ["cond", "shaft", "housing"]);
tableRows("sheet-body", [
  { rule: "最小折弯边", val: "≈ 4t（t ≤ 3 mm 时）", note: "与模具、材质有关" },
  { rule: "孔到折弯边距离", val: "≥ 2t + r，且 ≥ 3 mm", note: "否则孔易变形" },
  { rule: "K 因子", val: "0.3–0.5", note: "SolidWorks 默认 0.5；软钢常用 0.44" },
  { rule: "内弯曲半径", val: "软钢 ≥ 0.5t，铝 ≥ 1t", note: "依材质与回弹调整" },
], ["rule", "val", "note"]);
tableRows("wall-body", WALL_RECS, ["mat", "t", "note"]);
tableRows("rib-body", [
  { item: "加强筋厚度", val: "0.5–0.7 × 壁厚" },
  { item: "加强筋高度", val: "≤ 3 × 壁厚" },
  { item: "根部圆角", val: "0.25–0.5 × 壁厚" },
  { item: "壁厚变化过渡圆角", val: "≥ 0.25 × 壁厚，内圆角 ≥ 0.5 mm" },
  { item: "相邻壁厚比", val: "尽量 ≤ 2:1" },
], ["item", "val"]);
tableRows("heat-body", HEAT_TREATS, ["mat", "proc", "h"]);
