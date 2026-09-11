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
  document.getElementById("previewInhoud").innerHTML = markdownNaarHtml(markdown);
  huidigTemplate.laatsteMarkdown = markdown;
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
