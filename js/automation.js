/* ============ 机械设计助手 · 自动化选型 ============ */

const STD_POWERS = [0.06, 0.09, 0.12, 0.18, 0.25, 0.37, 0.55, 0.75, 1.1, 1.5,
  2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 200];

const STD_BORES = [6, 8, 10, 12, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200];

const SCREW_MOUNT = {
  "fixed-fixed":    { lambda: 4.730, k: 0.5 },
  "fixed-support":  { lambda: 3.927, k: 0.7 },
  "support-support":{ lambda: 3.142, k: 1.0 },
  "fixed-free":     { lambda: 1.875, k: 2.0 },
};

/* ---------- 电机选型 ---------- */
$("motor-calc").addEventListener("click", () => {
  const TL = num("motor-TL"), n = num("motor-n");
  const eta = num("motor-eta"), SF = num("motor-SF");
  if (![TL, n, eta, SF].every((v) => isFinite(v) && v > 0)) {
    setResult("motor-Preq", "请输入有效数值", "bad");
    return;
  }
  const P = TL * n / 9550 / eta;
  const Pneed = P * SF;
  const std = STD_POWERS.find((p) => p >= Pneed) || STD_POWERS[STD_POWERS.length - 1];
  setResult("motor-Preq", `${fmt(P)} kW`);
  setResult("motor-Pstd", `${fmt(std)} kW（按 ${fmt(Pneed)} kW 取整）`);

  const JL = num("motor-JL"), JM = num("motor-JM");
  if (isFinite(JL) && isFinite(JM) && JL >= 0 && JM > 0) {
    const ratio = JL / JM;
    setResult("motor-Jratio", `${fmt(ratio, 4)}`);
    const ok = ratio <= 10;
    setResult("motor-Jcheck",
      ok ? `匹配（≤ 10，通常建议 ≤ 5–10）` : `惯量偏大（> 10），建议加大电机或加减速机`, statusClass(ok));
  } else {
    setResult("motor-Jratio", "—");
    setResult("motor-Jcheck", "未输入惯量");
  }
});

/* ---------- 减速机选型 ---------- */
$("red-calc").addEventListener("click", () => {
  const n1 = num("red-n1"), n2 = num("red-n2");
  const T2 = num("red-T2"), SF = parseFloat($("red-SF").value);
  const eta = parseFloat($("red-eta").value);
  if (![n1, n2, T2].every((v) => isFinite(v) && v > 0)) {
    setResult("red-i", "—"); setResult("red-Treq", "—"); setResult("red-Pin", "请输入有效数值", "bad");
    return;
  }
  const i = n1 / n2;
  setResult("red-i", `1 : ${fmt(i, 5)}`);
  setResult("red-Treq", `${fmt(T2 * SF)} N·m（SF=${SF}）`);
  setResult("red-Pin", `${fmt(T2 * n2 / 9550 / eta)} kW`);
});

/* ---------- 同步带 ---------- */
$("belt-calc").addEventListener("click", () => {
  const P = parseFloat($("belt-pitch").value);
  const z1 = num("belt-z1"), z2 = num("belt-z2");
  const C = num("belt-C"), n1 = num("belt-n1");
  if (![P, z1, z2, C].every((v) => isFinite(v) && v > 0) || z1 < 1 || z2 < 1) {
    setResult("belt-ratio", "—"); setResult("belt-Lcalc", "请输入有效数值", "bad");
    return;
  }
  const d1 = z1 * P / Math.PI, d2 = z2 * P / Math.PI;
  const L = 2 * C + Math.PI * (d1 + d2) / 2 + (d2 - d1) ** 2 / (4 * C);
  const zb = L / P;
  const v = d1 * n1 * Math.PI / 60000;
  setResult("belt-ratio", `1 : ${fmt(z2 / z1, 5)}`);
  setResult("belt-d1", `${fmt(d1)} mm`);
  setResult("belt-d2", `${fmt(d2)} mm`);
  setResult("belt-Lcalc", `${fmt(L)} mm`);
  setResult("belt-zb", `${fmt(zb, 5)} 齿`);
  setResult("belt-v", isFinite(n1) && n1 > 0 ? `${fmt(v)} m/s` : "—");

  const Lstd = num("belt-L");
  if (isFinite(Lstd) && Lstd > 0) {
    const b = Lstd - Math.PI * (d1 + d2) / 2;
    const Creal = (b + Math.sqrt(Math.max(0, b ** 2 - 8 * (d2 - d1) ** 2))) / 4;
    setResult("belt-Creal", `${fmt(Creal)} mm`);
  } else {
    setResult("belt-Creal", "—");
  }
});

/* ---------- 滚珠丝杠 ---------- */
$("screw-calc").addEventListener("click", () => {
  const F = num("screw-F"), n = num("screw-n"), Ph = num("screw-Ph");
  const dr = num("screw-dr"), L = num("screw-L");
  const eta = num("screw-eta"), SF = num("screw-SF");
  const mount = SCREW_MOUNT[$("screw-mount").value];
  if (![F, n, Ph, dr, L, eta, SF].every((v) => isFinite(v) && v > 0)) {
    setResult("screw-T", "—"); setResult("screw-ncr", "—");
    setResult("screw-status-n", "请输入有效数值", "bad");
    return;
  }

  const T = F * Ph / (2 * Math.PI * eta) / 1000; // N·m
  const P = T * n / 9550; // kW
  const ncr = mount.lambda ** 2 * dr * 1.2231e7 / L ** 2; // rpm
  const nmax = 0.8 * ncr;
  const I = Math.PI * dr ** 4 / 64;
  const Fcr = Math.PI ** 2 * 206000 * I / (mount.k * L) ** 2; // N
  const Fallow = Fcr / SF;

  setResult("screw-T", `${fmt(T)} N·m`);
  setResult("screw-P", `${fmt(P)} kW`);
  setResult("screw-ncr", `${fmt(ncr)} rpm`);
  setResult("screw-nmax", `${fmt(nmax)} rpm`);
  const okN = n <= nmax;
  setResult("screw-status-n",
    okN ? `安全（n=${fmt(n)} ≤ ${fmt(nmax)} rpm）` : `超限（n=${fmt(n)} > ${fmt(nmax)} rpm）`, statusClass(okN));
  setResult("screw-Fcr", `${fmt(Fcr / 1000)} kN`);
  setResult("screw-Fallow", `${fmt(Fallow / 1000)} kN`);
  const okF = F <= Fallow;
  setResult("screw-status-f",
    okF ? `安全（F=${fmt(F / 1000)} ≤ ${fmt(Fallow / 1000)} kN）` : `超限（F=${fmt(F / 1000)} > ${fmt(Fallow / 1000)} kN）`, statusClass(okF));
});

/* ---------- 气缸 ---------- */
$("cyl-calc").addEventListener("click", () => {
  const F = num("cyl-F"), P = num("cyl-P"), eta = num("cyl-eta"), L = num("cyl-L");
  if (![F, P, eta].every((v) => isFinite(v) && v > 0)) {
    setResult("cyl-Dtheory", "—"); setResult("cyl-Dstd", "—"); setResult("cyl-status", "请输入有效数值", "bad");
    return;
  }
  const Dtheory = Math.sqrt(4 * F / (Math.PI * P * eta));
  const Dstd = STD_BORES.find((d) => d >= Dtheory) || STD_BORES[STD_BORES.length - 1];
  const Fact = P * Math.PI * Dstd ** 2 / 4 * eta;
  const Q = isFinite(L) && L > 0
    ? 2 * (Math.PI * Dstd ** 2 / 4) * L * (P + 0.1013) / 0.1013 * 1e-6
    : NaN;
  setResult("cyl-Dtheory", `${fmt(Dtheory)} mm`);
  setResult("cyl-Dstd", `Φ${Dstd} mm`);
  setResult("cyl-Fact", `${fmt(Fact)} N`);
  setResult("cyl-Q", isFinite(Q) ? `${fmt(Q, 5)} L` : "—");

  const d = num("cyl-d"), SF = num("cyl-SF");
  if (isFinite(d) && d > 0 && isFinite(L) && L > 0 && isFinite(SF) && SF > 0) {
    const I = Math.PI * d ** 4 / 64;
    const Fcr = Math.PI ** 2 * 206000 * I / (2 * L) ** 2;
    setResult("cyl-Fcr", `${fmt(Fcr / 1000)} kN`);
    const ok = F <= Fcr / SF;
    setResult("cyl-status",
      ok ? `安全（F ≤ ${fmt(Fcr / SF / 1000)} kN）` : `活塞杆失稳风险（F > ${fmt(Fcr / SF / 1000)} kN）`, statusClass(ok));
  } else {
    setResult("cyl-Fcr", "—");
    setResult("cyl-status", "输入杆径与行程以校核");
  }
});

/* ---------- 直线导轨 ---------- */
$("guide-calc").addEventListener("click", () => {
  const C = num("guide-C"), C0 = num("guide-C0"), P = num("guide-P");
  const v = num("guide-v"), SF = num("guide-SF");
  const roller = $("guide-type").value === "roller";
  if (![C, C0, P, SF].every((x) => isFinite(x) && x > 0) || P <= 0) {
    setResult("guide-life-km", "—"); setResult("guide-static", "请输入有效数值", "bad");
    return;
  }
  const expo = roller ? 10 / 3 : 3;
  const Lkm = (C / P) ** expo * 50;
  const hours = isFinite(v) && v > 0 ? Lkm * 1000 / (v * 60) : NaN;
  setResult("guide-life-km", `${fmt(Lkm)} km`);
  setResult("guide-life-h", isFinite(hours) ? `${fmt(hours)} h` : "—");
  const ok = P <= C0 / SF;
  setResult("guide-static",
    ok ? `安全（P=${fmt(P)} ≤ ${fmt(C0 / SF)} kN）` : `静载荷超限（P > ${fmt(C0 / SF)} kN）`, statusClass(ok));
});

/* ---------- 滚动轴承 ---------- */
$("bear-calc").addEventListener("click", () => {
  const C = num("bear-C"), P = num("bear-P"), n = num("bear-n");
  const roller = $("bear-type").value === "roller";
  if (![C, P, n].every((x) => isFinite(x) && x > 0) || P <= 0) {
    setResult("bear-L10", "—"); setResult("bear-L10h", "请输入有效数值", "bad");
    return;
  }
  const expo = roller ? 10 / 3 : 3;
  const L10 = (C / P) ** expo * 1e6;
  setResult("bear-L10", `${fmt(L10)} 转`);
  setResult("bear-L10h", `${fmt(L10 / (60 * n))} h`);
});
