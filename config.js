// ===============================
// CONFIG: CAT Package Referral Auto-Stake (Public DApp)
// ===============================
window.NETWORK = { chainIdHex: "0x38" }; // ✅ BSC Mainnet

window.ADDR = {
  CONTRACT: "0x69975B4212516FD869cF5e44CFc10FEB1aa7BFcd", // ✅ CAT Package Referral Auto-Stake Contract
  USDT:     "0x55d398326f99059fF775485246999027B3197955", // ✅ USDT (BEP-20)
  CAT:      "0xd1961485ad351D140DFB231De85d6D6Ec30AC6d5"  // ✅ CAT Token (Stake Token)
};

// ✅ Token Decimals
window.DECIMALS = { USDT: 18, CAT: 18 };

// ✅ UI Fallback Packages (ใช้เฉพาะตอนอ่านจากสัญญาไม่ได้)
window.UI_CONST = {
  FALLBACK_PACKAGES: [
    { id: 1, usdt: "10000000000000000000",  cat: "1500000000000000000000", active: true },  // 10 USDT → 1,500 CAT
    { id: 2, usdt: "100000000000000000000", cat: "6000000000000000000000", active: true }   // 100 USDT → 6,000 CAT
  ]
};

// ✅ Minimal ERC20 ABI (approve, allowance, balanceOf, decimals)
window.ERC20_MINI_ABI = [
  { "constant": true,  "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
  { "constant": true,  "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "type": "function" },
  { "constant": true,  "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "remaining", "type": "uint256" }], "type": "function" },
  { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "success", "type": "bool" }], "type": "function" }
];

// ✅ ABI เต็มของสัญญา CAT (ตรงกับสัญญา 0x69975B4212516FD869cF5e44CFc10FEB1aa7BFcd)
window.SALE_ABI = [
  // --- constructor ---
  {"inputs":[
    {"internalType":"address","name":"owner_","type":"address"},
    {"internalType":"address","name":"usdt_","type":"address"},
    {"internalType":"address","name":"stakeToken_","type":"address"},
    {"internalType":"uint256","name":"aprBps","type":"uint256"},
    {"internalType":"uint256","name":"claimIntervalStake","type":"uint256"},
    {"internalType":"uint256","name":"lockDuration","type":"uint256"},
    {"internalType":"uint256","name":"ref1_bps","type":"uint256"},
    {"internalType":"uint256","name":"ref2_bps","type":"uint256"},
    {"internalType":"uint256","name":"ref3_bps","type":"uint256"},
    {"internalType":"uint256","name":"refClaimInterval","type":"uint256"}
  ],"stateMutability":"nonpayable","type":"constructor"},

  // --- Events ---
  {"anonymous":false,"inputs":[
    {"indexed":true,"internalType":"address","name":"user","type":"address"},
    {"indexed":true,"internalType":"uint256","name":"packageId","type":"uint256"},
    {"indexed":false,"internalType":"uint256","name":"usdtIn","type":"uint256"},
    {"indexed":false,"internalType":"uint256","name":"tokenOut","type":"uint256"},
    {"indexed":false,"internalType":"uint256","name":"stakeIndex","type":"uint256"}
  ],"name":"BoughtAndAutoStaked","type":"event"},

  {"anonymous":false,"inputs":[
    {"indexed":true,"internalType":"address","name":"user","type":"address"},
    {"indexed":false,"internalType":"uint256","name":"amountUSDT","type":"uint256"}
  ],"name":"ClaimReferral","type":"event"},

  {"anonymous":false,"inputs":[
    {"indexed":true,"internalType":"address","name":"user","type":"address"},
    {"indexed":true,"internalType":"uint256","name":"index","type":"uint256"},
    {"indexed":false,"internalType":"uint256","name":"amountToken","type":"uint256"}
  ],"name":"ClaimStakeReward","type":"event"},

  // --- Views ---
  {"inputs":[],"name":"BPS_DENOM","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"CLAIM_INTERVAL_STAKE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"LOCK_DURATION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"REF1_BPS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"REF2_BPS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"REF3_BPS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"REF_CLAIM_INTERVAL","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"REWARD_APR_BPS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"SECONDS_PER_YEAR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"STAKE_TOKEN","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"USDT","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},

  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"accruedRefUSDT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getStakeCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"pendingStakeReward","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"nextStakeClaimTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"packageCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"packages","outputs":[
    {"internalType":"uint256","name":"usdtIn","type":"uint256"},
    {"internalType":"uint256","name":"tokenOut","type":"uint256"},
    {"internalType":"bool","name":"active","type":"bool"}],"stateMutability":"view","type":"function"},

  // --- User actions ---
  {"inputs":[{"internalType":"uint256","name":"packageId","type":"uint256"},{"internalType":"address","name":"ref","type":"address"}],"name":"buyPackage","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"claimStakingReward","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"claimReferralReward","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"unstake","outputs":[],"stateMutability":"nonpayable","type":"function"},

  // --- Owner ---
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"to","type":"address"}],"name":"ownerWithdrawStakeToken","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"to","type":"address"}],"name":"ownerWithdrawUSDT","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}
];
