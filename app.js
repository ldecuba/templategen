// Applicatielogica: sidebar, dynamisch formulier, live preview en export.

let huidigTemplate = null;
let huidigeData = {};

function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.innerHTML = "";
  CATEGORIEEN.forEach((cat) => {
    const templatesInCat = TEMPLATES.filter((t) => t.categorie === cat.id);
    if (templatesInCat.length === 0) return;

    const blok = document.createElement("div");
    blok.className = "categorie-blok";

    const titel = document.createElement("p");
    titel.className = "categorie-titel";
    titel.textContent = cat.naam;
    blok.appendChild(titel);

    templatesInCat.forEach((tpl) => {
      const knop = document.createElement("button");
      knop.className = "template-knop";
      knop.id = `tpl-knop-${tpl.id}`;
      knop.innerHTML = `${tpl.naam}<span class="sub">${tpl.beschrijving}</span>`;
      knop.addEventListener("click", () => kiesTemplate(tpl.id));
      blok.appendChild(knop);
    });

    sidebar.appendChild(blok);
  });
}

function kiesTemplate(id) {
  huidigTemplate = TEMPLATES.find((t) => t.id === id);
  huidigeData = {};

  document.querySelectorAll(".template-knop").forEach((el) => el.classList.remove("actief"));
  document.getElementById(`tpl-knop-${id}`).classList.add("actief");

  document.getElementById("leegState").hidden = true;
  document.getElementById("templateWeergave").hidden = false;
  document.getElementById("templateTitel").textContent = huidigTemplate.naam;
  document.getElementById("templateBeschrijving").textContent = huidigTemplate.beschrijving;

  bouwFormulier();
  ververPreview();
}

function bouwFormulier() {
  const form = document.getElementById("rapportageForm");
  form.innerHTML = "";

  huidigTemplate.velden.forEach((veld) => {
    const wrapper = document.createElement("div");
    wrapper.className = "veld";

    const label = document.createElement("label");
    label.textContent = veld.label;
    wrapper.appendChild(label);

    if (veld.type === "table") {
      if (!huidigeData[veld.key]) huidigeData[veld.key] = [{ ...veld.placeholderRij }];
      wrapper.classList.add("tabel-veld");
      wrapper.appendChild(bouwTabelVeld(veld));
    } else if (veld.type === "textarea") {
      const el = document.createElement("textarea");
      el.placeholder = veld.placeholder || "";
      el.value = huidigeData[veld.key] || "";
      el.addEventListener("input", () => { huidigeData[veld.key] = el.value; ververPreview(); });
      wrapper.appendChild(el);
    } else if (veld.type === "select") {
      const el = document.createElement("select");
      const leeg = document.createElement("option");
      leeg.value = "";
      leeg.textContent = "— Kies —";
      el.appendChild(leeg);
      veld.opties.forEach((optie) => {
        const opt = document.createElement("option");
        opt.value = optie;
        opt.textContent = optie;
        el.appendChild(opt);
      });
      el.value = huidigeData[veld.key] || "";
      el.addEventListener("change", () => { huidigeData[veld.key] = el.value; ververPreview(); });
      wrapper.appendChild(el);
    } else {
      const el = document.createElement("input");
      el.type = veld.type === "date" ? "date" : "text";
      el.placeholder = veld.placeholder || "";
      el.value = huidigeData[veld.key] || "";
      el.addEventListener("input", () => { huidigeData[veld.key] = el.value; ververPreview(); });
      wrapper.appendChild(el);
    }

    form.appendChild(wrapper);
  });
}

function bouwTabelVeld(veld) {
  const container = document.createElement("div");

  function render() {
    container.innerHTML = "";
    const table = document.createElement("table");

    const thead = document.createElement("tr");
    veld.kolommen.forEach((k) => {
      const th = document.createElement("th");
      th.textContent = k.label;
      thead.appendChild(th);
    });
    thead.appendChild(document.createElement("th"));
    table.appendChild(thead);

    huidigeData[veld.key].forEach((rij, rijIndex) => {
      const tr = document.createElement("tr");
      veld.kolommen.forEach((k) => {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.type = "text";
        input.value = rij[k.key] || "";
        input.addEventListener("input", () => {
          huidigeData[veld.key][rijIndex][k.key] = input.value;
          ververPreview();
        });
        td.appendChild(input);
        tr.appendChild(td);
      });
      const tdActie = document.createElement("td");
      tdActie.className = "tabel-rij-acties";
      const verwijderBtn = document.createElement("button");
      verwijderBtn.type = "button";
      verwijderBtn.textContent = "Verwijder";
      verwijderBtn.addEventListener("click", () => {
        huidigeData[veld.key].splice(rijIndex, 1);
        render();
        ververPreview();
      });
      tdActie.appendChild(verwijderBtn);
      tr.appendChild(tdActie);
      table.appendChild(tr);
    });

    container.appendChild(table);

    const toevoegenBtn = document.createElement("button");
    toevoegenBtn.type = "button";
    toevoegenBtn.className = "tabel-toevoegen";
    toevoegenBtn.textContent = "+ Rij toevoegen";
    toevoegenBtn.addEventListener("click", () => {
      const legeRij = {};
      veld.kolommen.forEach((k) => (legeRij[k.key] = ""));
      huidigeData[veld.key].push(legeRij);
      render();
      ververPreview();
    });
    container.appendChild(toevoegenBtn);
  }

  render();
  return container;
}

function ververPreview() {
  const markdown = huidigTemplate.render(huidigeData);
  const dashboardHtml = bouwDashboard(huidigTemplate, huidigeData);
  document.getElementById("previewInhoud").innerHTML = dashboardHtml + markdownNaarHtml(markdown);
  huidigTemplate.laatsteMarkdown = markdown;
}

// ---------------------------------------------------------------------
// Dashboard: KPI-tegels, badges, statusbalken en donut-grafieken.
// Vaste statuskleuren (goed/waarschuwing/ernstig/kritiek), altijd met
// een label erbij zodat kleur nooit de enige drager van betekenis is.
// ---------------------------------------------------------------------

const STATUS_KLASSE_MAP = {
  "voldaan": "goed", "opgelost": "goed", "live": "goed", "stabiel": "goed",
  "op schema": "goed", "binnen budget": "goed", "ongewijzigd": "goed", "laag": "goed",
  "aandachtspunt": "waarschuwing", "licht vertraagd": "waarschuwing", "dreigt te overschrijden": "waarschuwing",
  "in test": "waarschuwing", "gewijzigd, beheerst": "waarschuwing", "gemiddeld": "waarschuwing",
  "niet voldaan": "kritiek", "ernstig vertraagd": "kritiek", "overschreden": "kritiek",
  "gewijzigd, niet beheerst": "kritiek", "hoog": "kritiek",
};
const STATUS_LABEL = { goed: "Goed", waarschuwing: "Aandacht", ernstig: "Ernstig", kritiek: "Kritiek", neutraal: "Overig" };
const STATUS_ICOON = { goed: "●", waarschuwing: "▲", ernstig: "▲", kritiek: "●", neutraal: "●" };

function statusKlasse(tekst) {
  const t = (tekst || "").toString().trim().toLowerCase();
  return STATUS_KLASSE_MAP[t] || "neutraal";
}

function parsePercentage(tekst) {
  if (!tekst) return null;
  const match = tekst.toString().replace(",", ".").match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? parseFloat(match[1]) : null;
}

function statTegelHtml(label, waarde, klasse) {
  return `<div class="stat-tegel klasse-${klasse}"><div class="stat-label">${label}</div><div class="stat-waarde">${waarde}</div></div>`;
}

function badgeHtml(tekst) {
  if (!tekst) return "";
  const klasse = statusKlasse(tekst);
  return `<span class="badge klasse-${klasse}"><span class="badge-icoon">${STATUS_ICOON[klasse]}</span>${tekst}</span>`;
}

function statusbalkHtml(titel, rijen, kolomKey) {
  if (!rijen || rijen.length === 0) return "";
  const klasses = ["goed", "waarschuwing", "ernstig", "kritiek", "neutraal"];
  const tellingen = {};
  klasses.forEach((k) => (tellingen[k] = 0));
  rijen.forEach((r) => {
    const k = statusKlasse(r[kolomKey]);
    tellingen[k] += 1;
  });
  const totaal = rijen.length;
  const aanwezig = klasses.filter((k) => tellingen[k] > 0);
  const segmenten = aanwezig
    .map((k) => `<div class="statusbalk-segment klasse-${k}" style="width:${((tellingen[k] / totaal) * 100).toFixed(1)}%"></div>`)
    .join("");
  const legenda = aanwezig
    .map((k) => `<span class="legenda-item"><span class="legenda-stip klasse-${k}"></span>${STATUS_LABEL[k]} (${tellingen[k]})</span>`)
    .join("");
  return `<div class="statusbalk-blok"><div class="statusbalk-titel">${titel}</div><div class="statusbalk">${segmenten}</div><div class="statusbalk-legenda">${legenda}</div></div>`;
}

function donutSvg(percentage, klasse, label) {
  const p = Math.max(0, Math.min(100, percentage));
  const r = 30;
  const omtrek = 2 * Math.PI * r;
  const gevuld = (p / 100) * omtrek;
  const kleur = { goed: "var(--good)", waarschuwing: "var(--warning)", ernstig: "var(--serious)", kritiek: "var(--critical)", neutraal: "var(--accent)" }[klasse] || "var(--accent)";
  return `<div class="donut-item">
    <svg viewBox="0 0 72 72" width="72" height="72" role="img" aria-label="${label}: ${Math.round(p)}%">
      <circle cx="36" cy="36" r="${r}" fill="none" stroke="var(--gridline)" stroke-width="8"></circle>
      <circle cx="36" cy="36" r="${r}" fill="none" stroke="${kleur}" stroke-width="8"
        stroke-dasharray="${gevuld.toFixed(1)} ${(omtrek - gevuld).toFixed(1)}" stroke-linecap="round"
        transform="rotate(-90 36 36)"></circle>
      <text x="36" y="41" text-anchor="middle" font-size="15" font-weight="700" fill="var(--text-primary)">${Math.round(p)}%</text>
    </svg>
    <div class="donut-label">${label}</div>
  </div>`;
}

function bouwDashboard(tpl, d) {
  if (tpl.id === "sla-rapportage") return bouwSlaDashboard(d);

  let html = "";
  const selectVelden = tpl.velden.filter((v) => v.type === "select");
  const badges = selectVelden.map((v) => badgeHtml(d[v.key])).filter(Boolean);
  if (badges.length) html += `<div class="badge-rij">${badges.join("")}</div>`;

  tpl.velden
    .filter((v) => v.type === "table" && v.kolommen.some((k) => k.key === "status"))
    .forEach((v) => {
      const rijen = (d[v.key] || []).filter((r) => Object.values(r).some(Boolean));
      if (rijen.length) html += statusbalkHtml(v.label, rijen, "status");
    });

  return html ? `<div class="dashboard">${html}</div>` : "";
}

function bouwSlaDashboard(d) {
  const kpis = (d.kpis || []).filter((r) => r.naam);
  const incidenten = (d.incidenten || []).filter((r) => r.omschrijving);
  if (kpis.length === 0 && incidenten.length === 0) return "";

  const nietVoldaan = kpis.filter((r) => statusKlasse(r.status) === "kritiek" || statusKlasse(r.status) === "waarschuwing").length;
  const hogeImpact = incidenten.filter((r) => (r.impact || "").toLowerCase() === "hoog").length;

  let html = '<div class="dashboard">';
  html += '<div class="tegel-rij">';
  html += statTegelHtml("KPI's totaal", kpis.length, "neutraal");
  html += statTegelHtml("KPI's niet voldaan", nietVoldaan, nietVoldaan > 0 ? "kritiek" : "goed");
  html += statTegelHtml("Incidenten deze periode", incidenten.length, incidenten.length > 0 ? "waarschuwing" : "goed");
  html += statTegelHtml("Hoge impact incidenten", hogeImpact, hogeImpact > 0 ? "kritiek" : "goed");
  html += "</div>";

  if (kpis.length) {
    html += '<p class="dashboard-sectietitel">SLA-indicatoren</p><div class="donut-rij">';
    kpis.forEach((r) => {
      const klasse = statusKlasse(r.status);
      const pct = parsePercentage(r.gerealiseerd);
      const percentage = pct !== null ? pct : klasse === "goed" ? 100 : klasse === "kritiek" ? 30 : 60;
      html += donutSvg(percentage, klasse, r.naam);
    });
    html += "</div>";
  }

  if (incidenten.length) {
    html += statusbalkHtml("Status incidenten", incidenten, "status");
  }

  html += "</div>";
  return html;
}

// Zeer eenvoudige markdown-naar-HTML omzetting, voldoende voor de gegenereerde rapportages.
function markdownNaarHtml(markdown) {
  const regels = markdown.split("\n");
  let html = "";
  let inTabel = false;
  let inLijst = false;

  regels.forEach((regel) => {
    const isTabelRegel = /^\|.*\|$/.test(regel.trim());
    const isSepRegel = /^\|[\s\-|]+\|$/.test(regel.trim());

    if (isTabelRegel && !isSepRegel) {
      if (!inTabel) { html += "<table>"; inTabel = true; }
      const cellen = regel.trim().slice(1, -1).split("|").map((c) => c.trim());
      const isHeader = !html.includes("<tr>") || html.endsWith("<table>");
      const tag = html.trim().endsWith("<table>") ? "th" : "td";
      html += `<tr>${cellen.map((c) => `<${tag}>${c}</${tag}>`).join("")}</tr>`;
      return;
    } else if (isSepRegel) {
      return;
    } else if (inTabel) {
      html += "</table>";
      inTabel = false;
    }

    const isLijstRegel = /^-\s+/.test(regel.trim());
    if (isLijstRegel) {
      if (!inLijst) { html += "<ul>"; inLijst = true; }
      html += `<li>${regel.trim().replace(/^-\s+/, "")}</li>`;
      return;
    } else if (inLijst) {
      html += "</ul>";
      inLijst = false;
    }

    if (regel.startsWith("# ")) html += `<h1>${regel.slice(2)}</h1>`;
    else if (regel.startsWith("## ")) html += `<h2>${regel.slice(3)}</h2>`;
    else if (regel.startsWith("### ")) html += `<h3>${regel.slice(4)}</h3>`;
    else if (regel.trim() === "") html += "";
    else html += `<p>${regel.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</p>`;
  });

  if (inTabel) html += "</table>";
  if (inLijst) html += "</ul>";
  return html;
}

function laadVoorbeeld() {
  if (!huidigTemplate || !huidigTemplate.voorbeeld) return;
  huidigeData = JSON.parse(JSON.stringify(huidigTemplate.voorbeeld));
  huidigTemplate.velden.forEach((veld) => {
    if (veld.type === "table" && !huidigeData[veld.key]) {
      huidigeData[veld.key] = [{ ...veld.placeholderRij }];
    }
  });
  bouwFormulier();
  ververPreview();
}

function kopieerMarkdown() {
  if (!huidigTemplate) return;
  navigator.clipboard.writeText(huidigTemplate.laatsteMarkdown).then(() => {
    alert("Markdown gekopieerd naar klembord.");
  });
}

function downloadMarkdown() {
  if (!huidigTemplate) return;
  const blob = new Blob([huidigTemplate.laatsteMarkdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${huidigTemplate.id}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("voorbeeldBtn").addEventListener("click", laadVoorbeeld);
document.getElementById("kopieerBtn").addEventListener("click", kopieerMarkdown);
document.getElementById("downloadBtn").addEventListener("click", downloadMarkdown);
document.getElementById("printBtn").addEventListener("click", () => window.print());

initSidebar();
