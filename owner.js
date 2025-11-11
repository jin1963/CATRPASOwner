// owner.js — ฝั่ง Owner Console (CAT-ready)
let web3, provider, sale, usdt, cat, account, ownerAddr;

const el = (id)=>document.getElementById(id);
const fmt = (v,dec=18,dp=6)=>{
  try{
    const s = (BigInt(v)).toString();
    if(dec===0) return s;
    const neg = s.startsWith('-');
    const raw = neg?s.slice(1):s;
    const pad = raw.padStart(dec+1,'0');
    const a = pad.slice(0, pad.length-dec);
    let b = pad.slice(pad.length-dec);
    if (dp >= 0) b = b.slice(0, dp);
    b = b.replace(/0+$/,'');
    const out = (b?`${a}.${b}`:a);
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

async function connect(){
  try{
    provider = window.ethereum;
    if(!provider){ toast('ไม่พบ MetaMask/Wallet — เปิดด้วย DApp browser', 'err'); return; }
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
    // ใช้ CAT address (fallback KJC เพื่อความเข้ากันได้ย้อนหลัง)
    const stakeTokenAddr = window.ADDR?.CAT || window.ADDR?.KJC;
    cat  = new web3.eth.Contract(window.ERC20_MINI_ABI, stakeTokenAddr);

    ownerAddr = await sale.methods.owner().call();
    el('ownerAddr').textContent = ownerAddr;

    if (ownerAddr.toLowerCase() !== account.toLowerCase()){
      el('ownerGate').textContent = '⚠️ กระเป๋าปัจจุบันไม่ใช่ Owner — โหมดอ่านอย่างเดียว';
      disableOwnerControls(true);
    }else{
      el('ownerGate').textContent = '✅ คุณคือ Owner — สามารถจัดการสัญญาได้';
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

function disableOwnerControls(disabled){
  ['pkgId','pkgUsdt','pkgKjc','pkgActive','btnSetPkg','wTo','wUsdtAmt','btnWUsdt','wKjcAmt','btnWKjc']
    .forEach(id=>{
      const node = el(id);
      if (node) node.disabled = !!disabled;
    });
}

async function refreshStatus(){
  try{
    const decUSDT = window.DECIMALS?.USDT ?? 18;
    const decCAT  = window.DECIMALS?.CAT ?? window.DECIMALS?.KJC ?? 18;

    // balances (อ่านจากสัญญา)
    const balU = await usdt.methods.balanceOf(window.ADDR.CONTRACT).call();
    const balC = await cat.methods.balanceOf(window.ADDR.CONTRACT).call();
    el('balUSDT').textContent = `${fmt(balU, decUSDT)} USDT`;
    el('balKJC').textContent  = `${fmt(balC, decCAT)} CAT`;

    // params
    const apr  = await sale.methods.REWARD_APR_BPS().call().catch(()=>'-');
    const siv  = await sale.methods.CLAIM_INTERVAL_STAKE().call().catch(()=>'-');
    const riv  = await sale.methods.REF_CLAIM_INTERVAL().call().catch(()=>'-');
    const lock = await sale.methods.LOCK_DURATION().call().catch(()=>'-');

    el('aprBps').textContent       = String(apr);
    el('claimStakeIv').textContent = String(siv);
    el('claimRefIv').textContent   = String(riv);
    el('lockDur').textContent      = String(lock);
  }catch(e){
    console.error(e);
    toast('โหลดสถานะสัญญาไม่สำเร็จ','err');
  }
}

async function loadPackages(){
  const box = el('pkgList');
  box.innerHTML = 'กำลังโหลดแพ็กเกจ…';
  try{
    const count = await sale.methods.packageCount().call();
    if (Number(count)===0){
      box.innerHTML = '<div class="muted">ยังไม่มีแพ็กเกจ</div>';
      return;
    }
    const decUSDT = window.DECIMALS?.USDT ?? 18;
    const decCAT  = window.DECIMALS?.CAT ?? window.DECIMALS?.KJC ?? 18;

    let html = '';
    html += `<div class="mono" style="text-align:left">พบ ${count} รายการ</div>`;
    for (let i=1;i<=Number(count);i++){
      const p = await sale.methods.packages(i).call();
      // รองรับทั้งสัญญาใหม่ (tokenOut) และเก่า (kjcOut)
      const outRaw = p.tokenOut ?? p.kjcOut ?? p[1] ?? '0';
      html += `
        <div class="pkg">
          <div><b>#${i}</b> — active: <b>${p.active}</b></div>
          <div>USDT in: <span class="mono">${fmt(p.usdtIn, decUSDT)}</span></div>
          <div>CAT out: <span class="mono">${fmt(outRaw, decCAT)}</span></div>
          <div class="row">
            <button class="btnFill" data-id="${i}" data-usdt="${p.usdtIn}" data-kjc="${outRaw}" data-active="${p.active}">แก้ไข (เติมฟอร์ม)</button>
          </div>
        </div>
      `;
    }
    box.innerHTML = html;
    [...document.querySelectorAll('.btnFill')].forEach(b=>{
      b.addEventListener('click', ()=>{
        el('pkgId').value = b.dataset.id;
        const decUSDT = window.DECIMALS?.USDT ?? 18;
        const decCAT  = window.DECIMALS?.CAT ?? window.DECIMALS?.KJC ?? 18;
        // แปลงกลับเป็นจำนวนอ่านง่าย
        el('pkgUsdt').value = fmt(b.dataset.usdt, decUSDT);
        el('pkgKjc').value  = fmt(b.dataset.kjc,  decCAT);
        el('pkgActive').value = b.dataset.active === 'true' ? 'true' : 'false';
        toast('เติมข้อมูลแพ็กเกจลงฟอร์มแล้ว','ok');
      });
    });
  }catch(e){
    console.error(e);
    box.innerHTML = '<span class="err">โหลดแพ็กเกจไม่สำเร็จ</span>';
  }
}

async function setPackage(){
  try{
    if (ownerAddr.toLowerCase() !== account.toLowerCase()) return toast('บัญชีนี้ไม่ใช่ Owner','err');

    const id   = Number((el('pkgId').value||'').trim());
    const uIn  = (el('pkgUsdt').value||'').trim();
    const tOut = (el('pkgKjc').value||'').trim(); // ใช้ input เดิม แต่เป็น CAT

    if (!id || !uIn || !tOut) return toast('กรุณากรอกข้อมูลแพ็กเกจให้ครบ','err');

    const decUSDT = window.DECIMALS?.USDT ?? 18;
    const decCAT  = window.DECIMALS?.CAT ?? window.DECIMALS?.KJC ?? 18;

    const usdtIn  = toWei(uIn,  decUSDT);
    const tokenOut= toWei(tOut, decCAT);
    const act     = el('pkgActive').value === 'true';

    toast('ส่งธุรกรรม setPackage…');
    await sale.methods.setPackage(id, usdtIn, tokenOut, act).send({ from: account });
    toast('อัพเดตแพ็กเกจสำเร็จ ✅','ok');

    await loadPackages();
  }catch(e){
    console.error(e);
    toast(`ตั้งค่าแพ็กเกจไม่สำเร็จ: ${e?.message||e}`,'err');
  }
}

async function withdrawUSDT(){
  try{
    if (ownerAddr.toLowerCase() !== account.toLowerCase()) return toast('บัญชีนี้ไม่ใช่ Owner','err');
    const to = (el('wTo').value||'').trim() || ownerAddr;
    if (!web3.utils.isAddress(to)) return toast('ที่อยู่ปลายทางไม่ถูกต้อง','err');
    const amt = (el('wUsdtAmt').value||'').trim();
    if (!amt) return toast('กรุณากรอกจำนวน USDT','err');

    const amount = toWei(amt, window.DECIMALS?.USDT ?? 18);
    toast('ส่งธุรกรรมถอน USDT…');
    await sale.methods.ownerWithdrawUSDT(amount, to).send({ from: account });
    toast('ถอน USDT สำเร็จ ✅','ok');
    await refreshStatus();
  }catch(e){
    console.error(e);
    toast(`ถอน USDT ไม่สำเร็จ: ${e?.message||e}`,'err');
  }
}

async function withdrawKJC(){ // ใช้ id เดิม แต่จะถอน CAT
  try{
    if (ownerAddr.toLowerCase() !== account.toLowerCase()) return toast('บัญชีนี้ไม่ใช่ Owner','err');
    const to = (el('wTo').value||'').trim() || ownerAddr;
    if (!web3.utils.isAddress(to)) return toast('ที่อยู่ปลายทางไม่ถูกต้อง','err');
    const amt = (el('wKjcAmt').value||'').trim();
    if (!amt) return toast('กรุณากรอกจำนวน CAT','err');

    const decCAT = window.DECIMALS?.CAT ?? window.DECIMALS?.KJC ?? 18;
    const amount = toWei(amt, decCAT);

    // รองรับทั้งชื่อใหม่ (ownerWithdrawStakeToken) และชื่อเก่า (ownerWithdrawKJC)
    const m = sale.methods;
    const call =
      (m.ownerWithdrawStakeToken && m.ownerWithdrawStakeToken(amount, to)) ||
      (m.ownerWithdrawKJC && m.ownerWithdrawKJC(amount, to));

    if (!call) throw new Error('ไม่พบเมธอดถอนโทเค็นของ Owner (stake token)');

    toast('ส่งธุรกรรมถอน CAT…');
    await call.send({ from: account });
    toast('ถอน CAT สำเร็จ ✅','ok');
    await refreshStatus();
  }catch(e){
    console.error(e);
    toast(`ถอนไม่สำเร็จ: ${e?.message||e}`,'err');
  }
}

// wire
window.addEventListener('DOMContentLoaded', ()=>{
  el('btnConnect').addEventListener('click', connect);
  el('btnSetPkg').addEventListener('click', setPackage);
  el('btnWUsdt').addEventListener('click', withdrawUSDT);
  el('btnWKjc').addEventListener('click', withdrawKJC);
  el('ca').textContent = window.ADDR.CONTRACT;
});
