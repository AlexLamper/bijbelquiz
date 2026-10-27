/**
 * Writes .local/cover-options/index.html: all four options side by side as
 * 2.0 quiz cards (desktop matrix), then per option its description, the six
 * cards in the desktop grid, a phone-width column (2-column card grid, list
 * rows with small thumbnails) and the quiz-detail hero crop.
 */

import fs from 'node:fs';
import path from 'node:path';

import { OPTIONS } from './options.mjs';
import { SAMPLES } from './samples.mjs';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Question counts for the card meta line; the samples are 10-question quizzes. */
const META = '10 vragen · 5 min';

function card(optionId: string, i: number): string {
  const s = SAMPLES[i];
  return `<a class="card" href="${optionId}/${s.slug}.png"><span class="cover"><img src="${optionId}/${s.slug}.png" alt="" loading="lazy"></span>
<span class="body"><span class="kicker">${esc(s.reference)}</span><span class="title">${esc(s.title)}</span><span class="meta">${META}</span></span></a>`;
}

export function writeIndex(dir: string): void {
  const head = OPTIONS.map((o) => `<div class="colhead"><span class="letter">${o.letter}</span>${esc(o.name)}</div>`).join('');
  const rows = SAMPLES.map(
    (s, i) => `<div class="rowlabel"><b>${esc(s.kind)}</b>${esc(s.reference)}</div>${OPTIONS.map((o) => card(o.id, i)).join('')}`,
  ).join('');

  const sections = OPTIONS.map((o) => {
    const list = SAMPLES.map(
      (s) =>
        `<div class="row"><img src="${o.id}/thumbs/${s.slug}.png" alt=""><span><span class="kicker">${esc(s.reference)}</span><span class="rtitle">${esc(s.title)}</span></span></div>`,
    ).join('');
    return `<section class="option" id="${o.id}">
  <div class="intro">
    <div class="opt-eyebrow">Optie ${o.letter}</div>
    <h2>${esc(o.name)}</h2>
    <p class="tag">${esc(o.tagline)}</p>
    <p>${esc(o.idea)}</p>
    <div class="pc"><div><h3>Sterk</h3><ul>${o.pros.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div><h3>Minder sterk</h3><ul>${o.cons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
    <div class="scale"><h3>Opschalen naar alle quizzen</h3><p>${esc(o.scale)}</p></div>
    <p class="files"><a href="${o.id}/vergelijking.png">Vergelijkingsblad (PNG)</a></p>
  </div>
  <div class="views">
    <div class="desk"><div class="label">Desktop - quizraster</div><div class="grid">${SAMPLES.map((_, i) => card(o.id, i)).join('')}</div>
      <div class="label">Quizpagina - kop (240 px hoog)</div>
      <div class="hero"><span class="chip">${esc(SAMPLES[1].reference)}</span><img src="${o.id}/${SAMPLES[1].slug}.png" alt=""></div>
    </div>
    <div class="phone"><div class="label">Telefoon (390 px)</div><div class="screen">
      <div class="ph-title">Quizzen</div>
      <div class="ph-grid">${SAMPLES.map((_, i) => card(o.id, i)).join('')}</div>
      <div class="ph-sub">Zo klein in een lijst</div>
      <div class="list">${list}</div>
    </div></div>
  </div>
</section>`;
  }).join('\n');

  const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cover stijlopties</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Nunito:wght@600;700;800&display=swap" rel="stylesheet">
<style>
@font-face{font-family:"Fredoka";font-weight:600;src:url(_fonts/Fredoka-600.ttf) format("truetype");font-display:swap}
@font-face{font-family:"Nunito";font-weight:600;src:url(_fonts/Nunito-600.ttf) format("truetype")}
@font-face{font-family:"Nunito";font-weight:700;src:url(_fonts/Nunito-700.ttf) format("truetype")}
@font-face{font-family:"Nunito";font-weight:800;src:url(_fonts/Nunito-800.ttf) format("truetype")}
:root{--bg:#ECEAE4;--card:#FFFFFF;--line:#DEDBD3;--ink:#1F1D1A;--soft:#4A463F;--muted:#77726A;--lapis:#35548C;--lapis-tint:#EAEEF7;--gold:#E9B12E;--coral:#D9734F;--green:#3F6B4F}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:600 16px/1.5 Nunito,system-ui,sans-serif}
.wrap{max-width:1240px;margin:0 auto;padding:48px 24px 80px}
h1,h2,.title,.ph-title{font-family:Fredoka,Nunito,sans-serif;font-weight:600;margin:0}
h1{font-size:44px;line-height:52px}
.lead{max-width:70ch;color:var(--soft);font-size:17px;margin:12px 0 0}
.jump{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 0}
.jump a{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:7px 14px;color:var(--ink);text-decoration:none;font-weight:700;font-size:14px}
.jump a b{color:var(--lapis)}
h2{font-size:32px;line-height:40px}
.sec-title{font-family:Fredoka,sans-serif;font-size:26px;margin:48px 0 6px}
.sec-sub{color:var(--muted);margin:0 0 18px}
.scroller{overflow-x:auto;padding-bottom:6px}
.matrix{display:grid;grid-template-columns:120px repeat(4,minmax(220px,1fr));gap:16px;min-width:1040px;align-items:start}
.colhead{font-family:Fredoka,sans-serif;font-size:20px;display:flex;align-items:center;gap:10px}
.letter{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:999px;background:var(--lapis);color:#fff;font-size:16px}
.rowlabel{font-size:13px;color:var(--muted);padding-top:8px;display:flex;flex-direction:column}
.rowlabel b{color:var(--ink);font-size:14px}
.card{display:flex;flex-direction:column;min-width:0;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;color:var(--ink);text-decoration:none}
.card:hover{border-color:#CFCBC1}
.cover{display:block;margin:8px 8px 0;border-radius:10px;overflow:hidden;aspect-ratio:16/9;background:var(--lapis-tint)}
.cover img{display:block;width:100%;height:100%;object-fit:cover}
.body{display:flex;flex-direction:column;gap:3px;padding:14px 16px 16px}
.kicker{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--lapis)}
.title{font-size:18px;line-height:23px}
.meta{font-size:13px;color:var(--muted)}
.option{margin-top:56px;padding-top:40px;border-top:1px solid var(--line)}
.intro{display:grid;grid-template-columns:1fr;gap:4px;max-width:820px}
.opt-eyebrow{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--lapis)}
.tag{font-size:18px;color:var(--ink);margin:4px 0 0}
.intro p{margin:8px 0 0;color:var(--soft)}
.pc{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}
.pc>div,.scale{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 18px}
.scale{margin-top:16px}
h3{margin:0 0 6px;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
ul{margin:0;padding-left:18px;color:var(--soft)}
li{margin:3px 0}
.files a{color:var(--lapis);font-weight:800}
.views{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:32px;margin-top:28px;align-items:start}
.label{font-size:13px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin:0 0 10px}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-bottom:28px}
.hero{position:relative;height:240px;border-radius:16px;overflow:hidden;border:8px solid var(--card);outline:1px solid var(--line)}
.hero img{width:100%;height:100%;object-fit:cover;display:block}
.chip{position:absolute;left:16px;top:16px;background:var(--card);border-radius:999px;padding:5px 12px;font-size:13px;font-weight:800;color:var(--lapis)}
.phone .screen{width:100%;max-width:390px;background:var(--bg);border:1px solid var(--line);border-radius:28px;padding:22px 16px;box-shadow:0 1px 0 var(--line)}
.ph-title{font-size:28px;margin-bottom:14px}
.ph-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ph-grid .title{font-size:16px;line-height:20px}
.ph-grid .body{padding:10px 12px 12px}
.ph-grid .meta{font-size:12px}
.ph-sub{font-family:Fredoka,sans-serif;font-size:20px;margin:22px 0 10px}
.list{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.row{display:flex;gap:12px;align-items:center;padding:10px 12px;border-top:1px solid var(--line)}
.row:first-child{border-top:0}
.row img{width:88px;height:50px;border-radius:8px;object-fit:cover;flex:none}
.row>span{display:flex;flex-direction:column;min-width:0}
.rtitle{font-weight:800;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media (max-width:1000px){.views{grid-template-columns:minmax(0,1fr)}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:560px){.wrap{padding:28px 16px 60px}h1{font-size:32px;line-height:40px}.pc{grid-template-columns:1fr}.hero{height:180px}.phone .screen{padding:18px 12px}}
</style></head>
<body><div class="wrap">
<h1>Nieuwe quizcovers: vier stijlen</h1>
<p class="lead">Elke optie toont dezelfde zes quizzen (OT-verhaal, NT-verhaal, poëzie, profeet, brief van Paulus en een thema), zodat je eerlijk kunt vergelijken. Alles is in code getekend, dus de gekozen stijl kan daarna voor alle quizzen worden gegenereerd. Kies er één; daarna maken we de covers voor alle quizzen.</p>
<div class="jump">${OPTIONS.map((o) => `<a href="#${o.id}"><b>${o.letter}</b> ${esc(o.name)}</a>`).join('')}</div>
<div class="sec-title">Naast elkaar</div>
<p class="sec-sub">Als quizkaart in de 2.0-stijl, zoals op de pagina Quizzen. Scroll opzij op een smal scherm.</p>
<div class="scroller"><div class="matrix"><div></div>${head}${rows}</div></div>
${sections}
</div></body></html>
`;
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}
