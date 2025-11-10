// ===== owner.js (UniversalReferralAutoStake Owner Panel) =====

let web3, provider, account, contract;
let usdt, stake; // ERC20 instances

// ---------- utils ----------
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function fmtUnits(bnStr, decimals = 18, dp = 6) {
  try {
    const n = BigInt(bnStr);
    const base = 10n ** BigInt(decimals);
    const i = n / base;
    let d = (n % base).toString().padStart(decimals, "0");
    if (dp >= 0) d = d.slice(0, dp);
    d = d.replace(/0+$/, "");
    return d ? `${i}.${d}` : i.toString();
  } catch { return String(bnStr); }
}

function toWeiStr(amountStr, decimals = 18) {
  const s = String(amountStr ?? "").trim();
  if (!s) return "0";
  if (!s.includes(".")) return (BigInt(s) * (10n ** BigInt(decimals))).toString();
  const [a, b = ""] = s.split(".");
  const frac = (b + "0".repeat(decimals)).slice(0, decimals);
  return (BigInt(a || "0") * (10n ** BigInt(decimals)) + BigInt(frac || "0")).toString();
}

function toast(msg) { console.log(msg); alert(msg); }

function parseStartTime(text) {
  const val = (text || "").trim();
  if (!val) return Math.floor(Date.now() / 1000);
  if (/^\d+$/.test(val)) return Number(val);              // unix seconds
  const t = Date.parse(val);                               // ISO like "2025-11-10 15:00"
  if (!isNaN(t)) return Math.floor(t / 1000);
  throw new Error("รูปแบบเวลาไม่ถูกต้อง (ใส่เป็นวินาที หรือรูปแบบวันที่มาตรฐาน)");
}

// ---------- connect ----------
async function connectOwner() {
  try {
    provider = window.ethereum
      || window.bitget?.ethereum
      || window.okxwallet?.ethereum
      || window.bitkeep?.ethereum;

    if (!provider) return toast("❌ ไม่พบกระเป๋า (MetaMask/Bitget/OKX/BitKeep)");

    await provider.request({ method: "eth_requestAccounts" });
    web3 = new Web3(provider);

    const chainIdHex = await provider.request({ method: "eth_chainId" });
    if (chainIdHex !== window.NETWORK.chainIdHex) {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: window.NETWORK.chainIdHex }],
      });
      // รอ chain เปลี่ยน
      await sleep(500);
    }

    const accs = await web3.eth.getAccounts();
    account = accs[0];

    contract = new web3.eth.Contract(window.SALE_ABI, window.ADDR.CONTRACT);
    usdt     = new web3.eth.Contract(window.ERC20_MINI_ABI, window.ADDR.USDT);
    stake    = new web3.eth.Contract(window.ERC20_MINI_ABI, window.ADDR.STAKE);

    $("wallet").textContent = `✅ ${account.slice(0,6)}...${account.slice(-4)}`;
    $("ca").textContent = window.ADDR.CONTRACT;
    $("ownerAddr").textContent = account;

    provider.on?.("accountsChanged", () => location.reload());
    provider.on?.("chainChanged", () => location.reload());

    toast("✅ เชื่อมต่อสำเร็จ");
    await hydrateParams();
    await refreshBalances();
    autoRefresh();
  } catch (e) {
    console.error(e);
    toast("❌ เชื่อมต่อไม่สำเร็จ: " + (e?.message || e));
  }
}

// ---------- dashboard ----------
async function refreshBalances() {
  try {
    // paused?
    let pausedStr = "—";
    if (contract.methods.paused) {
      try { pausedStr = (await contract.methods.paused().call()) ? "⛔ Paused" : "✅ Active"; }
      catch { /* ignore */ }
    }
    $("sysState").textContent = pausedStr;

    // contract balances
    const [usdtDec, stakeDec] = await Promise.all([
      usdt.methods.decimals().call().catch(() => "18"),
      stake.methods.decimals().call().catch(() => "18"),
    ]);

    const [usdtBal, stakeBal] = await Promise.all([
      usdt.methods.balanceOf(window.ADDR.CONTRACT).call(),
      stake.methods.balanceOf(window.ADDR.CONTRACT).call(),
    ]);

    $("usdtBal").textContent = `${fmtUnits(usdtBal, Number(usdtDec))} USDT`;
    $("catBal").textContent  = `${fmtUnits(stakeBal, Number(stakeDec))} ${window.TOKEN_SYMBOL || "STAKE"}`;
  } catch (e) {
    console.error(e);
    $("usdtBal").textContent = "-";
    $("catBal").textContent  = "-";
  }
}

let _autoTimer = null;
function autoRefresh() {
  if (_autoTimer) clearInterval(_autoTimer);
  _autoTimer = setInterval(refreshBalances, 20000); // ทุก 20 วินาที
}

// ---------- params ----------
async function hydrateParams() {
  try {
    const [
      apr, claimInt, lockDur, r1, r2, r3, refInt
    ] = await Promise.all([
      contract.methods.REWARD_APR_BPS().call(),
      contract.methods.CLAIM_INTERVAL_STAKE().call(),
      contract.methods.LOCK_DURATION().call(),
      contract.methods.REF1_BPS().call(),
      contract.methods.REF2_BPS().call(),
      contract.methods.REF3_BPS().call(),
      contract.methods.REF_CLAIM_INTERVAL().call(),
    ]);

    $("aprBps").value     = apr;
    $("claimInt").value   = claimInt;
    $("lockDur").value    = lockDur;
    $("ref1").value       = r1;
    $("ref2").value       = r2;
    $("ref3").value       = r3;
    $("refClaimInt").value= refInt;
  } catch (e) {
    console.error("hydrateParams:", e);
  }
}

async function onSetParams() {
  try {
    if (!account) return toast("กรุณาเชื่อมต่อกระเป๋าก่อน");
    const apr     = $("aprBps").value.trim();
    const claim   = $("claimInt").value.trim();
    const lock    = $("lockDur").value.trim();
    const ref1    = $("ref1").value.trim();
    const ref2    = $("ref2").value.trim();
    const ref3    = $("ref3").value.trim();
    const refInt  = $("refClaimInt").value.trim();

    if ([apr, claim, lock, ref1, ref2, ref3, refInt].some(v => v === "")) {
      return toast("กรอกค่าพารามิเตอร์ให้ครบ");
    }

    await contract.methods.setParams(apr, claim, lock, ref1, ref2, ref3, refInt)
      .send({ from: account });

    toast("✅ อัปเดตพารามิเตอร์สำเร็จ");
    await hydrateParams();
  } catch (e) {
    console.error(e);
    toast("❌ setParams ล้มเหลว: " + (e?.message || e));
  }
}

// ---------- packages ----------
async function onSetPackage() {
  try {
    if (!account) return toast("เชื่อมต่อกระเป๋าก่อน");
    const id       = $("pkgId").value.trim();
    const usdtIn   = $("pkgUsdt").value.trim();
    const tokenOut = $("pkgToken").value.trim();
    const active   = $("pkgActive").checked;

    if (id === "" || !usdtIn || !tokenOut) {
      return toast("กรอกข้อมูลแพ็กเกจให้ครบ");
    }
    // สมมติทั้ง USDT และ STAKE token มี 18 เดซิมอล (BSC มาตรฐาน)
    const usdtWei  = toWeiStr(usdtIn, 18);
    const tokWei   = toWeiStr(tokenOut, 18);

    await contract.methods.setPackage(id, usdtWei, tokWei, active)
      .send({ from: account });

    toast(`✅ บันทึกแพ็กเกจ #${id} สำเร็จ`);
  } catch (e) {
    console.error(e);
    toast("❌ setPackage ล้มเหลว: " + (e?.message || e));
  }
}

// ---------- withdraw ----------
async function onWithdrawUSDT() {
  try {
    if (!account) return toast("เชื่อมต่อกระเป๋าก่อน");
    const to = $("withdrawTo").value.trim();
    const amt = $("withdrawAmt").value.trim();
    if (!to || !amt) return toast("กรอกปลายทางและจำนวน");

    const wei = toWeiStr(amt, 18);
    await contract.methods.ownerWithdrawUSDT(wei, to).send({ from: account });
    toast("✅ ถอน USDT สำเร็จ");
    await refreshBalances();
  } catch (e) {
    console.error(e);
    toast("❌ ถอน USDT ล้มเหลว: " + (e?.message || e));
  }
}

async function onWithdrawStakeToken() {
  try {
    if (!account) return toast("เชื่อมต่อกระเป๋าก่อน");
    const to = $("withdrawTo").value.trim();
    const amt = $("withdrawAmt").value.trim();
    if (!to || !amt) return toast("กรอกปลายทางและจำนวน");

    const wei = toWeiStr(amt, 18);
    await contract.methods.ownerWithdrawStakeToken(wei, to).send({ from: account });
    toast(`✅ ถอน ${window.TOKEN_SYMBOL || "STAKE"} สำเร็จ`);
    await refreshBalances();
  } catch (e) {
    console.error(e);
    toast("❌ ถอนโทเค็นล้มเหลว: " + (e?.message || e));
  }
}

// ---------- airdrop ----------
async function onAirdrop() {
  try {
    if (!account) return toast("เชื่อมต่อกระเป๋าก่อน");
    const rawUsers   = $("airUsers").value.trim();
    const rawAmounts = $("airAmounts").value.trim();
    if (!rawUsers || !rawAmounts) return toast("กรอก users และ amounts");

    const users = rawUsers.split(/\s+/).filter(Boolean);
    const amountsTxt = rawAmounts.split(/\s+/).filter(Boolean);
    if (users.length !== amountsTxt.length) return toast("จำนวน address และ amount ไม่ตรงกัน");

    const amounts = amountsTxt.map(x => toWeiStr(x, 18));
    const startTs = parseStartTime($("airStart").value);

    await contract.methods.airdropStakes(users, amounts, startTs).send({ from: account });
    toast("✅ Airdrop Stake สำเร็จ");
  } catch (e) {
    console.error(e);
    toast("❌ Airdrop ล้มเหลว: " + (e?.message || e));
  }
}

// ---------- bind UI ----------
window.addEventListener("DOMContentLoaded", () => {
  $("btnConnect")?.addEventListener("click", connectOwner);
  $("btnSetParams")?.addEventListener("click", onSetParams);
  $("btnSetPkg")?.addEventListener("click", onSetPackage);
  $("btnWUSDT")?.addEventListener("click", onWithdrawUSDT);
  $("btnWToken")?.addEventListener("click", onWithdrawStakeToken);
  $("btnAirdrop")?.addEventListener("click", onAirdrop);
});
