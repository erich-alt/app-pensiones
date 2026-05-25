// Hotfix v10: lectura robusta F22 y explicación de diferencia por reajuste SII.
// Se carga después de ingresos-pension.js y sobreescribe funciones globales.
function _moneyPattern(){return '-?\\d{1,3}(?:\\.\\d{3})+';}
function _firstMoney(text,re){let m=text.match(re);return m&&m[1]?clp(m[1]):0;}
function _allMoney(text,re){let out=[],m;while((m=re.exec(text))!==null){if(m[1])out.push(clp(m[1]));}return out;}
function parseRentaText(text,source){
  let c=clean(text);
  let mp=_moneyPattern();
  let at=+(c.match(/AÑO\s+TRIBUTARIO\s+(20\d{2})/i)||[])[1]||+(c.match(/AT\s*(20\d{2})/i)||[])[1]||new Date().getFullYear();
  let folio=(c.match(/Folio\s*N[°º]?\s*(\d+)/i)||c.match(/07\s*N[°º]?\s*(\d+)/i)||[])[1]||'';
  let base=_firstMoney(c,new RegExp('\\b170\\b\\s+('+mp+')\\s+BASE\\s+IMPONIBLE','i'))||_firstMoney(c,new RegExp('\\b1098\\b[\\s\\S]{0,180}?('+mp+')','i'))||_firstMoney(c,new RegExp('\\b161\\b[\\s\\S]{0,120}?('+mp+')','i'));
  let sueldo1098=_firstMoney(c,new RegExp('\\b1098\\b[\\s\\S]{0,180}?('+mp+')','i'))||base;
  let rta161=_firstMoney(c,new RegExp('\\b161\\b[\\s\\S]{0,160}?('+mp+')','i'))||base;
  let subtotal158=_firstMoney(c,new RegExp('\\b158\\b[\\s\\S]{0,120}?('+mp+')','i'));
  let credit=_firstMoney(c,new RegExp('\\b162\\b\\s+Cr[eé]dito[\\s\\S]{0,240}?('+mp+')','i'))||_firstMoney(c,new RegExp('\\b162\\b[\\s\\S]{0,80}?('+mp+')','i'));
  let determined=_firstMoney(c,new RegExp('\\b157\\b\\s+IGC[\\s\\S]{0,240}?('+mp+')','i'))||_firstMoney(c,new RegExp('\\b157\\b[\\s\\S]{0,100}?('+mp+')','i'));
  let rem119=_firstMoney(c,new RegExp('\\b119\\b\\s+('+mp+')','i'));
  let debit304=_firstMoney(c,new RegExp('\\b304\\b\\s+('+mp+')','i'));
  let result305=_firstMoney(c,new RegExp('\\b305\\b\\s+RESULTADO[\\s\\S]{0,240}?('+mp+')','i'))||_firstMoney(c,new RegExp('RESULTADO\\s+LIQUIDACI[ÓO]N[\\s\\S]{0,140}?('+mp+')','i'));
  let rem757=_firstMoney(c,new RegExp('\\b757\\b[\\s\\S]{0,120}?('+mp+')','i'));
  let refund=_firstMoney(c,new RegExp('MONTO\\s+DEVOLUCI[ÓO]N\\s+SOLICITADA\\s+87\\s+('+mp+')','i'))||_firstMoney(c,new RegExp('\\b87\\b\\s+('+mp+')\\s*=','i'))||_firstMoney(c,new RegExp('SALDO\\s+A\\s+FAVOR\\s+85\\s+('+mp+')','i'))||Math.max(0,-result305)||rem119||rem757;
  let pay=_firstMoney(c,new RegExp('TOTAL\\s+A\\s+PAGAR[\\s\\S]{0,120}\\b94\\b\\s+('+mp+')','i'))||_firstMoney(c,new RegExp('\\b94\\b\\s+('+mp+')\\s*=','i'))||Math.max(0,result305);
  let codes={119:rem119,157:determined,158:subtotal158||base,161:rta161,162:credit,170:base,304:debit304,305:result305,757:rem757,1098:sueldo1098,85:refund,87:refund,91:pay,94:pay};
  return{id:'f22_'+at+'_'+Date.now(),taxYear:at,incomeYear:at-1,folio,source,baseF22:base,creditIusc:credit,determinedTax:determined,resultCode305:result305,refund,pay,codes,createdAt:new Date().toISOString()};
}
function renderRenta(){
  if(!$('rF22Base'))return;
  let r=selectedRenta();
  if(!r){
    ['rF22Base','rAppBase','rDiffBase','rResult','rF22Credit','rAppTax','rPension'].forEach(id=>$(id).textContent=money(0));
    $('rPayRefund').textContent='—';
    $('rCodes').innerHTML='<p class="note">Sin Formulario 22 cargado.</p>';
    $('rIncomeTbl').innerHTML='<p class="note">Sin Formulario 22 cargado.</p>';
    $('rPensionTbl').innerHTML='<p class="note">Sin Formulario 22 cargado.</p>';
    if($('rFlowTbl'))$('rFlowTbl').innerHTML='<p class="note">Sin Formulario 22 cargado.</p>';
    return;
  }
  let R=S.records.filter(x=>isRealTaxableRecord(x)&&+x.taxYear===+r.taxYear);
  let Proj=S.records.filter(x=>isTaxableRecord(x)&&x.isProjected&&+x.taxYear===+r.taxYear);
  let F=S.records.filter(x=>!isTaxableRecord(x)&&+x.managementYear===+r.incomeYear);
  let P=S.pensions.filter(p=>y(p.paymentDate)===+r.incomeYear);
  let appBase=R.reduce((s,x)=>s+clp(x.taxableBaseClp),0);
  let appTax=R.reduce((s,x)=>s+clp(x.withheldTaxClp),0);
  let pen=P.reduce((s,p)=>s+clp(p.amountClp),0);
  let flow=F.reduce((s,x)=>s+clp(x.netClp),0);
  let projBase=Proj.reduce((s,x)=>s+clp(x.taxableBaseClp),0);
  let diff=appBase-clp(r.baseF22);
  let impliedBasePct=appBase?((clp(r.baseF22)/appBase-1)*100):0;
  let impliedTaxAdj=clp(r.creditIusc)-appTax;
  $('rF22Base').textContent=money(r.baseF22);
  $('rAppBase').textContent=money(appBase);
  $('rDiffBase').textContent=money(diff);
  $('rResult').textContent=money(r.refund||r.pay||0);
  $('rF22Credit').textContent=money(r.creditIusc);
  $('rAppTax').textContent=money(appTax);
  $('rPension').textContent=money(pen);
  $('rPayRefund').textContent=r.refund?('Devolución '+money(r.refund)):(r.pay?('Pago '+money(r.pay)):'Sin pago/devolución');
  $('rPayRefund').className='v mono '+(r.refund?'good':(r.pay?'bad':''));
  $('rCodes').innerHTML=codesTbl(r);
  let note='<p class="note"><b>Lectura:</b> la Base app suma las bases de liquidaciones/Excel en pesos del mes. La Base F22 viene informada por SII ya actualizada para la declaración anual. Diferencia F22 vs app: <b>'+money(clp(r.baseF22)-appBase)+'</b> ('+impliedBasePct.toFixed(2)+'% implícito). Crédito IUSC F22 vs impuesto app: <b>'+money(impliedTaxAdj)+'</b>. Esto no necesariamente es error; normalmente corresponde al reajuste/actualización anual de rentas e impuesto retenido.</p>';
  $('rIncomeTbl').innerHTML=note+(Proj.length?'<p class="note">Proyectados excluidos de comparación F22: <b>'+money(projBase)+'</b>.</p>':'')+tbl(R);
  $('rPensionTbl').innerHTML=ptbl(P);
  if($('rFlowTbl'))$('rFlowTbl').innerHTML=(flow?'<p class="note">Total flujo no tributable del año renta: <b>'+money(flow)+'</b>. Suma caja, pero no base imponible ni F22.</p>':'')+tbl(F);
}
try{render();}catch(e){console.warn('hotfix render error',e);}
