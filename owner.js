let web3, account, contract;

async function connectWallet() {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const accounts = await web3.eth.getAccounts();
    account = accounts[0];
    document.getElementById("wallet").innerText = `✅ Connected: ${account}`;
    contract = new web3.eth.Contract(STAKING_ABI, OWNER_CONFIG.contractAddress);
  } else {
    alert("กรุณาเชื่อมต่อ MetaMask หรือ Bitget Wallet ก่อน");
  }
}

// ------------------------------
// ตั้งค่าพารามิเตอร์ระบบ
// ------------------------------
async function setParams() {
  const apr = document.getElementById("apr").value;
  const claimInt = document.getElementById("claimInterval").value;
  const lockDur = document.getElementById("lockDuration").value;
  const ref1 = document.getElementById("ref1").value;
  const ref2 = document.getElementById("ref2").value;
  const ref3 = document.getElementById("ref3").value;
  const refClaim = document.getElementById("refClaimInterval").value;

  await contract.methods
    .setParams(apr, claimInt, lockDur, ref1, ref2, ref3, refClaim)
    .send({ from: account });
  alert("อัปเดตพารามิเตอร์เรียบร้อย!");
}

// ------------------------------
// เพิ่มหรือแก้ไขแพ็กเกจ
// ------------------------------
async function setPackage() {
  const id = document.getElementById("pkgId").value;
  const usdtIn = web3.utils.toWei(document.getElementById("usdtIn").value, "ether");
  const tokenOut = web3.utils.toWei(document.getElementById("tokenOut").value, "ether");
  const active = document.getElementById("active").value === "true";

  await contract.methods.setPackage(id, usdtIn, tokenOut, active).send({ from: account });
  alert("ตั้งค่าแพ็กเกจสำเร็จ!");
}

// ------------------------------
// ถอนเหรียญจากสัญญา (เฉพาะ Owner)
// ------------------------------
async function withdrawCAT() {
  const amt = web3.utils.toWei(document.getElementById("amtCAT").value, "ether");
  const to = document.getElementById("toCAT").value;
  await contract.methods.ownerWithdrawStakeToken(amt, to).send({ from: account });
  alert("ถอน CAT เรียบร้อย!");
}

async function withdrawUSDT() {
  const amt = web3.utils.toWei(document.getElementById("amtUSDT").value, "ether");
  const to = document.getElementById("toUSDT").value;
  await contract.methods.ownerWithdrawUSDT(amt, to).send({ from: account });
  alert("ถอน USDT เรียบร้อย!");
}
