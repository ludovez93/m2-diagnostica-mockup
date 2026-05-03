const fs=require('fs'),p=require('path');
const idx='index.html', vw='views/dashboard.html';
let h=fs.readFileSync(idx,'utf8');
let c=fs.readFileSync(vw,'utf8').trim().replace(/^<section[^>]*data-screen=["']?[^"'>]+["']?[^>]*>/,'').replace(/<\/section>\s*$/,'').trim();
const re=new RegExp(`(<section[^>]*data-screen="dashboard"[^>]*>)([\s\S]*?)(</section>)`);
const r=h.replace(re,`$1\n      ${c.split('\n').join('\n      ')}\n    $3`);
if(r===h){console.error('NO MATCH');process.exit(1);}
fs.writeFileSync(idx,r);console.log('OK',c.length);
