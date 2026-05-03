# STATUS — M2 Diagnostica

## Stato attuale
- Data: 12/04/2026
- Fase: mockup completato, piano approvato

## Sessione 11-12/04/2026 — Progettazione e mockup

### Cosa fatto
- Discussione architetturale: unione M2 Tool v2 + Cantieri Tool in app unica
- Decisione: nuovo progetto separato, non toccare le app esistenti
- PLAN-INTEGRAZIONE.md scritto e iterato (8 fasi, tutte le feature)
- Mockup HTML completo su GitHub Pages: ludovez93.github.io/m2-diagnostica-mockup/
- 9 schermate: Dashboard, Cantiere (avanzamento km + difetti + NO DAC separati), Editor da campo (collaborativo LP/CA), Risultati, Difetti + Scheda I.1, Riepiloghi WhatsApp (formato M2 + GFC), Tabella Excel (colonne identiche a M2 v2), Panoramica mese (calendario + filtri operatore/cantiere/periodo), Profilo, Nuovo cantiere, Notte passata
- Feature nuove discusse e pianificate: editor da campo, offline, sync collaborativo, riepiloghi WhatsApp auto, barra avanzamento km, export Excel, profilo operatore

### Decisioni prese
- Nome: M2 Diagnostica
- Server: Oracle porta 3002 (Cantieri Tool resta su 3001)
- DB: copia dati esistenti Cantieri Tool + nuove colonne
- NO DAC non sono difetti — tracciati separatamente
- Operatori: LP (strumento G), CA (strumento B)
- Sync collaborativo a intervalli (opzione B, non real-time)
- Offline con Service Worker + IndexedDB
- Excel solo su richiesta esplicita, mai automatico
- Scheda I.1 prende dati dal parser (non dal profilo)

### Problemi aperti
- Nessuno

## Prossimo step
1. Creare cartella m2-diagnostica/ con CLAUDE.md, STATUS.md, LEARNED.md
2. Scrivere PLAN.md definitivo nella cartella progetto
3. Fase 0 approvata (mockup) — passare a Fase 1: setup progetto + copia base

## Storico sessioni
- 12/04/2026: progettazione architettura, piano integrazione, mockup completo 9 schermate
