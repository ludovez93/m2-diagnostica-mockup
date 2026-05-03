# LEARNED — M2 Diagnostica Mockup

Correzioni e lezioni apprese durante lo sviluppo.

## Design
- Font minimo 0.78rem su mobile, sotto diventa illeggibile
- Testo muted #6b7388 troppo scuro su sfondo nero — usare almeno #8890a6
- Non buttare componenti in verticale senza gerarchia — raggruppare in card contenitore
- Ogni schermata deve rispondere a UNA domanda: "dove vado?", "a che punto siamo?", "scrivo"
- NO DAC non sono difetti — vanno tracciati separatamente, mai conteggiati come difetti
- Mockup deve essere il piu' realistico possibile, con dati veri, prima di scrivere codice

## Dominio
- Operatori: LP (Ludovico, strumento G), CA (Cristopher, strumento B)
- La scheda I.1 si pre-compila dai dati parsati della saldatura, non dal profilo operatore
- L'Excel non deve generarsi automaticamente — solo su richiesta esplicita
- Formato GFC: intestazione fissa "M2 CONTROLLO SALDATURE", se difetti li elenca in coda
- Formato M2: riepilogo completo con operatori, km percorsi, etc.

## Tecnico
- GitHub Pages: il CDN mobile ha cache aggressiva — usare ?v=N per forzare refresh
- gh repo create con --source=. e branch gh-pages attiva Pages automaticamente
- Badge versione visibile in alto a sinistra: utile per verificare che il refresh sia andato a buon fine senza chiedere ogni volta

## Editor syntax-highlight (textarea trasparente + div colorato)
**Pattern overlay pixel-perfect su iOS Safari**: il caret reale del textarea si calcola sulle metriche del testo "vero", il highlight visibile è il div sotto. Per evitare drift del cursore servono TUTTI questi vincoli:

1. **font-weight uniforme** su textarea + highlight + tutti i token (es. 600). Token con weight diverso dal base allargano i caratteri → cursore si sposta lateralmente.
2. **font-size identico ovunque** (incluso su tok-data, tok-sub, tok-pill — niente font-size: 11/12px sui token).
3. **line-height in PX ASSOLUTI** (es. `28px`), MAI unitless (`1.7`). iOS Safari calcola unitless line-height diversamente tra `<textarea>` e `<div>` → drift verticale che si accumula riga dopo riga.
4. **No `<div>` wrapper per riga nel highlight** — i div per riga arrotondano l'altezza riga-per-riga in modo diverso dal flow del textarea. Usare `\n` literal con `white-space: pre-wrap` su ENTRAMBI gli elementi: stesso algoritmo line-break, niente arrotondamenti.
5. **Token senza padding/border/border-radius/background** — gli stili "pill" rompono la geometria del testo. Differenziare i token solo con `color`.
6. **Il character-perfect tokenize** preserva spazi (split `/(\s+)/` non `/\s+/`), case originale (no `.toUpperCase()`) e niente `.trim()`.
7. **Sync scroll su entrambi assi** (top + left) tra textarea e highlight, su evento `scroll` E su `input` (con doppio rAF dopo input).

## Detection difetto/NoDAC nel mockup
- Per il **mockup** basta detection semplice: codice 3-cifre = difetto, "N" da solo = NoDAC. NON serve replicare la lista completa CODICI_DIFETTO dell'app live (28 codici incluso 4212/4112/4213/decimali) — quella precisione serve solo nell'app vera.
- **App live**: la lista ufficiale CODICI_DIFETTO sta in `m2-diagnostica/frontend/js/parser.js:2`. Detection riga vera in `classifyAll()` stesso file.
