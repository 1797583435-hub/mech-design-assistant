/* ============ 机械设计助手 · 交互与计算 ============ */

const $ = (id) => document.getElementById(id);

/* ---------- 通用工具 ---------- */
function fmt(v, sig = 4) {
  if (v === null || v === undefined || !isFinite(v)) return "—";
  if (v === 0) return "0";
  const p = parseFloat(v.toPrecision(sig));
  return String(p);
}

function num(id) {
  const v = parseFloat($(id).value);
  return isFinite(v) ? v : NaN;
}

function setResult(id, text, cls) {
  const el = $(id);
  el.textContent = text;
  el.className = cls || "";
}

function statusClass(ok) {
  return ok ? "ok" : (ok === null ? "" : "bad");
}

/* ---------- 导航 ---------- */
function showSection(target) {
  document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
  $(target).classList.add("active");
  document.querySelector(`.nav-item[data-target="${target}"]`).classList.add("active");
  window.scrollTo({ top: 0 });
}

document.querySelectorAll(".nav-item, [data-goto]").forEach((el) => {
  el.addEventListener("click", () => showSection(el.dataset.target || el.dataset.goto));
});

/* 导航模块搜索 */
$("nav-search").addEventListener("input", (e) => {
  const kw = e.target.value.trim().toLowerCase();
  document.querySelectorAll(".nav-item").forEach((b) => {
    b.style.display = (!kw || b.textContent.toLowerCase().includes(kw)) ? "" : "none";
  });
  document.querySelectorAll(".nav-group").forEach((g) => {
    let any = false;
    let el = g.nextElementSibling;
    while (el && !el.classList.contains("nav-group")) {
      if (el.classList.contains("nav-item") && el.style.display !== "none") any = true;
      el = el.nextElementSibling;
    }
    g.style.display = any ? "" : "none";
  });
});

/* ---------- 材料库 ---------- */
function renderMaterials() {
  const kw = $("mat-search").value.trim().toLowerCase();
  const cat = $("mat-cat").value;
  const rows = MATERIALS.filter((m) => {
    const okCat = !cat || m.cat === cat;
    const okKw = !kw || (m.name + m.cat + m.note).toLowerCase().includes(kw);
    return okCat && okKw;
  });
  $("mat-body").innerHTML = rows.map((m) => `
    <tr>
      <td>${m.name}</td>
      <td><span class="badge">${m.cat}</span></td>
      <td>${m.rho}</td>
      <td>${m.E}</td>
      <td>${m.ys === null ? "—" : m.ys}</td>
      <td>${m.ts}</td>
      <td>${m.note}</td>
    </tr>`).join("");
}

$("mat-search").addEventListener("input", renderMaterials);
$("mat-cat").addEventListener("change", renderMaterials);
renderMaterials();

/* ---------- 单位换算 ---------- */
const unitCatKeys = Object.keys(UNIT_CATS);
$("unit-cat").innerHTML = unitCatKeys.map((k) => `<option value="${k}">${UNIT_CATS[k].label}</option>`).join("");

function fillUnitOptions(catKey) {
  const cat = UNIT_CATS[catKey];
  const keys = Object.keys(cat.units);
  const html = keys.map((k) => `<option value="${k}">${k}</option>`).join("");
  $("unit-from").innerHTML = html;
  $("unit-to").innerHTML = html;
  $("unit-to").selectedIndex = Math.min(1, keys.length - 1);
}

function convertUnit() {
  const cat = UNIT_CATS[$("unit-cat").value];
  const v = num("unit-in");
  const from = $("unit-from").value;
  const to = $("unit-to").value;
  if (isNaN(v)) { setResult("unit-out", "—"); return; }

  let out;
  if (cat.special) {
    // 温度专用换算
    const toC = { "°C": (x) => x, "°F": (x) => (x - 32) * 5 / 9, "K": (x) => x - 273.15 };
    const fromC = { "°C": (x) => x, "°F": (x) => x * 9 / 5 + 32, "K": (x) => x + 273.15 };
    out = fromC[to](toC[from](v));
  } else {
    out = v * cat.units[from] / cat.units[to];
  }
  setResult("unit-out", `${fmt(out, 6)} ${to}`);
}

$("unit-cat").addEventListener("change", () => { fillUnitOptions($("unit-cat").value); convertUnit(); });
$("unit-in").addEventListener("input", convertUnit);
$("unit-from").addEventListener("change", convertUnit);
$("unit-to").addEventListener("change", convertUnit);
fillUnitOptions($("unit-cat").value);
convertUnit();

/* ---------- 梁计算 ---------- */
function toggleBeamFields() {
  const udl = $("beam-type").value.endsWith("udl");
  $("beam-F-wrap").style.display = udl ? "none" : "";
  $("beam-w-wrap").style.display = udl ? "" : "none";

  const sec = $("beam-sec").value;
  const show = (id) => ($(id).style.display = "");
  const hide = (id) => ($(id).style.display = "none");
  ["beam-rect-b-wrap", "beam-rect-h-wrap", "beam-circle-d-wrap",
   "beam-hollow-D-wrap", "beam-hollow-d-wrap", "beam-i-b-wrap",
   "beam-i-h-wrap", "beam-i-tw-wrap", "beam-i-tf-wrap"].forEach(hide);
  if (sec === "rect") { show("beam-rect-b-wrap"); show("beam-rect-h-wrap"); }
  else if (sec === "circle") { show("beam-circle-d-wrap"); }
  else if (sec === "hollow") { show("beam-hollow-D-wrap"); show("beam-hollow-d-wrap"); }
  else { show("beam-i-b-wrap"); show("beam-i-h-wrap"); show("beam-i-tw-wrap"); show("beam-i-tf-wrap"); }
}

$("beam-type").addEventListener("change", toggleBeamFields);
$("beam-sec").addEventListener("change", toggleBeamFields);
toggleBeamFields();

function sectionProps(sec) {
  const r = {};
  if (sec === "rect") {
    const b = num("beam-rect-b"), h = num("beam-rect-h");
    r.I = b * h ** 3 / 12;
    r.W = b * h ** 2 / 6;
    r.y = h / 2;
  } else if (sec === "circle") {
    const d = num("beam-circle-d");
    r.I = Math.PI * d ** 4 / 64;
    r.W = Math.PI * d ** 3 / 32;
    r.y = d / 2;
  } else if (sec === "hollow") {
    const D = num("beam-hollow-D"), d = num("beam-hollow-d");
    r.I = Math.PI * (D ** 4 - d ** 4) / 64;
    r.W = Math.PI * (D ** 4 - d ** 4) / (32 * D);
    r.y = D / 2;
  } else {
    const bf = num("beam-i-b"), h = num("beam-i-h"), tw = num("beam-i-tw"), tf = num("beam-i-tf");
    const hw = h - 2 * tf;
    r.I = (bf * h ** 3 - (bf - tw) * hw ** 3) / 12;
    r.y = h / 2;
    r.W = r.I / r.y;
  }
  return r;
}

$("beam-calc").addEventListener("click", () => {
  const type = $("beam-type").value;
  const L = num("beam-L");
  const E = num("beam-E") * 1000; // GPa → MPa
  const sigAllow = num("beam-sig");
  const F = type.endsWith("udl") ? num("beam-w") : num("beam-F");
  const sec = $("beam-sec").value;
  const props = sectionProps(sec);

  if (![L, E, F, props.I, props.W].every((v) => isFinite(v) && v > 0)) {
    setResult("beam-status", "请输入有效数值", "bad");
    return;
  }

  let M, delta;
  if (type === "ss-point") { M = F * L / 4; delta = F * L ** 3 / (48 * E * props.I); }
  else if (type === "ss-udl") { M = F * L ** 2 / 8; delta = 5 * F * L ** 4 / (384 * E * props.I); }
  else if (type === "cant-point") { M = F * L; delta = F * L ** 3 / (3 * E * props.I); }
  else { M = F * L ** 2 / 2; delta = F * L ** 4 / (8 * E * props.I); }

  const sigma = M / props.W; // N·mm / mm³ = MPa
  setResult("beam-M", `${fmt(M / 1e3)} kN·mm`);
  setResult("beam-I", `${fmt(props.I, 5)} mm⁴`);
  setResult("beam-W", `${fmt(props.W, 5)} mm³`);
  setResult("beam-sigma", `${fmt(sigma)} MPa`);
  setResult("beam-delta", `${fmt(delta, 5)} mm`);

  if (isFinite(sigAllow) && sigAllow > 0) {
    const ok = sigma <= sigAllow;
    setResult("beam-status", ok ? `安全（σ=${fmt(sigma)} ≤ ${sigAllow} MPa）` : `超限（σ=${fmt(sigma)} > ${sigAllow} MPa）`, statusClass(ok));
  } else {
    setResult("beam-status", "未输入许用应力");
  }
});

/* ---------- 轴设计 ---------- */
function toggleShaftFields() {
  const combined = $("shaft-mode").value === "combined";
  $("shaft-P-wrap").style.display = combined ? "none" : "";
  $("shaft-n-wrap").style.display = combined ? "none" : "";
  $("shaft-T-wrap").style.display = combined ? "" : "none";
  $("shaft-M-wrap").style.display = combined ? "" : "none";
  $("shaft-tau-wrap").style.display = combined ? "none" : "";
  $("shaft-sigma-wrap").style.display = combined ? "" : "none";
}

$("shaft-mode").addEventListener("change", toggleShaftFields);
toggleShaftFields();

$("shaft-calc").addEventListener("click", () => {
  const combined = $("shaft-mode").value === "combined";
  let T, Me, allow;
  if (combined) {
    T = num("shaft-T");
    const M = num("shaft-M");
    allow = num("shaft-sigma");
    Me = Math.sqrt(M ** 2 + T ** 2);
  } else {
    const P = num("shaft-P"), n = num("shaft-n");
    T = P / n * 9550;
    allow = num("shaft-tau");
    Me = T;
  }
  if (![T, allow].every((v) => isFinite(v) && v > 0)) {
    setResult("shaft-status", "请输入有效数值", "bad");
    return;
  }

  const dmin = combined
    ? Math.cbrt(32 * Me * 1000 / (Math.PI * allow))
    : Math.cbrt(16 * T * 1000 / (Math.PI * allow));

  setResult("shaft-Tout", `${fmt(T)} N·m`);
  setResult("shaft-dmin", `${fmt(dmin)} mm`);

  const dActual = num("shaft-d-actual");
  if (isFinite(dActual) && dActual > 0) {
    const stress = combined
      ? 32 * Me * 1000 / (Math.PI * dActual ** 3)
      : 16 * T * 1000 / (Math.PI * dActual ** 3);
    const unit = combined ? "正应力" : "切应力";
    setResult("shaft-actual", `${fmt(stress)} MPa（${unit}）`);
    const ok = stress <= allow;
    setResult("shaft-status", ok ? `安全（应力 ≤ ${allow} MPa）` : `超限（应力 > ${allow} MPa）`, statusClass(ok));
  } else {
    setResult("shaft-actual", "—");
    setResult("shaft-status", "请输入实际直径以校核");
  }
});

/* ---------- 齿轮 ---------- */
function calcGear() {
  const m = num("gear-m"), z1 = num("gear-z1"), z2 = num("gear-z2");
  const n1 = num("gear-n1"), T1 = num("gear-T1");
  if (![m, z1, z2].every((v) => isFinite(v) && v > 0) || z1 < 1 || z2 < 1) {
    setResult("gear-i", "—"); setResult("gear-d1", "—"); setResult("gear-d2", "—");
    setResult("gear-a", "—"); setResult("gear-n2", "—"); setResult("gear-T2", "—");
    return;
  }
  const i = z2 / z1;
  const d1 = m * z1, d2 = m * z2, a = m * (z1 + z2) / 2;
  setResult("gear-i", `1 : ${fmt(i, 5)}`);
  setResult("gear-d1", `${fmt(d1)} mm`);
  setResult("gear-d2", `${fmt(d2)} mm`);
  setResult("gear-a", `${fmt(a)} mm`);
  setResult("gear-n2", isFinite(n1) && n1 > 0 ? `${fmt(n1 / i)} rpm` : "—");
  setResult("gear-T2", isFinite(T1) && T1 > 0 ? `${fmt(T1 * i)} N·m` : "—");
}

["gear-m", "gear-z1", "gear-z2", "gear-n1", "gear-T1"].forEach((id) =>
  $(id).addEventListener("input", calcGear));
$("gear-calc").addEventListener("click", calcGear);
calcGear();

/* ---------- 弹簧 ---------- */
$("spr-calc").addEventListener("click", () => {
  const d = num("spr-d"), D = num("spr-D"), n = num("spr-na");
  const G = num("spr-G"), F = num("spr-F");
  const tauAllow = num("spr-tau-allow");
  if (![d, D, n, G, F].every((v) => isFinite(v) && v > 0) || D <= d) {
    setResult("spr-status", "请输入有效数值（D 应大于 d）", "bad");
    return;
  }
  const C = D / d;
  const Kw = (4 * C - 1) / (4 * C - 4) + 0.615 / C;
  const k = G * d ** 4 / (8 * D ** 3 * n);
  const delta = F / k;
  const tau = Kw * 8 * F * D / (Math.PI * d ** 3);
  const solid = (n + 2) * d;

  setResult("spr-k", `${fmt(k)} N/mm`);
  setResult("spr-delta", `${fmt(delta)} mm`);
  setResult("spr-C", fmt(C));
  setResult("spr-wahl", fmt(Kw));
  setResult("spr-tau", `${fmt(tau)} MPa`);
  setResult("spr-solid", `${fmt(solid)} mm`);
  if (isFinite(tauAllow) && tauAllow > 0) {
    const ok = tau <= tauAllow;
    setResult("spr-status", ok ? `安全（τ=${fmt(tau)} ≤ ${tauAllow} MPa）` : `超限（τ=${fmt(tau)} > ${tauAllow} MPa）`, statusClass(ok));
  } else {
    setResult("spr-status", "未输入许用切应力");
  }
});

/* ---------- 螺栓 ---------- */
$("bolt-d").innerHTML = BOLTS.map((b) => `<option value="${b.d}">M${b.d}</option>`).join("");

$("bolt-calc").addEventListener("click", () => {
  const d = parseFloat($("bolt-d").value);
  const bolt = BOLTS.find((b) => b.d === d);
  const grade = $("bolt-grade").value;
  const K = parseFloat($("bolt-K").value);
  const ratio = num("bolt-ratio");
  const proof = BOLT_PROOF[grade];
  if (!bolt || !isFinite(ratio) || ratio <= 0 || ratio > 1) {
    setResult("bolt-T", "—"); setResult("bolt-F", "—");
    return;
  }
  const F0 = ratio * proof * bolt.As; // N
  const T = K * F0 * bolt.d / 1000;   // N·m
  setResult("bolt-As", `${bolt.As} mm²`);
  setResult("bolt-proof", `${proof} MPa`);
  setResult("bolt-F", `${fmt(F0 / 1000)} kN`);
  setResult("bolt-T", `${fmt(T)} N·m`);
});

/* ---------- 公差配合 ---------- */
function sizeRangeIndex(D) {
  for (let i = 0; i < SIZE_RANGES.length; i++) {
    if (D > SIZE_RANGES[i][0] && D <= SIZE_RANGES[i][1]) return i;
  }
  return -1;
}

$("fit-calc").addEventListener("click", () => {
  const D = num("fit-D");
  if (!isFinite(D) || D <= 0 || D > 500) {
    setResult("fit-type", "基本尺寸需在 0.5–500 mm 之间", "bad");
    return;
  }
  const idx = sizeRangeIndex(D);
  const hole = $("fit-hole").value;   // 如 H7
  const shaft = $("fit-shaft").value; // 如 g6
  const hGrade = parseInt(hole.slice(1), 10);
  const sLetter = shaft.slice(0, -1);
  const sGrade = parseInt(shaft.slice(-1), 10);

  const itHole = IT_VALUES[hGrade][idx];
  const itShaft = IT_VALUES[sGrade][idx];
  const dev = SHAFT_DEVIATIONS[sLetter];

  let es, ei;
  if (sLetter === "js") {
    es = Math.round(itShaft / 2);
    ei = -es;
  } else if (dev.es !== undefined) {
    es = dev.es[idx];
    ei = es - itShaft;
  } else {
    ei = dev.ei[idx];
    es = ei + itShaft;
  }

  const ES = itHole, EI = 0;
  const holeMax = D + ES / 1000, holeMin = D + EI / 1000;
  const shaftMax = D + es / 1000, shaftMin = D + ei / 1000;
  const maxClear = holeMax - shaftMin;
  const minClear = holeMin - shaftMax;

  let type, cls;
  if (minClear > 0) { type = "间隙配合"; cls = "ok"; }
  else if (maxClear < 0) { type = "过盈配合"; cls = "bad"; }
  else { type = "过渡配合"; cls = "warn"; }

  const minTxt = minClear > 0 ? `最小间隙 ${fmt(minClear, 5)} mm` : `最小过盈 ${fmt(-minClear, 5)} mm`;
  const maxTxt = maxClear < 0 ? `最大过盈 ${fmt(-maxClear, 5)} mm` : `最大间隙 ${fmt(maxClear, 5)} mm`;

  setResult("fit-range", `${SIZE_RANGES[idx][0]} < D ≤ ${SIZE_RANGES[idx][1]} mm`);
  setResult("fit-ES", `${fmt(ES)} μm`);
  setResult("fit-EI", `${fmt(EI)} μm`);
  setResult("fit-es", `${fmt(es)} μm`);
  setResult("fit-ei", `${fmt(ei)} μm`);
  setResult("fit-type", `${hole}/${shaft} · ${type}`, cls);
  setResult("fit-min", minTxt);
  setResult("fit-max", maxTxt);
});

/* ---------- 设计检查表 ---------- */
const chkKey = "mech-checklist-v1";
let chkState = {};
try { chkState = JSON.parse(localStorage.getItem(chkKey)) || {}; } catch (e) { chkState = {}; }

function renderChecklist() {
  const total = CHECKLIST.reduce((s, g) => s + g.items.length, 0);
  let done = 0;
  $("chk-container").innerHTML = CHECKLIST.map((group, gi) => `
    <div class="chk-group">
      <h3>${group.group}</h3>
      ${group.items.map((item, ii) => {
        const key = `${gi}-${ii}`;
        if (chkState[key]) done++;
        return `<label class="chk-item${chkState[key] ? " done" : ""}">
          <input type="checkbox" data-key="${key}" ${chkState[key] ? "checked" : ""}>
          <span>${item}</span>
        </label>`;
      }).join("")}
    </div>`).join("");
  const pct = Math.round(done / total * 100);
  $("chk-progress").style.width = pct + "%";
  $("chk-count").textContent = `${done} / ${total}`;
  document.querySelectorAll(".chk-item input").forEach((cb) => {
    cb.addEventListener("change", () => {
      chkState[cb.dataset.key] = cb.checked;
      localStorage.setItem(chkKey, JSON.stringify(chkState));
      renderChecklist();
    });
  });
}

$("chk-clear").addEventListener("click", () => {
  chkState = {};
  localStorage.removeItem(chkKey);
  renderChecklist();
});

renderChecklist();

/* 初始化：默认展示总览并预填部分默认值 */
showSection("sec-home");
