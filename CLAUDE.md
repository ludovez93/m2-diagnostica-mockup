# M2 Diagnostica

App unificata per ispezione saldature ferroviarie + gestione cantieri.
Unisce M2 Tool v2 (parser/editor/scheda I.1/Excel) e Cantieri Tool (backend/planning/storico).

## Repo
- Mockup: ludovez93/m2-diagnostica-mockup (GitHub Pages)
- App: da creare in C:/Users/Utente/Desktop/claude/m2-diagnostica/

## Stack
- Backend: Node.js + Express + SQLite (da Cantieri Tool)
- Frontend: HTML/CSS/JS vanilla, PWA con Service Worker
- Server: Oracle 92.4.172.126, porta 3002
- Design: dark glassmorphism (da Cantieri Tool)

## Regole
- M2 Tool v2 e Cantieri Tool NON si toccano
- Piano in PLAN-INTEGRAZIONE.md (nella cartella cantieri-tool)
- Mockup prima, codice dopo
- NO DAC non sono difetti
- Excel solo su richiesta esplicita, mai automatico
