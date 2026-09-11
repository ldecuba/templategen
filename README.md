# Rapportage Templategenerator

Een eenvoudige, statische webapp waarmee je rapportagetemplates kunt invullen en exporteren.
Gericht op rollen zoals contractmanager, projectmanager, product owner en tech lead.

## Gebruiken

Open `index.html` in je browser (of serveer de map met een eenvoudige webserver, bijv.
`python3 -m http.server`). Kies links een template, vul rechts het formulier in en bekijk
live de gegenereerde rapportage. Je kunt de rapportage:

- kopiëren als Markdown,
- downloaden als `.md`-bestand,
- printen of opslaan als PDF via de browser (Print / PDF-knop).

## Beschikbare templates

- **Contractmanagement:** SLA-rapportage
- **Projectmanagement:** Projectstatusrapportage
- **Product:** Sprint- en productupdate
- **Tech Lead:** Technische statusrapportage

## Nieuw template toevoegen

Templates staan in `templates.js`. Voeg een nieuw object toe aan de `TEMPLATES`-array met:

- `id`, `naam`, `categorie` (zie `CATEGORIEEN`), `beschrijving`
- `velden`: een lijst met invoervelden (`text`, `textarea`, `date`, `select`, `table`)
- `render(data)`: een functie die op basis van de ingevulde data een Markdown-rapportage teruggeeft

De app pikt nieuwe templates automatisch op in de zijbalk, gegroepeerd per categorie.
