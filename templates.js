// Definities van alle rapportagetemplates.
// Elk template heeft: id, naam, categorie, rol, beschrijving, velden en een render-functie.

const CATEGORIEEN = [
  { id: "contractmanagement", naam: "Contractmanagement" },
  { id: "projectmanagement", naam: "Projectmanagement" },
  { id: "product", naam: "Product" },
  { id: "techlead", naam: "Tech Lead" },
];

function lijstNaarMarkdown(items, lege = "_Geen items opgegeven._") {
  if (!items || items.length === 0) return lege;
  return items.map((item) => `- ${item}`).join("\n");
}

function tabelNaarMarkdown(kolommen, rijen, lege = "_Geen items opgegeven._") {
  if (!rijen || rijen.length === 0) return lege;
  const header = `| ${kolommen.join(" | ")} |`;
  const sep = `| ${kolommen.map(() => "---").join(" | ")} |`;
  const body = rijen
    .map((rij) => `| ${kolommen.map((k) => (rij[k.key] ?? "").toString().replace(/\n/g, "<br>")).join(" | ")} |`)
    .join("\n");
  return [header, sep, body].join("\n");
}

const TEMPLATES = [
  // ---------------------------------------------------------------------
  // CONTRACTMANAGEMENT — SLA-rapportage
  // ---------------------------------------------------------------------
  {
    id: "sla-rapportage",
    naam: "SLA-rapportage",
    categorie: "contractmanagement",
    beschrijving: "Periodieke rapportage over de naleving van Service Level Agreements richting klant of leverancier.",
    velden: [
      { key: "opdrachtgever", label: "Opdrachtgever / klant", type: "text", placeholder: "Bijv. Gemeente Utrecht" },
      { key: "leverancier", label: "Leverancier / dienstverlener", type: "text", placeholder: "Bijv. Acme IT Services B.V." },
      { key: "contractnaam", label: "Contract / dienst", type: "text", placeholder: "Bijv. Beheer & onderhoud applicatielandschap" },
      { key: "periode", label: "Rapportageperiode", type: "text", placeholder: "Bijv. Q3 2026 (juli - september)" },
      { key: "opsteller", label: "Opgesteld door", type: "text", placeholder: "Naam contractmanager" },
      { key: "datum", label: "Datum rapportage", type: "date" },
      { key: "samenvatting", label: "Managementsamenvatting", type: "textarea", placeholder: "Korte samenvatting van de algehele SLA-prestatie in deze periode." },
      {
        key: "kpis",
        label: "SLA-indicatoren (KPI's)",
        type: "table",
        kolommen: [
          { key: "naam", label: "KPI" },
          { key: "norm", label: "Norm" },
          { key: "gerealiseerd", label: "Gerealiseerd" },
          { key: "status", label: "Status" },
        ],
        placeholderRij: { naam: "Beschikbaarheid productieomgeving", norm: "99,5%", gerealiseerd: "99,7%", status: "Voldaan" },
      },
      {
        key: "incidenten",
        label: "Belangrijke incidenten / verstoringen",
        type: "table",
        kolommen: [
          { key: "datum", label: "Datum" },
          { key: "omschrijving", label: "Omschrijving" },
          { key: "impact", label: "Impact" },
          { key: "oplostijd", label: "Oplostijd" },
          { key: "status", label: "Status" },
        ],
        placeholderRij: { datum: "12-08-2026", omschrijving: "Storing betaalmodule", impact: "Hoog", oplostijd: "3u 40m", status: "Opgelost" },
      },
      { key: "afwijkingen", label: "Afwijkingen van de SLA-norm en genomen maatregelen", type: "textarea", placeholder: "Beschrijf per afwijking de oorzaak en de getroffen maatregelen." },
      { key: "verbeterpunten", label: "Verbeterpunten / actiepunten", type: "textarea", placeholder: "Één per regel." },
      { key: "conclusie", label: "Conclusie en vooruitblik", type: "textarea", placeholder: "Conclusie over de periode en aandachtspunten voor de volgende periode." },
    ],
    render(d) {
      return `# SLA-rapportage — ${d.contractnaam || "[contract]"}

**Opdrachtgever:** ${d.opdrachtgever || "-"}
**Leverancier:** ${d.leverancier || "-"}
**Rapportageperiode:** ${d.periode || "-"}
**Opgesteld door:** ${d.opsteller || "-"}
**Datum:** ${d.datum || "-"}

## 1. Managementsamenvatting
${d.samenvatting || "_Nog niet ingevuld._"}

## 2. SLA-indicatoren (KPI's)
${tabelNaarMarkdown(
  [
    { key: "naam", label: "KPI" },
    { key: "norm", label: "Norm" },
    { key: "gerealiseerd", label: "Gerealiseerd" },
    { key: "status", label: "Status" },
  ],
  d.kpis
)}

## 3. Belangrijke incidenten / verstoringen
${tabelNaarMarkdown(
  [
    { key: "datum", label: "Datum" },
    { key: "omschrijving", label: "Omschrijving" },
    { key: "impact", label: "Impact" },
    { key: "oplostijd", label: "Oplostijd" },
    { key: "status", label: "Status" },
  ],
  d.incidenten
)}

## 4. Afwijkingen en maatregelen
${d.afwijkingen || "_Geen afwijkingen gerapporteerd._"}

## 5. Verbeterpunten / actiepunten
${lijstNaarMarkdown((d.verbeterpunten || "").split("\n").filter(Boolean))}

## 6. Conclusie en vooruitblik
${d.conclusie || "_Nog niet ingevuld._"}
`;
    },
  },

  // ---------------------------------------------------------------------
  // PROJECTMANAGEMENT — Projectstatusrapportage
  // ---------------------------------------------------------------------
  {
    id: "projectstatus-rapportage",
    naam: "Projectstatusrapportage",
    categorie: "projectmanagement",
    beschrijving: "Voortgangsrapportage voor stuurgroep of opdrachtgever over planning, budget, risico's en voortgang.",
    velden: [
      { key: "projectnaam", label: "Projectnaam", type: "text" },
      { key: "opdrachtgever", label: "Opdrachtgever", type: "text" },
      { key: "projectmanager", label: "Projectmanager", type: "text" },
      { key: "periode", label: "Rapportageperiode", type: "text", placeholder: "Bijv. week 37, 2026" },
      { key: "datum", label: "Datum", type: "date" },
      {
        key: "statusPlanning",
        label: "Status planning",
        type: "select",
        opties: ["Op schema", "Licht vertraagd", "Ernstig vertraagd"],
      },
      {
        key: "statusBudget",
        label: "Status budget",
        type: "select",
        opties: ["Binnen budget", "Dreigt te overschrijden", "Overschreden"],
      },
      {
        key: "statusScope",
        label: "Status scope",
        type: "select",
        opties: ["Ongewijzigd", "Gewijzigd, beheerst", "Gewijzigd, niet beheerst"],
      },
      { key: "voortgang", label: "Voortgang deze periode", type: "textarea", placeholder: "Wat is er gerealiseerd?" },
      { key: "planning", label: "Planning komende periode", type: "textarea", placeholder: "Wat staat er gepland?" },
      {
        key: "risicos",
        label: "Risico's",
        type: "table",
        kolommen: [
          { key: "risico", label: "Risico" },
          { key: "kans", label: "Kans" },
          { key: "impact", label: "Impact" },
          { key: "beheersmaatregel", label: "Beheersmaatregel" },
        ],
        placeholderRij: { risico: "Vertraging leveringen door leverancier", kans: "Gemiddeld", impact: "Hoog", beheersmaatregel: "Wekelijkse afstemming met leverancier" },
      },
      { key: "besluiten", label: "Benodigde besluiten van stuurgroep", type: "textarea", placeholder: "Één per regel." },
    ],
    render(d) {
      return `# Projectstatusrapportage — ${d.projectnaam || "[project]"}

**Opdrachtgever:** ${d.opdrachtgever || "-"}
**Projectmanager:** ${d.projectmanager || "-"}
**Periode:** ${d.periode || "-"}
**Datum:** ${d.datum || "-"}

## 1. Statusoverzicht
| Aspect | Status |
| --- | --- |
| Planning | ${d.statusPlanning || "-"} |
| Budget | ${d.statusBudget || "-"} |
| Scope | ${d.statusScope || "-"} |

## 2. Voortgang deze periode
${d.voortgang || "_Nog niet ingevuld._"}

## 3. Planning komende periode
${d.planning || "_Nog niet ingevuld._"}

## 4. Risico's
${tabelNaarMarkdown(
  [
    { key: "risico", label: "Risico" },
    { key: "kans", label: "Kans" },
    { key: "impact", label: "Impact" },
    { key: "beheersmaatregel", label: "Beheersmaatregel" },
  ],
  d.risicos
)}

## 5. Benodigde besluiten van de stuurgroep
${lijstNaarMarkdown((d.besluiten || "").split("\n").filter(Boolean))}
`;
    },
  },

  // ---------------------------------------------------------------------
  // PRODUCT — Sprint- / productupdate
  // ---------------------------------------------------------------------
  {
    id: "product-sprintupdate",
    naam: "Sprint- en productupdate",
    categorie: "product",
    beschrijving: "Update voor stakeholders over opgeleverde features, gebruikersfeedback en de productroadmap.",
    velden: [
      { key: "productnaam", label: "Productnaam", type: "text" },
      { key: "productowner", label: "Product owner", type: "text" },
      { key: "sprint", label: "Sprint / periode", type: "text", placeholder: "Bijv. Sprint 24 (9 - 20 sept)" },
      { key: "datum", label: "Datum", type: "date" },
      { key: "hoogtepunten", label: "Hoogtepunten van deze periode", type: "textarea", placeholder: "Belangrijkste opgeleverde functionaliteit." },
      {
        key: "features",
        label: "Opgeleverde features",
        type: "table",
        kolommen: [
          { key: "feature", label: "Feature" },
          { key: "status", label: "Status" },
          { key: "impact", label: "Impact op gebruiker" },
        ],
        placeholderRij: { feature: "Nieuwe zoekfilters", status: "Live", impact: "Snellere navigatie voor eindgebruikers" },
      },
      { key: "gebruikersfeedback", label: "Gebruikersfeedback / statistieken", type: "textarea", placeholder: "Bijv. NPS, supportvragen, adoptiecijfers." },
      { key: "knelpunten", label: "Knelpunten / blockers", type: "textarea" },
      { key: "roadmap", label: "Vooruitblik roadmap", type: "textarea", placeholder: "Wat staat er op de planning voor de komende periode?" },
    ],
    render(d) {
      return `# Sprint- en productupdate — ${d.productnaam || "[product]"}

**Product owner:** ${d.productowner || "-"}
**Sprint / periode:** ${d.sprint || "-"}
**Datum:** ${d.datum || "-"}

## 1. Hoogtepunten
${d.hoogtepunten || "_Nog niet ingevuld._"}

## 2. Opgeleverde features
${tabelNaarMarkdown(
  [
    { key: "feature", label: "Feature" },
    { key: "status", label: "Status" },
    { key: "impact", label: "Impact op gebruiker" },
  ],
  d.features
)}

## 3. Gebruikersfeedback en statistieken
${d.gebruikersfeedback || "_Nog niet ingevuld._"}

## 4. Knelpunten / blockers
${d.knelpunten || "_Geen knelpunten gerapporteerd._"}

## 5. Vooruitblik roadmap
${d.roadmap || "_Nog niet ingevuld._"}
`;
    },
  },

  // ---------------------------------------------------------------------
  // TECH LEAD — Technische statusrapportage
  // ---------------------------------------------------------------------
  {
    id: "techlead-statusrapportage",
    naam: "Technische statusrapportage",
    categorie: "techlead",
    beschrijving: "Rapportage over architectuur, technische schuld, incidenten en teamvoortgang richting management.",
    velden: [
      { key: "team", label: "Team / squad", type: "text" },
      { key: "techlead", label: "Tech lead", type: "text" },
      { key: "periode", label: "Periode", type: "text" },
      { key: "datum", label: "Datum", type: "date" },
      { key: "samenvatting", label: "Samenvatting", type: "textarea" },
      {
        key: "systemen",
        label: "Status systemen / services",
        type: "table",
        kolommen: [
          { key: "systeem", label: "Systeem" },
          { key: "uptime", label: "Uptime" },
          { key: "status", label: "Status" },
        ],
        placeholderRij: { systeem: "API gateway", uptime: "99,95%", status: "Stabiel" },
      },
      { key: "incidenten", label: "Incidenten en postmortems", type: "textarea", placeholder: "Beschrijf incidenten en genomen vervolgacties." },
      { key: "technischeSchuld", label: "Technische schuld en risico's", type: "textarea" },
      { key: "architectuurwijzigingen", label: "Architectuurwijzigingen / beslissingen", type: "textarea" },
      { key: "vooruitblik", label: "Vooruitblik komende periode", type: "textarea" },
    ],
    render(d) {
      return `# Technische statusrapportage — ${d.team || "[team]"}

**Tech lead:** ${d.techlead || "-"}
**Periode:** ${d.periode || "-"}
**Datum:** ${d.datum || "-"}

## 1. Samenvatting
${d.samenvatting || "_Nog niet ingevuld._"}

## 2. Status systemen / services
${tabelNaarMarkdown(
  [
    { key: "systeem", label: "Systeem" },
    { key: "uptime", label: "Uptime" },
    { key: "status", label: "Status" },
  ],
  d.systemen
)}

## 3. Incidenten en postmortems
${d.incidenten || "_Geen incidenten gerapporteerd._"}

## 4. Technische schuld en risico's
${d.technischeSchuld || "_Nog niet ingevuld._"}

## 5. Architectuurwijzigingen / beslissingen
${d.architectuurwijzigingen || "_Geen wijzigingen gerapporteerd._"}

## 6. Vooruitblik komende periode
${d.vooruitblik || "_Nog niet ingevuld._"}
`;
    },
  },
];
