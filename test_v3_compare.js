/* E-02 Dray_Cus v2.13 vs v3.0 비교 시험 */
'use strict';
const {JSDOM} = require('jsdom');
const fs = require('fs');

const v213html = fs.readFileSync(__dirname+'/index_v2_13_backup.html','utf8');
const v30html  = fs.readFileSync(__dirname+'/index.html','utf8');
const commonJs = fs.readFileSync('C:\\Users\\李明鎬\\Documents\\LEENAI_COMMON\\v1\\leenai-common.js','utf8');

function extractLastBigJs(html){
  const m=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  return m.filter(x=>x[1].length>1000).pop()?.[1]||'';
}

function def(w,k,v){Object.defineProperty(w,k,{value:v,writable:true,configurable:true});}

function makeDOM(isV30){
  const dom = new JSDOM(`<!DOCTYPE html><html data-theme="dark"><head></head><body>
    <div id="app" style="display:none">
      <div id="matchResult"></div><div id="searchMsg"></div>
      <div id="invoiceResult" style="display:none"></div>
      <select id="vendorSel"></select>
      <div id="step1"></div><div id="step2"></div><div id="step3"></div>
      <div id="step1-sub"></div><div id="step2-sub"></div><div id="step3-sub"></div>
      <button id="matchBtn" disabled></button>
      <button id="precisionBtn" style="display:none"></button>
      <button id="saveBtn" style="display:none"></button>
      <div id="apiKeyInput" value=""></div><div id="apiDot"></div>
      <div id="dashContent"></div><div id="folderBanner"></div><div id="folderPath"></div>
      <div id="monthBar"></div><div id="compassStatus"></div><div id="dashCompassInfo"></div>
      <div id="compassInfo" style="display:none"></div>
      <div id="ocrProgress" style="display:none"></div><div id="ocrFill"></div><div id="ocrStatus"></div>
      <div id="ocrCompanyHint"></div><div id="manualVendorBox" style="display:none"></div>
      <input id="targetMonthInput"><input id="invoiceInput">
      <div id="resInvoice"></div><div id="resContract"></div><div id="resLcNo"></div>
      <div id="screen1Grid"></div><div id="screen2Grid"></div><div id="goodsContainer"></div>
      <input id="cifInput"><div id="insCalcResult" style="display:none"></div>
      <div id="cifDisplayVal"></div><button id="copyBtnCif" style="display:none"></button>
      <div id="insCalcNote"></div>
      <span id="cs-dry"></span><span id="cs-sum"></span><span id="cs-cus"></span>
      <span id="ms-dry"></span><span id="ms-sum"></span><span id="ms-cus"></span>
      <div id="bulkBtn"></div><div id="bulkStopBtn"></div><div id="bulkProgress" style="display:none"></div>
      <div id="bulkProgressTxt"></div><div id="bulkFill"></div>
    </div>
  </body></html>`,
  {url:'https://mhlee205.github.io/Dray_Cus/', runScripts:'outside-only', pretendToBeVisual:true});
  const w=dom.window;
  def(w,'crypto',{subtle:{digest:async()=>new ArrayBuffer(32)},getRandomValues:(a)=>{for(let i=0;i<a.length;i++)a[i]=i%256;return a;}});
  def(w,'sessionStorage',{_d:{},getItem(k){return this._d[k]||null;},setItem(k,v){this._d[k]=v;},removeItem(k){delete this._d[k];}});
  def(w,'localStorage',{_d:{'leenai_apikey_v1':''},getItem(k){return this._d[k]||null;},setItem(k,v){this._d[k]=v;},removeItem(k){delete this._d[k];}});
  def(w,'history',{replaceState:()=>{}});
  def(w,'requestAnimationFrame',(cb)=>setTimeout(cb,0));
  def(w,'navigator',{clipboard:{writeText:async()=>{}}});
  def(w,'indexedDB',{open:()=>({onsuccess:null,onerror:null,onupgradeneeded:null})});
  w.HTMLElement.prototype.scrollIntoView=function(){};
  if(isV30) try{w.eval(commonJs);}catch(e){}
  return dom;
}

const DRY = JSON.stringify([
  {dray:'明邦運送',work_date:'2026-01-10',container_no:'TCKU1234567',Amount:55000,dray_cost:55000,other_expense:0,custom_fee:0,forwarder_cost:0,toll:0},
  {dray:'明邦運送',work_date:'2026-01-15',container_no:'MSCU9876543',Amount:58000,dray_cost:58000,other_expense:0,custom_fee:0,forwarder_cost:0,toll:0},
]);
const CUS = JSON.stringify([
  {forwarder:'O.T.K',date:'2026-01-20',bl_number:'JJCNATALNA61A02',Amount:120000,dray_cost:0,other_expense:0,custom_fee:0,forwarder_cost:0,toll:0},
]);

// eval로 Date 변환 + 주입
const INJECT = `
(function(){
  function toDate(rows){return rows.map(r=>{['work_date','date'].forEach(k=>{if(r[k])r[k]=new Date(r[k]);});return r;});}
  S.compassDry = toDate(${DRY});
  S.compassCus = toDate(${CUS});
  S.compassLoaded = {dry:true, sum:false, cus:true};
})();`;

let passed=0,failed=0;
function ok(label,a,b){
  const as=JSON.stringify(a),bs=JSON.stringify(b);
  if(as===bs){console.log('  ✔ '+label);passed++;}
  else{console.error('  ✖ FAIL: '+label);console.error('    v2.13:',String(a).slice(0,100));console.error('    v3.0: ',String(b).slice(0,100));failed++;}
}

async function runTest(){
  console.log('\n[비교테스트] E-02 v2.13 vs v3.0');
  const d13=makeDOM(false), d30=makeDOM(true);
  const js13=extractLastBigJs(v213html), js30=extractLastBigJs(v30html);
  try{d13.window.eval(js13);}catch(e){console.error('v2.13 eval:',e.message);}
  try{d30.window.eval(js30);}catch(e){console.error('v3.0 eval:',e.message);}
  await new Promise(r=>setTimeout(r,50));
  // COMPASS 주입 (eval로 S スコープにアクセス)
  try{d13.window.eval(INJECT);}catch(e){console.error('v2.13 inject:',e.message);}
  try{d30.window.eval(INJECT);}catch(e){console.error('v3.0 inject:',e.message);}
  // performMatch チェック
  if(!d13.window.performMatch){console.error('v2.13 performMatch undefined');process.exit(1);}
  if(!d30.window.performMatch){console.error('v3.0 performMatch undefined');process.exit(1);}

  const inv1={total_with_tax:124740,tax:11340,total_before_tax:113000,items:[
    {container_no:'TCKU1234567',work_date:'1/10',amount:55000},
    {container_no:'MSCU9876543',work_date:'1/15',amount:58000},
  ]};
  const inv2={total_with_tax:132000,tax:12000,total_before_tax:120000,items:[
    {bl_number:'JJCNATALNA61A02',amount_before_tax:120000},
  ]};

  console.log('\n[TEST 1] performMatch H1 — 明邦運送 202601');
  let r13,r30;
  try{r13=d13.window.performMatch('明邦運送',202601,inv1);}catch(e){console.error('v2.13:',e.message);}
  try{r30=d30.window.performMatch('明邦運送',202601,inv1);}catch(e){console.error('v3.0:',e.message);}
  if(r13&&r30){ok('status',r13.status,r30.status);ok('compassTotal',r13.compassTotal,r30.compassTotal);ok('invoiceTotal',r13.invoiceTotal,r30.invoiceTotal);ok('diff',r13.diff,r30.diff);}

  console.log('\n[TEST 2] performMatch X1 — O.T.K 202601');
  let r13b,r30b;
  try{r13b=d13.window.performMatch('O.T.K',202601,inv2);}catch(e){console.error('v2.13:',e.message);}
  try{r30b=d30.window.performMatch('O.T.K',202601,inv2);}catch(e){console.error('v3.0:',e.message);}
  if(r13b&&r30b){ok('status',r13b.status,r30b.status);ok('compassTotal',r13b.compassTotal,r30b.compassTotal);ok('diff',r13b.diff,r30b.diff);}

  console.log('\n[TEST 3] renderMatchResult 텍스트 일치');
  if(r13&&r30&&d13.window.renderMatchResult&&d30.window.renderMatchResult){
    try{d13.window.renderMatchResult(r13);}catch(e){}
    try{d30.window.renderMatchResult(r30);}catch(e){}
    const t13=d13.window.document.getElementById('matchResult').textContent.replace(/\s+/g,' ').trim();
    const t30=d30.window.document.getElementById('matchResult').textContent.replace(/\s+/g,' ').trim();
    ok('matchResult textContent', t13, t30);
  }

  console.log('\n[TEST 4] extractVendorFromFilename');
  ok('2601OTK',d13.window.extractVendorFromFilename('2601OTK.pdf'),d30.window.extractVendorFromFilename('2601OTK.pdf'));
  ok('2601明邦運送',d13.window.extractVendorFromFilename('2601明邦運送.pdf'),d30.window.extractVendorFromFilename('2601明邦運送.pdf'));
  ok('2601セイユー',d13.window.extractVendorFromFilename('2601セイユー.pdf'),d30.window.extractVendorFromFilename('2601セイユー.pdf'));

  console.log('\n─────────────────────────');
  console.log('결과: PASS '+passed+' / FAIL '+failed);
  process.exit(failed>0?1:0);
}
runTest().catch(e=>{console.error('예외:',e.message);process.exit(1);});
