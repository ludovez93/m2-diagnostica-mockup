# LEARNED — M2 Diagnostica

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
