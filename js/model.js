/* ============ 机械设计助手 · 螺纹尺寸速查 ============ */

$("model-size").innerHTML = MODEL_HOLES
  .map((m) => `<option value="${m.d}">M${m.d}（P${m.P}）</option>`)
  .join("");

function fmtArr(arr, sep = " / ") {
  return arr === null ? "—" : arr.map((v) => fmt(v)).join(sep);
}

function renderModelTable() {
  $("model-body").innerHTML = MODEL_HOLES.map((m) => `
    <tr>
      <td>M${m.d}</td>
      <td>${m.P}</td>
      <td>${fmt(m.tap)}</td>
      <td>${m.clear.map((v) => fmt(v)).join(" / ")}</td>
      <td>${m.csGB ? `${fmt(m.csGB[0])} × ${fmt(m.csGB[1])}` : "—"}</td>
      <td>${m.csHex ? `Φ${fmt(m.csHex)}` : "—"}</td>
      <td>${m.cb ? `Φ${fmt(m.cb[0])} × ${fmt(m.cb[1])}` : "—"}</td>
      <td>${fmt(m.hexS)}</td>
      <td>${fmt(m.wrench)}</td>
      <td>${m.washer.map((v) => fmt(v)).join(" × ")}</td>
    </tr>`).join("");
}

function calcModel() {
  const d = parseFloat($("model-size").value);
  const row = MODEL_HOLES.find((m) => m.d === d);
  if (!row) return;
  const factor = parseFloat($("model-mat").value); // 1.5d 或 2d
  const threadDepth = factor * row.d;
  const holeDepth = threadDepth + 3 * row.P;

  setResult("model-P", `${fmt(row.P)} mm`);
  setResult("model-tap", `Φ${fmt(row.tap)} mm（${fmt(row.d)} − ${fmt(row.P)}）`);
  setResult("model-thread-depth", `${fmt(threadDepth)} mm（${factor}d）`);
  setResult("model-hole-depth", `${fmt(holeDepth)} mm`);
  setResult("model-clear", `Φ${row.clear.map((v) => fmt(v)).join(" / ")}`);
  setResult("model-csGB", row.csGB
    ? `Φ${fmt(row.csGB[0])} × ${fmt(row.csGB[1])}（90°）`
    : "—");
  setResult("model-csHex", row.csHex
    ? `Φ${fmt(row.csHex)}（90°，深约 ${fmt((row.csHex - row.clear[1]) / 2)}）`
    : "—");
  setResult("model-cb", row.cb
    ? `Φ${fmt(row.cb[0])} × ${fmt(row.cb[1])}`
    : "—");
  setResult("model-hexS", `${fmt(row.hexS)} mm`);
  setResult("model-wrench", `${fmt(row.wrench)} mm`);
  setResult("model-washer", `Φ${row.washer.map((v) => fmt(v)).join(" × ")}`);
}

$("model-calc").addEventListener("click", calcModel);
$("model-size").addEventListener("change", calcModel);
$("model-mat").addEventListener("change", calcModel);
renderModelTable();
calcModel();
