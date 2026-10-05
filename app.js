const icons={search:'<circle cx="10.8" cy="10.8" r="7.2"/><path d="m16 16 5 5"/>',x:'<path d="m6 6 12 12M6 18 18 6"/>',book:'<path d="M12 5v15M12 5C8 2 3 3 3 3v15s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Z"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/>',link:'<path d="m10 13 4-4M8 15l-2 2a4 4 0 0 1-5.5-5.5l5-5A4 4 0 0 1 11 6m2 12a4 4 0 0 0 5.5-.5l5-5A4 4 0 0 0 18 7l-2 2" transform="translate(0 -1) scale(.95)"/>',message:'<path d="M21 11.5a9 9 0 0 1-13.5 7.8L3 21l1.7-4.5A9 9 0 1 1 21 11.5Z"/><path d="M8 8c1 4 4 6 7 7l2-2-3-2-1 1-2-2 1-1-2-3z"/>'};
const svg=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]||icons.book}</svg>`;
const icon=name=>`<span class="icon">${svg(name)}</span>`;
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=svg(el.dataset.icon));
const brand='Quem compara vota Lula';
const themes=[['all','Todos'],['educacao','Educação'],['saude','Saúde'],['emprego','Emprego e renda'],['fome','Fome e alimentação'],['economia','Economia'],['ambiente','Meio ambiente'],['social','Programas sociais'],['internacional','Internacional'],['seguranca','Segurança pública'],['orcamento','Orçamento'],['infraestrutura','Infraestrutura'],['mulheres','Mulheres'],['moradia','Moradia'],['energia','Energia e combustíveis'],['agricultura','Agricultura'],['congresso','Congresso'],['democracia','Democracia']].map(([id,label])=>({id,label}));
const formats=[{id:'card',label:'Cards para compartilhar',description:'As artes originais do guia comparativo, prontas para baixar e compartilhar.'},{id:'pocket',label:'Dados de bolso',description:'Os indicadores do guia de bolso em texto acessível. Abra uma comparação para ler e baixar seu card.'},{id:'reference',label:'Entregas e fontes',description:'As reportagens e referências do guia “Veja o que Lula fez”, organizadas por tema e período.'}];
let cards=[],selected='all',format='card',active=null,toastTimer,lastFocused=null;
const $=id=>document.getElementById(id),search=$('search'),dialog=$('card-dialog');
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const themeLabel=id=>themes.find(t=>t.id===id)?.label||'';
const compact=s=>String(s||'').replace(/\s+/g,' ').trim();
const shortened=(s,n=150)=>{s=compact(s);return s.length>n?s.slice(0,n).replace(/\s+\S*$/,'')+'…':s};
const imagePath=(c,thumb=false)=>`assets/${thumb?'thumbs':'cards'}/${String(c.page).padStart(2,'0')}.${thumb?'webp':'jpg'}`;
const cardUrl=c=>{const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('card',c.id);return u.href;};
const whatsUrl=c=>`https://wa.me/?text=${encodeURIComponent(`${c.title} — ${brand}\n\nVeja o conteúdo e compartilhe:\n${cardUrl(c)}`)}`;
const terms=()=>normalize(search.value.trim()).split(/\s+/).filter(Boolean);
const textMatch=c=>terms().every(t=>c.searchText.includes(t));
const matches=c=>(selected==='all'||c.theme===selected)&&textMatch(c);
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3800);}
function renderControls(){
 $('themes').innerHTML=themes.filter(t=>t.id==='all'||cards.some(c=>c.theme===t.id)||selected===t.id).map(t=>{const count=cards.filter(c=>c.kind===format&&(t.id==='all'||c.theme===t.id)&&textMatch(c)).length;return `<button class="theme-button" data-theme="${t.id}" aria-pressed="${t.id===selected}">${t.label}<span class="theme-number">${count}</span></button>`}).join('');
 $('formats').innerHTML=formats.map(f=>`<button class="format-button" data-format="${f.id}" aria-pressed="${f.id===format}">${f.label}<span>${cards.filter(c=>c.kind===f.id&&matches(c)).length}</span></button>`).join('');
 $('format-description').textContent=formats.find(f=>f.id===format).description;
}
function renderCard(c,i){return `<article class="card"><button class="card-view" data-card="${c.id}" aria-label="Abrir card: ${escape(c.title)}"><div class="card-image"><img src="${imagePath(c,true)}" alt="Card sobre ${escape(c.title)}. Abra para ver a imagem completa." width="540" height="960" loading="${i<4?'eager':'lazy'}" decoding="async"><span class="view-badge">${icon('search')} Ver card</span></div><div class="card-copy"><span class="card-theme">${themeLabel(c.theme)}</span><h3>${escape(c.title)}</h3></div></button><div class="card-actions"><a href="${whatsUrl(c)}" target="_blank" rel="noopener" aria-label="Enviar link de ${escape(c.title)} no WhatsApp">${icon('message')} WhatsApp</a><a href="${imagePath(c)}" download="quem-compara-vota-lula-${c.id}.jpg" aria-label="Baixar imagem: ${escape(c.title)}">${icon('download')} Baixar</a></div></article>`;}
function renderPocket(c){const preview=c.body?`<p class="text-preview">${escape(shortened(c.body,240))}</p>`:`<div class="comparison-preview"><div><b>${escape(c.leftLabel)}</b><p>${escape(shortened(c.left))}</p></div><div><b>${escape(c.rightLabel)}</b><p>${escape(shortened(c.right))}</p></div></div>`;return `<article class="text-card"><button class="card-view" data-card="${c.id}"><span class="card-theme">${themeLabel(c.theme)}</span><h3>${escape(c.title)}</h3>${preview}<span class="source-chip">Guia de bolso · página ${c.page}</span><span class="read-label">Ver comparação completa</span></button><div class="card-actions"><a href="${whatsUrl(c)}" target="_blank" rel="noopener">${icon('message')} WhatsApp</a><button data-download="${c.id}">${icon('download')} Baixar card</button></div></article>`;}
function renderReference(c){const source=c.pages.flatMap(p=>p.links)[0];return `<article class="text-card"><button class="card-view" data-card="${c.id}"><span class="card-theme">${themeLabel(c.theme)} · Governo ${c.government}</span><h3>${escape(c.title)}</h3><div class="reference-preview"><strong>Reportagens e referências</strong>${escape(shortened(source?.title||c.description,180))}</div><span class="source-chip">${c.source} · páginas ${c.page}–${c.endPage}</span><span class="read-label">Ler conteúdo e consultar fontes</span></button><div class="card-actions"><a href="${whatsUrl(c)}" target="_blank" rel="noopener">${icon('message')} Compartilhar no WhatsApp</a></div></article>`;}
function render(){
 const filtered=cards.filter(c=>c.kind===format&&matches(c));
 $('results-title').textContent=terms().length?`Resultados para “${search.value.trim()}”`:selected==='all'?formats.find(f=>f.id===format).label:themeLabel(selected);
 const type=format==='card'?'card':format==='pocket'?'comparação':'conteúdo',plural=format==='card'?'cards':format==='pocket'?'comparações':'conteúdos';
 $('results-count').textContent=`${filtered.length} ${filtered.length===1?type:plural}`;
 $('clear-search').hidden=!search.value;$('reset-top').hidden=selected==='all'&&!terms().length&&format==='card';
 $('empty').hidden=filtered.length>0;$('grid').hidden=filtered.length===0;$('grid').classList.toggle('text-grid',format!=='card');
 $('grid').innerHTML=filtered.map((c,i)=>c.kind==='card'?renderCard(c,i):c.kind==='pocket'?renderPocket(c):renderReference(c)).join('');renderControls();
}
function referenceHtml(c){return c.pages.map((p,i)=>`<details class="source-page" ${i===0?'open':''}><summary>Página ${p.page} · ${p.links.length} ${p.links.length===1?'fonte':'fontes'}</summary><div class="source-page-content">${p.paragraphs.map(g=>{const text=g.text.replace(/^[●○•]\s*/,'');const head=/^[✅🚨⚠]/.test(text);return `<p class="${head?'source-heading':''}">${g.urls?.length?`<a href="${escape(g.urls[0])}" target="_blank" rel="noopener">${escape(text)}</a>${g.urls.slice(1).map((u,j)=>`<a class="more-source" href="${escape(u)}" target="_blank" rel="noopener">Fonte ${j+2}</a>`).join('')}`:escape(text)}</p>`}).join('')}</div></details>`).join('');}
function openCard(id,updateUrl=true){
 const c=cards.find(x=>x.id===id);if(!c)return;active=c;lastFocused=document.activeElement;format=c.kind;
 $('detail-image').hidden=c.kind!=='card';$('detail-content').hidden=c.kind==='card';dialog.querySelector('.detail').classList.toggle('reference-detail',c.kind==='reference');
 $('dialog-title').textContent=c.title;$('detail-theme').textContent=themeLabel(c.theme)+(c.kind==='reference'?` · Governo ${c.government}`:'');$('detail-description').textContent=c.description;
 if(c.kind==='card'){$('detail-image').src=imagePath(c);$('detail-image').alt=`Card original do guia sobre ${c.title}.`;}
 else if(c.kind==='pocket'){$('detail-content').innerHTML=c.body?`<p class="accessible-body">${escape(c.body)}</p>`:`<div class="comparison-full"><section><h3>${escape(c.leftLabel)}</h3><p>${escape(c.left)}</p></section><section><h3>${escape(c.rightLabel)}</h3><p>${escape(c.right)}</p></section></div><p class="source-warning">Valores e períodos conforme o guia de bolso, página ${c.page}.</p>`;}
 else $('detail-content').innerHTML=referenceHtml(c);
 $('detail-download').hidden=c.kind==='reference';$('share-card').innerHTML=icon('share')+(c.kind==='reference'?' Compartilhar conteúdo':' Compartilhar card');
 $('detail-download').innerHTML=icon('download')+(c.kind==='pocket'?' Baixar card':' Baixar imagem');$('detail-download').href=c.kind==='card'?imagePath(c):'#';$('detail-download').download=`quem-compara-vota-lula-${c.id}.jpg`;
 $('detail-whatsapp').href=whatsUrl(c);$('detail-source').href=`${c.sourceFile}#page=${c.page}`;$('detail-source-label').textContent=`${c.source} · ${c.endPage?`páginas ${c.page}–${c.endPage}`:`página ${c.page}`}`;
 $('copy-link').innerHTML=icon('link')+' Copiar link';
 if(updateUrl){const u=new URL(location.href);u.searchParams.set('card',c.id);history.pushState({card:c.id},'',u);}if(!dialog.open){dialog.showModal();document.body.classList.add('modal-open');}dialog.scrollTop=0;
}
function closeCard(){if(dialog.open)dialog.close();document.body.classList.remove('modal-open');active=null;const u=new URL(location.href);u.searchParams.delete('card');history.replaceState({},'',u);lastFocused?.focus();}
async function copyCardLink(){if(!active)return;try{await navigator.clipboard.writeText(cardUrl(active));toast('Link copiado!');}catch{toast('Não foi possível copiar. Use o botão do WhatsApp.');}}
function wrapText(ctx,text,maxWidth){const lines=[];for(const para of String(text).split(/\n\s*\n/)){const words=compact(para).split(' ');let line='';for(const word of words){if(ctx.measureText((line?line+' ':'')+word).width>maxWidth&&line){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);lines.push('');}if(!lines.at(-1))lines.pop();return lines;}
async function makePocketBlob(c){
 const canvas=document.createElement('canvas');canvas.width=1080;let ctx=canvas.getContext('2d');ctx.font='bold 50px Arial';const title=wrapText(ctx,c.title,928);const textSize=!c.body&&compact(c.left+c.right).length<100?64:34,lineHeight=Math.ceil(textSize*1.4);ctx.font=`${textSize}px Arial`;const left=c.body?wrapText(ctx,c.body,880):wrapText(ctx,c.left,880),right=c.body?[]:wrapText(ctx,c.right,880);const headingBottom=225+title.length*60,boxHeight=lines=>Math.max(textSize===64?260:0,100+lines.length*lineHeight);canvas.height=Math.max(1350,headingBottom+boxHeight(left)+(c.body?0:boxHeight(right)+24)+175);
 ctx=canvas.getContext('2d');ctx.fillStyle='#f6faf7';ctx.fillRect(0,0,1080,canvas.height);ctx.fillStyle='#ce1626';ctx.fillRect(0,0,1080,142);ctx.fillStyle='#ffdc32';ctx.font='bold 48px Arial';ctx.fillText('★',65,91);ctx.fillStyle='white';ctx.font='bold 42px Arial';ctx.fillText('Quem compara vota Lula',128,91);
 ctx.fillStyle='#087955';ctx.font='bold 26px Arial';ctx.fillText(themeLabel(c.theme),65,195);ctx.fillStyle='#172c24';ctx.font='bold 50px Arial';title.forEach((line,i)=>ctx.fillText(line,65,267+i*60));let y=headingBottom+25;
 function box(label,lines,bg,color){const h=boxHeight(lines);ctx.fillStyle=bg;ctx.fillRect(60,y,960,h);ctx.fillStyle=color;ctx.fillRect(60,y,7,h);ctx.font='bold 30px Arial';ctx.fillText(label,90,y+48);ctx.fillStyle='#172c24';ctx.font=`${textSize}px Arial`;lines.forEach((line,i)=>ctx.fillText(line,90,y+102+(textSize===64?20:0)+i*lineHeight));y+=h+24;}
 if(c.body)box('Guia de bolso',left,'#fff','#087955');else{box(c.leftLabel,left,'#f9e9eb','#ce1626');box(c.rightLabel,right,'#e4f3e9','#087955');}
 ctx.fillStyle='#617168';ctx.font='24px Arial';ctx.fillText(`Fonte: guia de bolso · página ${c.page}`,65,canvas.height-100);ctx.fillText('Site não oficial · Iniciativa voluntária',65,canvas.height-60);
 return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('export')),'image/jpeg',.95));
}
async function cardBlob(c){if(c.kind==='pocket')return makePocketBlob(c);const r=await fetch(imagePath(c));if(!r.ok)throw Error('image');return r.blob();}
function downloadBlob(blob,c){const a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=`quem-compara-vota-lula-${c.id}.jpg`;a.click();setTimeout(()=>URL.revokeObjectURL(u),10000);}
async function downloadPocket(c){try{downloadBlob(await makePocketBlob(c),c);toast('Card pronto para compartilhar.');}catch{toast('Não foi possível criar a imagem. Você pode compartilhar o link.');}}
$('themes').addEventListener('click',e=>{const b=e.target.closest('[data-theme]');if(!b)return;selected=b.dataset.theme;render();$('themes').querySelector(`[data-theme="${selected}"]`)?.focus({preventScroll:true});});
$('formats').addEventListener('click',e=>{const b=e.target.closest('[data-format]');if(!b)return;format=b.dataset.format;render();$('formats').querySelector(`[data-format="${format}"]`)?.focus({preventScroll:true});});
search.addEventListener('input',render);$('clear-search').addEventListener('click',()=>{search.value='';render();search.focus();});
function reset(){selected='all';format='card';search.value='';render();search.focus({preventScroll:true});}
$('reset').addEventListener('click',reset);$('reset-top').addEventListener('click',reset);
$('grid').addEventListener('click',e=>{const download=e.target.closest('[data-download]');if(download){downloadPocket(cards.find(c=>c.id===download.dataset.download));return;}const b=e.target.closest('[data-card]');if(b)openCard(b.dataset.card);});
$('detail-download').addEventListener('click',e=>{if(active?.kind==='pocket'){e.preventDefault();downloadPocket(active);}});
$('close-dialog').addEventListener('click',closeCard);dialog.addEventListener('cancel',e=>{e.preventDefault();closeCard();});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeCard();}});$('copy-link').addEventListener('click',copyCardLink);
$('share-card').addEventListener('click',async()=>{
 if(!active)return;const c=active,b=$('share-card');b.disabled=true;
 try{if(c.kind==='reference'){if(navigator.share)await navigator.share({title:`${c.title} — ${brand}`,url:cardUrl(c)});else await copyCardLink();}
 else{const blob=await cardBlob(c),file=new File([blob],`quem-compara-vota-lula-${c.id}.jpg`,{type:'image/jpeg'});if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:c.title,text:brand});else if(navigator.share)await navigator.share({title:`${c.title} — ${brand}`,url:cardUrl(c)});else{downloadBlob(blob,c);toast('Imagem baixada. Agora você pode compartilhar o card.');}}
 }catch(e){if(e.name!=='AbortError')toast('Não foi possível compartilhar. Baixe o card ou envie o link no WhatsApp.');}finally{b.disabled=false;}
});
window.addEventListener('popstate',()=>{const id=new URL(location.href).searchParams.get('card');if(id)openCard(id,false);else{dialog.close();document.body.classList.remove('modal-open');active=null;render();}});
async function load(){try{const data=await Promise.all(['cards.json','pocket.json','references.json'].map(async path=>{const r=await fetch(path);if(!r.ok)throw Error('catalog');return r.json();}));cards=[...data[0].map(c=>({...c,kind:'card',source:'Guia comparativo',sourceFile:'assets/guia-comparativo.pdf'})),...data[1],...data[2]];cards.forEach(c=>c.searchText=normalize([c.title,c.description,c.keywords||'',themeLabel(c.theme),c.left||'',c.right||'',c.body||'',...(c.pages||[]).map(p=>p.text)].join(' ')));$('grid').setAttribute('aria-busy','false');$('load-error').hidden=true;const id=new URL(location.href).searchParams.get('card');if(id){const c=cards.find(c=>c.id===id);if(c)format=c.kind;}render();if(id)openCard(id,false);}catch{$('grid').hidden=true;$('grid').setAttribute('aria-busy','false');$('load-error').hidden=false;}}
$('retry').addEventListener('click',load);load();
