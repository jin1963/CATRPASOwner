/* public.js – DApp ฝั่งผู้ใช้ (Public) — CAT-ready
   - เชื่อมต่อ MetaMask
   - บันทึก/อ่าน Referrer (?ref= / localStorage)
   - แสดงแพ็กเกจ (ทนทั้งกรณี index เริ่ม 0 หรือ 1, tokenOut/kjcOut)
   - ซื้อแพ็กเกจ + approve USDT อัตโนมัติ
   - เคลมรางวัล Referral (USDT)
   - แสดงรายการ Stake + เคลม/Unstake
*/

let web3, provider, account;
let sale, usdt, cat;

// ---------- Utils ----------
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
const fmtDateTime = ts => (Number(ts) > 0 ? new Date(Number(ts) * 1000).toLocaleString() : "-");
const ZERO = "0x0000000000000000000000000000000000000000";
function toast(msg, type = "info") {
  const box = el("toast");
  if (!box) return alert(msg);
  box.style.display = "block";
  box.innerHTML = msg;
  box.style.borderColor =
    type === "ok" ? "#225b2a" : type === "err" ? "#5b2222" : "#1b1c25";
  setTimeout(() => (box.style.display = "none"), 4000);
}
const DEC_USDT = () => (window.DECIMALS?.USDT ?? 18);
const DEC_CAT  = () => (window.DECIMALS?.CAT ?? window.DECIMALS?.KJC ?? 18);

// ---------- Connect ----------
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
    const stakeTokenAddr = window.ADDR?.CAT || window.ADDR?.KJC; // fallback เพื่อความเข้ากันได้
    cat  = new web3.eth.Contract(window.ERC20_MINI_ABI, stakeTokenAddr);

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

// ---------- Referrer ----------
function hydrateRef() {
  const url = new URL(location.href);
  const ref = url.searchParams.get("ref") || localStorage.getItem("kjc_ref") || "";
  if (ref && web3.utils.isAddress(ref)) {
    el("refInput").value = ref;
    localStorage.setItem("kjc_ref", ref); // คง key เดิมเพื่อย้อนหลัง
  }
}
function lockRef() {
  const r = (el("refInput").value || "").trim();
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

// ---------- Packages ----------
async function loadPackages() {
  const wrap = el("pkgWrap");
  wrap.innerHTML = "⏳ กำลังโหลดแพ็กเกจ...";
  try {
    const count = Number(await sale.methods.packageCount().call());
    const decU = DEC_USDT();
    const decT = DEC_CAT();

    if (!count) {
      wrap.innerHTML = `<div class="muted">ยังไม่มีแพ็กเกจบนสัญญา (packageCount = 0)</div>`;
      return;
    }

    // helper: อ่านช่วง index
    const readRange = async (start, end) => {
      const rows = [];
      for (let i = start; i <= end; i++) {
        const p = await sale.methods.packages(i).call().catch(() => null);
        if (!p) continue;
        const out = p.tokenOut ?? p.kjcOut ?? p[1] ?? "0";
        const usdtIn = p.usdtIn ?? p[0] ?? "0";
        rows.push({ id: i, active: !!p.active, usdtIn, out });
      }
      return rows;
    };

    // โหมด A: 1..count, ถ้าไม่เจอ/ไม่มี active ลองโหมด B: 0..count-1
    const rowsA = await readRange(1, count);
    const needB = rowsA.length === 0 || rowsA.every(r => !r.active);
    const rowsB = needB ? await readRange(0, count - 1) : [];
    const rows = rowsB.length > rowsA.length ? rowsB : rowsA;

    if (rows.length === 0) {
      wrap.innerHTML = `<div class="muted">อ่านแพ็กเกจไม่พบ (ตรวจสอบ setPackage และ active)</div>`;
      return;
    }

    wrap.innerHTML = "";
    let activeCnt = 0, inactiveCnt = 0;

    for (const r of rows) {
      if (r.active) activeCnt++; else inactiveCnt++;
      const card = document.createElement("div");
      card.className = "pkg";
      card.innerHTML = `
        <h3>แพ็กเกจ #${r.id} ${r.active ? "" : "<span class='muted'>(inactive)</span>"}</h3>
        <div>จ่าย: <b>${fmt(r.usdtIn, decU)}</b> USDT</div>
        <div>รับ: <b>${fmt(r.out, decT)}</b> CAT</div>
        <button class="btnBuy" data-id="${r.id}" ${r.active ? "" : "disabled"}>
          ${r.active ? "ซื้อแพ็กเกจ" : "ปิดการขาย"}
        </button>
      `;
      wrap.appendChild(card);
    }

    const info = document.createElement("div");
    info.className = "muted";
    info.style.marginTop = "8px";
    info.textContent = `packageCount=${count} • พบทั้งหมด ${rows.length} (active ${activeCnt}, inactive ${inactiveCnt})`;
    wrap.prepend(info);

    document.querySelectorAll(".btnBuy").forEach(b =>
      b.addEventListener("click", () => buyPackage(Number(b.dataset.id)))
    );
  } catch (e) {
    console.error(e);
    wrap.innerHTML = "❌ โหลดแพ็กเกจไม่สำเร็จ";
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
    if (!p || !p.active) return toast("แพ็กเกจนี้ถูกปิดหรือไม่พบ", "err");

    const ref =
      el("refInput").value.trim() ||
      localStorage.getItem("kjc_ref") ||
      ZERO;
    if (ref && !web3.utils.isAddress(ref)) return toast("Referrer ไม่ถูกต้อง", "err");

    const usdtIn = p.usdtIn ?? p[0] ?? "0";
    await ensureAllowance(window.ADDR.CONTRACT, usdtIn);

    toast("กำลังส่งธุรกรรม...");
    await sale.methods.buyPackage(id, ref).send({ from: account });
    toast("🎉 ซื้อสำเร็จและ Stake อัตโนมัติ", "ok");

    localStorage.setItem("kjc_ref", ref);
    await refreshRewards();
    await loadStakes();
  } catch (e) {
    console.error(e);
    toast(`❌ ซื้อไม่สำเร็จ: ${e?.message || e}`, "err");
  }
}

// ---------- Rewards (Referral USDT) ----------
async function refreshRewards() {
  try {
    const amt = await sale.methods.accruedRefUSDT(account).call();
    el("refUsdt").textContent = `${fmt(amt, DEC_USDT())} USDT`;
  } catch (e) {
    console.warn("accruedRefUSDT failed:", e);
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
    console.error(e);
    toast(`❌ เคลมไม่สำเร็จ: ${e?.message || e}`, "err");
  }
}

// ---------- Stakes ----------
async function loadStakes() {
  const box = el("stakes");
  box.innerHTML = "⏳ กำลังโหลด stakes...";
  try {
    const n = Number(await sale.methods.getStakeCount(account).call());
    const lockDur = await sale.methods.LOCK_DURATION().call();
    const now = Math.floor(Date.now() / 1000);
    const decT = DEC_CAT();

    let totalPrincipal = 0n;
    let totalPending = 0n;
    box.innerHTML = "";

    if (n === 0) {
      el("totals").textContent = "รวม Principal: 0 CAT • รอเคลม: 0 CAT";
      box.innerHTML = "<div class='muted'>ยังไม่มีรายการ stake</div>";
      return;
    }

    for (let i = 0; i < n; i++) {
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
        <div>Principal: ${fmt(s.amount, decT)} CAT</div>
        <div>รอเคลม: ${fmt(pend, decT)} CAT</div>
        <div class="muted">เริ่ม: ${fmtDateTime(s.startTime)}</div>
        <div class="muted">เคลมถัดไป: ${fmtDateTime(next)}</div>
        <div class="muted">ครบล็อก: ${fmtDateTime(unlockTs)} (${daysRemain} วัน)</div>
        <button class="btnClaim" data-i="${i}">เคลม</button>
        <button class="btnUnstake" data-i="${i}" ${!canUn ? "disabled" : ""}>Unstake</button>
      `;
      box.appendChild(div);
    }

    el("totals").textContent =
      `รวม Principal: ${fmt(totalPrincipal, decT)} CAT • ` +
      `รอเคลม: ${fmt(totalPending, decT)} CAT`;

    document.querySelectorAll(".btnClaim").forEach(b =>
      b.addEventListener("click", async () => {
        const i = Number(b.dataset.i);
        try {
          toast("⏳ ส่งธุรกรรมเคลม...");
          await sale.methods.claimStakingReward(i).send({ from: account });
          toast("✅ เคลมผลตอบแทนสำเร็จ", "ok");
          await loadStakes();
        } catch (e) {
          console.error(e);
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
          console.error(e);
          toast(`❌ Unstake ไม่สำเร็จ: ${e?.message || e}`, "err");
        }
      })
    );
  } catch (e) {
    console.error(e);
    box.innerHTML = "❌ โหลด stake ไม่สำเร็จ";
  }
}

// ---------- Wire ----------
window.addEventListener("DOMContentLoaded", () => {
  el("btnConnect")?.addEventListener("click", connect);
  el("btnLockRef")?.addEventListener("click", lockRef);
  el("btnClaimRef")?.addEventListener("click", claimReferral);
});
