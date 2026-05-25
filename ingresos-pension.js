const STORE='ing_pen_v5';
const OLD_STORES=['ing_pen_v4','ing_pen_v3','ingresos_pension_public_v1'];
let S=load(),xprev=[],pprev=null;
const $=id=>document.getElementById(id);
const meses={ENERO:1,FEBRERO:2,MARZO:3,ABRIL:4,MAYO:5,JUNIO:6,JULIO:7,AGOSTO:8,SEPTIEMBRE:9,SETIEMBRE:9,OCTUBRE:10,NOVIEMBRE:11,DICIEMBRE:12};
const mn=['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function clp(v){
  if(typeof v==='number')return Math.round(v)||0;
  let s=String(v??'').trim(); if(!s)return 0;
  let neg=s[0]=='-'||/\(.+\)/.test(s);
  s=s.replace(/[^\d,.-]/g,''); if(!s)return 0;
  let p=s.split(/[,.]/),last=p[p.length-1],hasDec=p.length>1&&last.length>0&&last.length<=2;
  let n=hasDec?Number(p.slice(0,-1).join('').replace(/\D/g,'')+'.'+last.replace(/\D/g,'')):Number(s.replace(/\D/g,''));
  return Math.round((neg?-1:1)*(n||0));
}
function dec(v){
  if(typeof v==='number')return v||0;
  let s=String(v??'').replace(/[^\d,.-]/g,''); if(!s)return 0;
  let i=Math.max(s.lastIndexOf(','),s.lastIndexOf('.'));
  return i>-1?Number(s.slice(0,i).replace(/\D/g,'')+'.'+s.slice(i+1).replace(/\D/g,''))||0:Number(s.replace(/\D/g,''))||0;
}
function money(n){return '$'+Math.round(+n||0).toLocaleString('es-CL')}
function pct(a,b){return b?((a/b)*100).toFixed(1)+'%':'0%'}
function y(d){return +String(d||'').slice(0,4)||new Date().getFullYear()}
function ym(d){return String(d||'').slice(0,7)}
function ld(Y,M){return new Date(Y,M,0).getDate()}
function taxYearFromIncomeYear(v){return (+v||0)+1}
function load(){
  try{
    let cur=localStorage.getItem(STORE); if(cur)return normalizeState(JSON.parse(cur));
    for(let k of OLD_STORES){let old=localStorage.getItem(k); if(old)return normalizeState(JSON.parse(old));}
    return{records:[],pensions:[]};
  }catch(e){return{records:[],pensions:[]}}
}
function normalizeState(st){
  st=st||{records:[],pensions:[]}; st.records=st.records||[]; st.pensions=st.pensions||[];
  st.records=st.records.map(r=>{
    let mg=+r.managementYear||((r.type==='bonus')?y(r.paymentDate)-1:y(r.paymentDate));
    let py=+r.paymentYear||y(r.paymentDate);
    return {...r,paymentYear:py,managementYear:mg,taxYear:+r.taxYear||taxYearFromIncomeYear(mg)};
  });
  return st;
}
function save(){localStorage.setItem(STORE,JSON.stringify(S));render()}
function nav(id){document.querySelectorAll('section').forEach(s=>s.classList.remove('on'));$(id).classList.add('on');document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===id));render()}
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>nav(b.dataset.t));
function nk(s){return String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()}
function pick(o,arr){for(let want of arr){for(let k in o){let a=nk(k),b=nk(want);if(a===b||a.replace(/_\d+$/,'')===b)return o[k]}}return''}
function fmonth(v){let t=nk(v).toUpperCase();for(let k in meses)if(t.includes(k))return meses[k];let n=+v;return n>=1&&n<=12?n:0}
function gyear(name){let m=String(name).match(/20\d{2}/);return m?+m[0]:new Date().getFullYear()}
function payDate(Y,M){let d=$('payDay').value,dd=d==='last'?ld(Y,M):Math.min(+d,ld(Y,M));return`${Y}-${String(M).padStart(2,'0')}-${String(dd).padStart(2,'0')}`}
function years(){
  let a=[new Date().getFullYear(),...S.records.map(r=>r.paymentYear||y(r.paymentDate)),...S.records.map(r=>r.managementYear),...S.records.map(r=>r.taxYear),...S.pensions.map(p=>y(p.paymentDate))].filter(Boolean);
  let u=[...new Set(a)].sort((a,b)=>b-a),cur=$('year').value||u[0];
  $('year').innerHTML=u.map(v=>`<option ${v==cur?'selected':''}>${v}</option>`).join('');
}
function inScope(r,scope,Y){
  if(scope==='pay')return +(r.paymentYear||y(r.paymentDate))===Y;
  if(scope==='income')return +r.managementYear===Y;
  if(scope==='tax')return +(r.taxYear||taxYearFromIncomeYear(r.managementYear))===Y;
  return false;
}
function render(){
  years();
  let Y=+$('year').value||new Date().getFullYear(),scope=$('scope').value;
  let R=S.records.filter(r=>inScope(r,scope,Y)),P=S.pensions.filter(p=>y(p.paymentDate)===Y);
  let net=R.reduce((s,r)=>s+clp(r.netClp),0),sal=R.filter(r=>r.type==='salary').reduce((s,r)=>s+clp(r.netClp),0),base=R.reduce((s,r)=>s+clp(r.taxableBaseClp),0),tax=R.reduce((s,r)=>s+clp(r.withheldTaxClp),0),pen=P.reduce((s,p)=>s+clp(p.amountClp),0),uf=R.reduce((s,r)=>s+(dec(r.netUf)||(dec(r.ufValue)?clp(r.netClp)/dec(r.ufValue):0)),0);
  $('mNet').textContent=money(net);$('mBase').textContent=money(base);$('mTax').textContent=money(tax);$('mPen').textContent=money(pen);$('mPctS').textContent=pct(pen,sal);$('mPctT').textContent=pct(pen,net);$('mUf').textContent=uf.toFixed(2);$('mCount').textContent=R.length;
  $('tblYear').innerHTML=tbl(R);$('tblAll').innerHTML=tbl(S.records,true);$('tblPen').innerHTML=ptbl(S.pensions);
}
function typ(t){return{salary:'Sueldo',bonus:'Bono',extra:'Extra',other:'Otro'}[t]||t||''}
function status(r){return r.isProjected?'<span class="warn">Proyectado</span>':'Real'}
function tbl(a,del=false){
  if(!a.length)return'<p class="note">Sin ingresos.</p>';
  return '<table><tr><th>Fecha pago</th><th>Tipo</th><th>Detalle</th><th>Líquido</th><th>Base</th><th>Imp.</th><th></th></tr>'+a.slice().sort((a,b)=>String(b.paymentDate).localeCompare(String(a.paymentDate))).map(r=>`<tr><td>${r.paymentDate||''}<br><span class="note">AT ${r.taxYear||taxYearFromIncomeYear(r.managementYear)}</span></td><td>${typ(r.type)}<br><span class="note">${status(r)}</span></td><td>${r.description||''}<br><span class="note">Renta/gestión ${r.managementYear||''} · ${r.source||''}</span></td><td class="mono">${money(r.netClp)}</td><td class="mono">${money(r.taxableBaseClp)}</td><td class="mono">${money(r.withheldTaxClp)}</td><td>${del?`<button class="btn btn2" onclick="delRec('${r.id}')">Borrar</button>`:''}</td></tr>`).join('')+'</table>';
}
function ptbl(a){if(!a.length)return'<p class="note">Sin pensiones.</p>';return'<table><tr><th>Fecha</th><th>Mes</th><th>Monto</th><th>Nota</th><th></th></tr>'+a.map(p=>`<tr><td>${p.paymentDate}</td><td>${p.month||''}</td><td>${money(p.amountClp)}</td><td>${p.note||''}</td><td><button class="btn btn2" onclick="delPen('${p.id}')">Borrar</button></td></tr>`).join('')+'</table>'}
function delRec(id){S.records=S.records.filter(r=>r.id!==id);save()}
function delPen(id){S.pensions=S.pensions.filter(p=>p.id!==id);save()}
function upsertRecord(r){
  r.taxYear=+r.taxYear||taxYearFromIncomeYear(r.managementYear);
  let key=x=>x.type===r.type&&x.paymentDate===r.paymentDate&&(x.type==='salary'||x.type==='bonus');
  let idx=S.records.findIndex(key);
  if(idx>=0)S.records[idx]={...S.records[idx],...r,id:S.records[idx].id||r.id}; else S.records.push(r);
}
function addIncome(){
  let d=$('iDate').value||new Date().toISOString().slice(0,10),uf=dec($('iUf').value),net=clp($('iNet').value),mg=clp($('iMgmt').value)||y(d);
  upsertRecord({id:'r'+Date.now(),paymentDate:d,paymentYear:y(d),type:$('iType').value,managementYear:mg,taxYear:taxYearFromIncomeYear(mg),description:$('iDesc').value||'Ingreso manual',netClp:net,taxableBaseClp:clp($('iBase').value),withheldTaxClp:clp($('iTax').value),ufValue:uf,netUf:uf?net/uf:0,source:'Manual',isProjected:false});save();
}
function addPen(){let d=$('aDate').value||new Date().toISOString().slice(0,10);S.pensions.push({id:'p'+Date.now(),paymentDate:d,month:$('aMonth').value||ym(d),amountClp:clp($('aAmt').value),note:$('aNote').value||''});save()}
async function readExcel(){
  let f=$('xls').files[0]; if(!f)return $('xlsMsg').textContent='Selecciona un Excel/CSV.'; if(!window.XLSX)return $('xlsMsg').textContent='No cargó XLSX. Abre la app con internet.';
  try{
    let wb=XLSX.read(await f.arrayBuffer(),{type:'array',cellDates:true});
    let rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:'',raw:false});
    let incomeYear=clp($('xlsYear').value)||gyear(f.name); $('xlsYear').value=incomeYear; xprev=[];
    let currentYear=new Date().getFullYear();
    rows.forEach((r,i)=>{
      let mesRaw=pick(r,['Mes','Periodo','Month']); let M=fmonth(mesRaw); if(!M)return;
      let label=nk(mesRaw); if(label==='total')return;
      let gross=clp(pick(r,['Total Haberes','Haberes'])),base=clp(pick(r,['Afecto a Impuesto','Afecto Impuesto','Base Tributable','Tributable'])),baseLiq=clp(pick(r,['Afecto Impuesto Liquidación','Afecto Impuesto Liquidacion'])),tax=clp(pick(r,['Impuesto','Impuesto Retenido'])),liq=clp(pick(r,['Liquido','Líquido','Ingreso Liquido','Ingreso Líquido'])),total=clp(pick(r,['Ingreso Final','Total Ingresos','Total Ingresos- CAF']));
      let hasRealValues=(gross>0||base>0||baseLiq>0||tax>0||liq>0||total>0); if(!hasRealValues)return;
      let isBonus=label.includes('bono')||label.includes('gratificacion');
      let isNextYear=label.includes('ano siguiente')||label.includes('año siguiente');
      let paymentYear=isNextYear?incomeYear+1:incomeYear;
      let managementYear=incomeYear;
      let taxYear=incomeYear+1;
      let isProjected=(isNextYear&&incomeYear>=currentYear)||label.includes('proyect');
      let type=isBonus?'bonus':'salary';
      let d=payDate(paymentYear,M);
      let desc=isBonus?`Bono gestión ${incomeYear} pagado ${paymentYear} · AT ${taxYear}`:`Liquidación ${mn[M]} ${incomeYear}`;
      xprev.push({id:'x'+Date.now()+i,paymentDate:d,paymentYear,type,managementYear,taxYear,description:desc,grossClp:gross,deductionsClp:clp(pick(r,['Descuentos','Total Descuentos'])),taxableBaseClp:base||baseLiq,withheldTaxClp:tax,retencionSiiClp:clp(pick(r,['Retension SII','Retención SII','Retensión SII'])),netClp:liq||total,finalIncomeClp:total||liq,afpClp:clp(pick(r,['AFP',' AFP'])),healthClp:clp(pick(r,['Isapre','Salud'])),afcClp:clp(pick(r,['AFC'])),ccafClp:clp(pick(r,['CAFR','CCAF'])),ufValue:dec(pick(r,['UF','Valor UF','UF fecha pago'])),source:'Excel '+f.name,isProjected});
      Object.keys(r).filter(k=>nk(k).startsWith('ing extra')).forEach((k,j)=>{let a=clp(r[k]);if(a>0)xprev.push({id:'e'+Date.now()+i+j,paymentDate:d,paymentYear,type:'extra',managementYear:incomeYear,taxYear,description:String(pick(r,['Motivo','Motivo_'+(j+1)])||`Ingreso extra ${mn[M]} ${incomeYear}`),netClp:a,taxableBaseClp:0,withheldTaxClp:0,source:'Excel '+f.name,isProjected:false})});
    });
    $('tblPrev').innerHTML=tbl(xprev);$('prevX').classList.remove('hide');$('xlsMsg').textContent=`Leídos ${xprev.length} registros. Revisa y guarda. El año del Excel se trata como año renta/gestión; el AT es el año siguiente.`;
  }catch(e){$('xlsMsg').textContent='No pude leer el Excel: '+(e.message||e)}
}
function saveExcel(){if(!xprev.length)return;xprev.forEach(r=>upsertRecord({...r,id:r.id+'_'+Math.random().toString(36).slice(2,6)}));xprev=[];$('prevX').classList.add('hide');save();nav('sDash')}
function clean(t){return String(t||'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\n+/g,'\n')}
function grab(c,re){let m=c.match(re);if(!m)return 0;for(let i=m.length-1;i>0;i--)if(/[0-9]/.test(String(m[i])))return clp(m[i]);return 0}
function parseTxt(){try{pprev=parseLiquid($('txt').value,'Texto pegado');showP(pprev);$('pdfMsg').textContent='Texto leído. Revisa antes de guardar.'}catch(e){$('pdfMsg').textContent=e.message||'No pude leer.'}}
function parseLiquid(text,source){
  let c=clean(text),u=c.toUpperCase();
  let title=c.match(/(Liquidaci[oó]n\/Reliquidaci[oó]n\s+Remuneraciones|Gratificaci[oó]n)\s+([A-ZÁÉÍÓÚÑ]+)\s+del\s+(20\d{2})/i);
  let yy=title?+title[3]:+(u.match(/\b(20\d{2})\b/)||[])[1],M=title?meses[title[2].toUpperCase()]:0;
  if(!M){for(let k in meses)if(u.includes(k)){M=meses[k];break}}
  if(!yy||!M)throw Error('No encontré mes/año.');
  let type=/BONO\s+GESTI[OÓ]N|GRATIFICACI[OÓ]N\s+[A-ZÁÉÍÓÚÑ]+\s+DEL/i.test(u)?'bonus':'salary';
  let managementYear=type==='bonus'?yy-1:yy;
  let taxYear=taxYearFromIncomeYear(managementYear);
  let d=`${yy}-${String(M).padStart(2,'0')}-${String(ld(yy,M)).padStart(2,'0')}`;
  let imp=c.match(/IMPUESTO[^\n]*?Trib\s*[:\s]*([\d.,]+)\s+([\d.,]+)/i)||[];
  let tot=[...c.matchAll(/Totales\s*\n?\s*([\d.,]+)\s*E?\s*\n?\s*([\d.,]+)\s*E?/gi)].pop()||[];
  return{id:'r'+Date.now(),paymentDate:d,paymentYear:yy,type,managementYear,taxYear,description:(type==='bonus'?`Bono gestión ${managementYear} pagado ${yy} · AT ${taxYear}`:'Liquidación '+mn[M]+' '+yy),grossClp:clp(tot[1]),deductionsClp:clp(tot[2]),taxableBaseClp:clp(imp[1]),withheldTaxClp:clp(imp[2]),netClp:grab(c,/Monto\s+l[ií]quido\D+([\d.,]+)/i),afpClp:grab(c,/AFP[^\n]*?([\d.,]+)\s*(?:\n|$)/i),healthClp:grab(c,/(VIDA\s+TRES|ISAPRE|SALUD)[^\n]*?([\d.,]+)\s*(?:\n|$)/i),afcClp:grab(c,/AFC\s+([\d.,]+)/i),ccafClp:grab(c,/PRESTAMO\s+CCAF[^\n]*?([\d.,]+)/i),source:'PDF '+source,isProjected:false};
}
async function readPdf(){let f=$('pdf').files[0];if(!f)return $('pdfMsg').textContent='Selecciona PDF.';try{pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';let doc=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise,t='';for(let i=1;i<=doc.numPages;i++){let p=await doc.getPage(i),tc=await p.getTextContent();t+=tc.items.map(x=>x.str).join('\n')+'\n'}$('txt').value=t;pprev=parseLiquid(t,f.name);showP(pprev);$('pdfMsg').textContent='PDF leído. Si coincide con una fila Excel, la reemplazará por el dato real.'}catch(e){$('pdfMsg').textContent='No pude leer PDF: '+(e.message||e)+'. Usa Excel o pega texto.'}}
function showP(r){$('prevP').classList.remove('hide');$('pDate').value=r.paymentDate;$('pType').value=r.type;$('pMgmt').value=r.managementYear;$('pDesc').value=r.description;$('pNet').value=r.netClp||'';$('pBase').value=r.taxableBaseClp||'';$('pTax').value=r.withheldTaxClp||'';$('pUf').value=''}
function savePdfPrev(){let d=$('pDate').value,uf=dec($('pUf').value),net=clp($('pNet').value),mg=clp($('pMgmt').value)||(($('pType').value==='bonus')?y(d)-1:y(d));upsertRecord({...pprev,id:'r'+Date.now(),paymentDate:d,paymentYear:y(d),type:$('pType').value,managementYear:mg,taxYear:taxYearFromIncomeYear(mg),description:$('pDesc').value,netClp:net,taxableBaseClp:clp($('pBase').value),withheldTaxClp:clp($('pTax').value),ufValue:uf,netUf:uf?net/uf:0,isProjected:false});$('prevP').classList.add('hide');save();nav('sDash')}
function downloadJson(){let a=document.createElement('a'),b=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});a.href=URL.createObjectURL(b);a.download='respaldo_ingresos_pension.json';a.click();URL.revokeObjectURL(a.href)}
async function importJson(){try{let j=JSON.parse(await $('json').files[0].text());S=normalizeState({records:j.records||[],pensions:j.pensions||[]});save();$('bMsg').textContent='Importado.'}catch(e){$('bMsg').textContent='No pude importar JSON.'}}
function clearAll(){if(confirm('¿Borrar datos locales?')){S={records:[],pensions:[]};save()}}
render();