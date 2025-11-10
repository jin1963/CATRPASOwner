// ===============================
// CONFIG — CAT Universal Referral Auto-Stake (Owner Console)
// ===============================

// เครือข่ายที่ต้องการให้เชื่อม (BSC Mainnet)
window.NETWORK = {
  chainIdHex: "0x38",
  name: "BSC Mainnet",
};

// ที่อยู่สัญญา/โทเค็น
window.ADDR = {
  CONTRACT: "0x69975B4212516FD869cF5e44CFc10FEB1aa7BFcd", // UniversalReferralAutoStake (ใหม่)
  USDT:     "0x55d398326f99059fF775485246999027B3197955", // USDT (BEP-20)
  STAKE:    "0xd1961485ad351D140DFB231De85d6D6Ec30AC6d5", // CAT token (STAKE_TOKEN)
};

// ทศนิยมโทเค็น
window.DECIMALS = { USDT: 18, STAKE: 18 };

// ---------- Minimal ERC20 ABI ที่พอใช้ดึง balance/approve ----------
window.ERC20_MINI_ABI = [
  { "constant": true,  "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
  { "constant": true,  "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "type": "function" },
  { "constant": true,  "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "remaining", "type": "uint256" }], "type": "function" },
  { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "success", "type": "bool" }], "type": "function" }
];

// ---------- ABI ของ UniversalReferralAutoStake (ตามที่คุณ deploy) ----------
window.SALE_ABI = [
  {"inputs":[{"internalType":"address","name":"owner_","type":"address"},{"internalType":"address","name":"usdt_","type":"address"},{"internalType":"address","name":"stakeToken_","type":"address"},{"internalType":"uint256","name":"aprBps","type":"uint256"},{"internalType":"uint256","name":"claimIntervalStake","type":"uint256"},{"internalType":"uint256","name":"lockDuration","type":"uint256"},{"internalType":"uint256","name":"ref1_bps","type":"uint256"},{"internalType":"uint256","name":"ref2_bps","type":"uint256"},{"internalType":"uint256","name":"ref3_bps","type":"uint256"},{"internalType":"uint256","name":"refClaimInterval","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[],"name":"BPS_DENOM","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"REWARD_APR_BPS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"CLAIM_INTERVAL_STAKE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"LOCK_DURATION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"REF1_BPS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"REF2_BPS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"REF3_BPS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"REF_CLAIM_INTERVAL","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"USDT","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"STAKE_TOKEN","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},

  {"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"usdtIn","type":"uint256"},{"internalType":"uint256","name":"tokenOut","type":"uint256"},{"internalType":"bool","name":"active","type":"bool"}],"name":"setPackage","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"aprBps","type":"uint256"},{"internalType":"uint256","name":"claimInt","type":"uint256"},{"internalType":"uint256","name":"lockDur","type":"uint256"},{"internalType":"uint256","name":"ref1_bps","type":"uint256"},{"internalType":"uint256","name":"ref2_bps","type":"uint256"},{"internalType":"uint256","name":"ref3_bps","type":"uint256"},{"internalType":"uint256","name":"refClaimInt","type":"uint256"}],"name":"setParams","outputs":[],"stateMutability":"nonpayable","type":"function"},

  {"inputs":[],"name":"packageCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"packages","outputs":[{"internalType":"uint256","name":"usdtIn","type":"uint256"},{"internalType":"uint256","name":"tokenOut","type":"uint256"},{"internalType":"bool","name":"active","type":"bool"}],"stateMutability":"view","type":"function"},

  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"to","type":"address"}],"name":"ownerWithdrawUSDT","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address","name":"to","type":"address"}],"name":"ownerWithdrawStakeToken","outputs":[],"stateMutability":"nonpayable","type":"function"},

  {"inputs":[{"internalType":"address[]","name":"users","type":"address[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"uint256","name":"startTime","type":"uint256"}],"name":"airdropStakes","outputs":[],"stateMutability":"nonpayable","type":"function"},

  // (อีเวนต์ต่าง ๆ ใช้แค่ตอน listen / ไม่บังคับสำหรับ owner console)
];
