/* public.js – DApp ฝั่งผู้ใช้ (Public) — UPDATED for CAT
   ฟังก์ชันหลัก:
   - เชื่อมต่อ MetaMask
   - บันทึก/อ่าน referrer
   - ซื้อแพ็กเกจ + stake อัตโนมัติ
   - เคลม reward referral (USDT)
   - ดูรายการ stake พร้อมยอดรวมและวันครบล็อก
*/

let web3, provider, account;
let sale, usdt, cat; // เปลี่ยนจาก kjc -> cat

// ฟังก์ชันย่อยช่วยเหลือ
const el = id => document.getElementById(id);
const fmt = (v, dec = 18, dp = 6) => {
  try {
    const s = BigInt(v).toString();
    if (dec === 0) return s;
    const neg = s.startsWith("-");
    const raw = neg ? s.slice(1) : s;
    const pad = raw.padStart(dec + 1, "0");
    const a = pad.slice(0, pad.length - dec);
    let b = pad.slice(pad.length - dec);
    if (dp >= 0) b = b.slice(0, dp);
    b = b.replace(/0+$/, "");
    return (neg ? "-" : "") + (b ? `${a}.${b}` : a);
  } catch {
    return v?.toString?.() ?? String(v);
  }
};
const fmtDateTime = ts => ts > 0 ? new Date(Number(ts) * 1000).toLocaleString() : "-";

function toast(msg, type = "info") {
  const box = el("toast");
  if (!box) return alert(msg);
  box.style.display = "block";
  box.innerHTML = msg;
  box.style.borderColor =
    type === "ok" ? "#225b2a" : type === "err" ? "#5b2222" : "#1b1c25";
  setTimeout(() => { box.style.display = "none"; }, 4000);
}

// เชื่อมต่อกระเป๋า
async function connect() {
  try {
    provider = window.ethereum;
    if (!provider) return toast("❌ ไม่พบ MetaMask — โปรดเปิดด้วย DApp Browser", "err");
    await provider.request({ method: "eth_requestAccounts" });
    web3 = new Web3(provider);

    const chainId = await web3.eth.getChainId();
    if (web3.utils.toHex(chainId) !== window.NETWORK.chainIdHex) {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: window.NETWORK.chainIdHex }]
      });
    }

    const accs = await web3.eth.getAccounts();
    account = accs[0];
    el("wallet").textContent = `✅ ${account.slice(0, 6)}...${account.slice(-4)}`;
    el("ca").textContent = window.ADDR.CONTRACT;

    sale = new web3.eth.Contract(window.SALE_ABI, window.ADDR.CONTRACT);
    usdt = new web3.eth.Contract(window.ERC20_MINI_ABI, window.ADDR.USDT);
    // รองรับทั้งคีย์ใหม่ CAT และคีย์เดิม KJC (เพื่อไม่ให้โค้ดเก่าแตก)
    const stakeTokenAddr = window.ADDR?.CAT || window.ADDR?.KJC;
    cat = new web3.eth.Contract(window.ERC20_MINI_ABI, stakeTokenAddr);

    hydrateRef();
    updateMyRefLink();

    await loadPackages();
    await refreshRewards();
    await loadStakes();

    provider.on?.("accountsChanged", () => location.reload());
    provider.on?.("chainChanged", () => location.reload());
  } catch (e) {
    console.error(e);
    toast(`เชื่อมต่อไม่สำเร็จ: ${e?.message || e}`, "err");
  }
}

// REFERRAL --------------------------------------------------
function hydrateRef() {
  const url = new URL(location.href);
  const ref = url.searchParams.get("ref") || localStorage.getItem("kjc_ref") || "";
  if (ref && web3.utils.isAddress(ref)) {
    el("refInput").value = ref;
    localStorage.setItem("kjc_ref", ref); // คงคีย์เดิมเพื่อความเข้ากันได้ย้อนหลัง
  }
}

function lockRef() {
  const r = el("refInput").value.trim();
  if (!r) return toast("⚠️ กรุณาใส่ Referrer", "err");
  if (!web3.utils.isAddress(r)) return toast("❌ Referrer ไม่ถูกต้อง", "err");
  localStorage.setItem("kjc_ref", r);
  toast("✅ บันทึก Referrer แล้ว", "ok");
}

function updateMyRefLink() {
  if (!account) return;
  const link = `${location.origin}${location.pathname}?ref=${account}`;
  el("myRefLink").value = link;
  el("btnCopyMyRef").onclick = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast("คัดลอกลิงก์แล้ว ✅", "ok");
    } catch {
      toast("ไม่สามารถคัดลอกลิงก์ได้", "err");
    }
  };
}

// PACKAGE ---------------------------------------------------
async function loadPackages() {
  const wrap = el("pkgWrap");
  wrap.innerHTML = "⏳ กำลังโหลดแพ็กเกจ...";
  try {
    const count = await sale.methods.packageCount().call();
    wrap.innerHTML = "";
    for (let i = 1; i <= Number(count); i++) {
      const p = await sale.methods.packages(i).call();
      if (!p.active) continue;
      // รองรับฟิลด์ใหม่ tokenOut และฟิลด์เก่า kjcOut
      const out = p.tokenOut ?? p.kjcOut ?? p[1] ?? "0";
      const div = document.createElement("div");
      div.className = "pkg";
      div.innerHTML = `
        <h3>แพ็กเกจ #${i}</h3>
        <div>จ่าย: <b>${fmt(p.usdtIn, window.DECIMALS.CAT ? window.DECIMALS.USDT : window.DECIMALS.USDT)}</b> USDT</div>
        <div>รับ: <b>${fmt(out, window.DECIMALS.CAT || window.DECIMALS.KJC)}</b> CAT</div>
        <button class="btnBuy" data-id="${i}">ซื้อแพ็กเกจ</button>
      `;
      wrap.appendChild(div);
    }

    document.querySelectorAll(".btnBuy").forEach(b =>
      b.addEventListener("click", () => buyPackage(Number(b.dataset.id)))
    );
  } catch (e) {
    wrap.innerHTML = "❌ โหลดแพ็กเกจไม่สำเร็จ";
    console.error(e);
  }
}

async function ensureAllowance(spender, amount) {
  const allow = await usdt.methods.allowance(account, spender).call();
  if (BigInt(allow) >= BigInt(amount)) return true;
  toast("กำลังอนุมัติ USDT...");
  await usdt.methods.approve(spender, amount).send({ from: account });
  toast("อนุมัติ USDT สำเร็จ ✅", "ok");
  return true;
}

async function buyPackage(id) {
  try {
    const p = await sale.methods.packages(id).call();
    if (!p.active) return toast("แพ็กเกจนี้ถูกปิดแล้ว", "err");
    const ref = el("refInput").value.trim() || localStorage.getItem("kjc_ref") || "0x0000000000000000000000000000000000000000";
    if (ref && !web3.utils.isAddress(ref)) return toast("Referrer ไม่ถูกต้อง", "err");
    await ensureAllowance(window.ADDR.CONTRACT, p.usdtIn);
    toast("กำลังส่งธุรกรรม...");
    await sale.methods.buyPackage(id, ref).send({ from: account });
    toast("🎉 ซื้อสำเร็จและ Stake อัตโนมัติ", "ok");
    localStorage.setItem("kjc_ref", ref);
    await refreshRewards();
    await loadStakes();
  } catch (e) {
    toast(`❌ ซื้อไม่สำเร็จ: ${e?.message || e}`, "err");
  }
}

// REWARDS ---------------------------------------------------
async function refreshRewards() {
  try {
    const amt = await sale.methods.accruedRefUSDT(account).call();
    el("refUsdt").textContent = `${fmt(amt, window.DECIMALS.USDT)} USDT`;
  } catch {
    el("refUsdt").textContent = "-";
  }
}

async function claimReferral() {
  try {
    toast("⏳ ส่งธุรกรรมเคลมรางวัล...");
    await sale.methods.claimReferralReward().send({ from: account });
    toast("✅ เคลมรางวัล Referral สำเร็จ", "ok");
    await refreshRewards();
  } catch (e) {
    toast(`❌ เคลมไม่สำเร็จ: ${e?.message || e}`, "err");
  }
}

// STAKES ---------------------------------------------------
async function loadStakes() {
  const box = el("stakes");
  box.innerHTML = "⏳ กำลังโหลด stakes...";
  try {
    const n = await sale.methods.getStakeCount(account).call();
    const lockDur = await sale.methods.LOCK_DURATION?.().call() ?? await sale.methods.LOCK_DURATION().call();
    const now = Math.floor(Date.now() / 1000);
    let totalPrincipal = 0n;
    let totalPending = 0n;
    box.innerHTML = "";

    if (Number(n) === 0) {
      el("totals").textContent = "รวม Principal: 0 CAT • รอเคลม: 0 CAT";
      box.innerHTML = "<div class='muted'>ยังไม่มีรายการ stake</div>";
      return;
    }

    for (let i = 0; i < Number(n); i++) {
      const s = await sale.methods.stakes(account, i).call();
      const next = await sale.methods.nextStakeClaimTime(account, i).call();
      const canUn = await sale.methods.canUnstake(account, i).call();
      const pend = await sale.methods.pendingStakeReward(account, i).call();

      totalPrincipal += BigInt(s.amount);
      totalPending += BigInt(pend);

      const unlockTs = Number(s.startTime) + Number(lockDur);
      const daysRemain = Math.max(0, Math.ceil((unlockTs - now) / 86400));

      const div = document.createElement("div");
      div.className = "stake";
      div.innerHTML = `
        <div class="mono">Index #${i}</div>
        <div>Principal: ${fmt(s.amount, window.DECIMALS.CAT || window.DECIMALS.KJC)} CAT</div>
        <div>รอเคลม: ${fmt(pend, window.DECIMALS.CAT || window.DECIMALS.KJC)} CAT</div>
        <div class="muted">เริ่ม: ${fmtDateTime(s.startTime)}</div>
        <div class="muted">เคลมถัดไป: ${fmtDateTime(next)}</div>
        <div class="muted">ครบล็อก: ${fmtDateTime(unlockTs)} (${daysRemain} วัน)</div>
        <button class="btnClaim" data-i="${i}">เคลม</button>
        <button class="btnUnstake" data-i="${i}" ${!canUn ? "disabled" : ""}>Unstake</button>
      `;
      box.appendChild(div);
    }

    // อัปเดตยอดรวมทั้งหมด
    el("totals").textContent =
      `รวม Principal: ${fmt(totalPrincipal, window.DECIMALS.CAT || window.DECIMALS.KJC)} CAT • ` +
      `รอเคลม: ${fmt(totalPending, window.DECIMALS.CAT || window.DECIMALS.KJC)} CAT`;

    // Event ปุ่มเคลม / unstake
    document.querySelectorAll(".btnClaim").forEach(b =>
      b.addEventListener("click", async () => {
        const i = Number(b.dataset.i);
        try {
          toast("⏳ ส่งธุรกรรมเคลม...");
          await sale.methods.claimStakingReward(i).send({ from: account });
          toast("✅ เคลมผลตอบแทนสำเร็จ", "ok");
          await loadStakes();
        } catch (e) {
          toast(`❌ เคลมไม่สำเร็จ: ${e?.message || e}`, "err");
        }
      })
    );

    document.querySelectorAll(".btnUnstake").forEach(b =>
      b.addEventListener("click", async () => {
        const i = Number(b.dataset.i);
        try {
          toast("⏳ ส่งธุรกรรม Unstake...");
          await sale.methods.unstake(i).send({ from: account });
          toast("✅ Unstake สำเร็จ", "ok");
          await loadStakes();
        } catch (e) {
          toast(`❌ Unstake ไม่สำเร็จ: ${e?.message || e}`, "err");
        }
      })
    );
  } catch (e) {
    console.error(e);
    box.innerHTML = "❌ โหลด stake ไม่สำเร็จ";
  }
}

// เริ่มต้นเมื่อโหลดหน้า
window.addEventListener("DOMContentLoaded", () => {
  el("btnConnect").addEventListener("click", connect);
  el("btnLockRef").addEventListener("click", lockRef);
  el("btnClaimRef").addEventListener("click", claimReferral);
});
