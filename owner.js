// owner.js — CAT Owner Console (เวอร์ชันสมบูรณ์)
let web3, provider, sale, usdt, cat, account, ownerAddr;

const el = (id)=>document.getElementById(id);
const fmt = (v,dec=18,dp=6)=>{
  try{
    const s = (BigInt(v)).toString();
    if(dec===0) return s;
    const neg = s.startsWith('-');
    const raw = neg ? s.slice(1) : s;
    const pad = raw.padStart(dec+1,'0');
    const a = pad.slice(0, pad.length-dec);
    let b = pad.slice(pad.length-dec);
    if (dp >= 0) b = b.slice(0, dp);
    b = b.replace(/0+$/,'');
    const out = b ? `${a}.${b}` : a;
    return (neg?'-':'') + out;
  }catch{ return v?.toString?.() ?? String(v); }
};
const toWei = (numStr,dec=18)=>{
  const [i,d='']= String(numStr).trim().split('.');
  const frac = (d + '0'.repeat(dec)).slice(0,dec);
  return (BigInt(i||0)* (10n**BigInt(dec)) + BigInt(frac||0)).toString();
};
function toast(msg, type='info'){
  const box = el('toast');
  box.style.display='block';
  box.innerHTML = msg;
  box.style.borderColor = (type==='ok')? '#225b2a' : (type==='err')? '#5b2222' : '#1b1c25';
  setTimeout(()=>{ box.style.display='none'; }, 3800);
}

const DEC = {
  USDT: (window.DECIMALS && window.DECIMALS.USDT) || 18,
  CAT : (window.DECIMALS && (window.DECIMALS.CAT ?? window.DECIMALS.KJC)) || 18,
};

async function connect(){
  try{
    provider = window.ethereum;
    if(!provider){ toast('❌ ไม่พบ MetaMask หรือ Wallet — โปรดเปิดผ่าน DApp Browser', 'err'); return; }
    await provider.request({ method:'eth_requestAccounts' });
    web3 = new Web3(provider);

    const chainId = await web3.eth.getChainId();
    if (web3.utils.toHex(chainId) !== window.NETWORK.chainIdHex){
      await provider.request({ method:'wallet_switchEthereumChain', params:[{ chainId: window.NETWORK.chainIdHex }] });
    }

    const accs = await web3.eth.getAccounts();
    account = accs[0];
    el('wallet').textContent = `✅ ${account.slice(0,6)}…${account.slice(-4)}`;
    el('ca').textContent = window.ADDR.CONTRACT;

    sale = new web3.eth.Contract(window.SALE_ABI, window.ADDR.CONTRACT);
    usdt = new web3.eth.Contract(window.ERC20_MINI_ABI, window.ADDR.USDT);
    cat  = new web3.eth.Contract(window.ERC20_MINI_ABI, window.ADDR.CAT);

    try {
      ownerAddr = await sale.methods.owner().call();
      el('ownerAddr').textContent = ownerAddr;
      if (ownerAddr.toLowerCase() !== account.toLowerCase()){
        el('ownerGate').textContent = 'ℹ️ บัญชีนี้ไม่ใช่ Owner — ยังทำธุรกรรมได้ แต่สัญญาจะตรวจสิทธิ์เอง';
      } else {
        el('ownerGate').textContent = '✅ คุณคือ Owner — สามารถจัดการสัญญาได้';
      }
    } catch(e){
      el('ownerAddr').textContent = '-';
      el('ownerGate').textContent = 'ℹ️ ไม่พบฟังก์ชัน owner() ในสัญญา';
    }

    await refreshStatus();
    await loadPackages();

    provider.on?.('accountsChanged', ()=>location.reload());
    provider.on?.('chainChanged',   ()=>location.reload());
  }catch(e){
    console.error(e);
    toast(`เชื่อมต่อไม่สำเร็จ: ${e?.message||e}`,'err');
  }
}

async function refreshStatus(){
  try{
    // balances
    try {
      const balU = await usdt.methods.balanceOf(window.ADDR.CONTRACT).call();
      el('balUSDT').textContent = `${fmt(balU, DEC.USDT)} USDT`;
    } catch(e){ el('balUSDT').textContent='-'; }

    try {
      const balC = await cat.methods.balanceOf(window.ADDR.CONTRACT).call();
      el('balCAT').textContent  = `${fmt(balC, DEC.CAT)} CAT`;
    } catch(e){ el('balCAT').textContent='-'; }

    // params
    try { el('aprBps').textContent       = String(await sale.methods.REWARD_APR_BPS().call()); } catch(e){ el('aprBps').textContent='-'; }
    try { el('claimStakeIv').textContent = String(await sale.methods.CLAIM_INTERVAL_STAKE().call()); } catch(e){ el('claimStakeIv').textContent='-'; }
    try { el('claimRefIv').textContent   = String(await sale.methods.REF_CLAIM_INTERVAL().call()); } catch(e){ el('claimRefIv').textContent='-'; }
    try { el('lockDur').textContent      = String(await sale.methods.LOCK_DURATION().call()); } catch(e){ el('lockDur').textContent='-'; }
  }catch(e){
    console.error(e);
    toast('โหลดข้อมูลสัญญาไม่สำเร็จ','err');
  }
}

async function loadPackages(){
  const box = el('pkgList');
  box.innerHTML = 'กำลังโหลดแพ็กเกจ…';
  try{
    const count = Number(await sale.methods.packageCount().call());
    if (!count){ box.innerHTML = '<div class="muted">ยังไม่มีแพ็กเกจ</div>'; return; }

    let html = `<div class="mono" style="text-align:left">พบ ${count} รายการ</div>`;
    for (let i=0;i<count;i++){
      const p = await sale.methods.packages(i).call();
      const uInRaw = p.usdtIn ?? '0';
      const outRaw = p.tokenOut ?? '0';
      html += `
        <div class="pkg">
          <div><b>#${i}</b> — active: <b>${p.active}</b></div>
          <div>USDT in: <span class="mono">${fmt(uInRaw, DEC.USDT)}</span></div>
          <div>CAT out: <span class="mono">${fmt(outRaw, DEC.CAT)}</span></div>
          <div class="row">
            <button class="btnFill" data-id="${i}" data-usdt="${uInRaw}" data-cat="${outRaw}" data-active="${p.active}">แก้ไข</button>
          </div>
        </div>
      `;
    }
    box.innerHTML = html;

    document.querySelectorAll('.btnFill').forEach(b=>{
      b.addEventListener('click', ()=>{
        el('pkgId').value     = b.dataset.id;
        el('pkgUsdt').value   = fmt(b.dataset.usdt, DEC.USDT);
        el('pkgCat').value    = fmt(b.dataset.cat,  DEC.CAT);
        el('pkgActive').value = b.dataset.active === 'true' ? 'true' : 'false';
        toast('✅ เติมข้อมูลแพ็กเกจลงฟอร์มแล้ว','ok');
      });
    });
  }catch(e){
    console.error(e);
    box.innerHTML = '<span class="err">โหลดแพ็กเกจไม่สำเร็จ</span>';
  }
}

async function setPackage(){
  try{
    const id   = Number((el('pkgId').value||'').trim());
    const uIn  = (el('pkgUsdt').value||'').trim();
    const tOut = (el('pkgCat').value||'').trim();
    const act  = el('pkgActive').value === 'true';
    if (!Number.isFinite(id)) return toast('⚠️ กรุณาใส่ Package ID','err');
    if (!uIn || !tOut) return toast('⚠️ กรอกจำนวน USDT/CAT ให้ครบ','err');

    const usdtIn   = toWei(uIn,  DEC.USDT);
    const tokenOut = toWei(tOut, DEC.CAT);

    toast('ส่งธุรกรรม setPackage…');
    await sale.methods.setPackage(id, usdtIn, tokenOut, act).send({ from: account });
    toast('✅ อัพเดตแพ็กเกจสำเร็จ','ok');
    await loadPackages();
  }catch(e){
    console.error(e);
    toast(`ตั้งค่าแพ็กเกจไม่สำเร็จ: ${e?.message||e}`,'err');
  }
}

async function withdrawUSDT(){
  try{
    const to = (el('wTo').value||'').trim() || account;
    if (!web3.utils.isAddress(to)) return toast('⚠️ ที่อยู่ปลายทางไม่ถูกต้อง','err');
    const amt = (el('wUsdtAmt').value||'').trim();
    if (!amt) return toast('⚠️ กรุณากรอกจำนวน USDT','err');

    const amount = toWei(amt, DEC.USDT);
    toast('ส่งธุรกรรมถอน USDT…');
    await sale.methods.ownerWithdrawUSDT(amount, to).send({ from: account });
    toast('✅ ถอน USDT สำเร็จ','ok');
    await refreshStatus();
  }catch(e){
    console.error(e);
    toast(`ถอน USDT ไม่สำเร็จ: ${e?.message||e}`,'err');
  }
}

async function withdrawCAT(){
  try{
    const to = (el('wTo').value||'').trim() || account;
    if (!web3.utils.isAddress(to)) return toast('⚠️ ที่อยู่ปลายทางไม่ถูกต้อง','err');
    const amt = (el('wCatAmt').value||'').trim();
    if (!amt) return toast('⚠️ กรุณากรอกจำนวน CAT','err');

    const amount = toWei(amt, DEC.CAT);
    toast('ส่งธุรกรรมถอน CAT…');
    await sale.methods.ownerWithdrawStakeToken(amount, to).send({ from: account });
    toast('✅ ถอน CAT สำเร็จ','ok');
    await refreshStatus();
  }catch(e){
    console.error(e);
