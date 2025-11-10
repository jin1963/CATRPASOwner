// ===============================
// CONFIG — CAT DApps (BSC Mainnet)
// ===============================
window.NETWORK = { chainIdHex: "0x38" };

window.ADDR = {
  CONTRACT: "0x69975B4212516FD869cF5e44CFc10FEB1aa7BFcd",
  USDT:     "0x55d398326f99059fF775485246999027B3197955",
  STAKE:    "0xd1961485ad351D140DFB231De85d6D6Ec30AC6d5" // CAT
};

window.TOKEN_SYMBOL = "CAT";

// ERC20 minimal
window.ERC20_MINI_ABI = [
  {"constant":true,"inputs":[{"name":"a","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"type":"function"},
  {"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"type":"function"},
  {"constant":true,"inputs":[{"name":"o","type":"address"},{"name":"s","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"type":"function"},
  {"constant":false,"inputs":[{"name":"s","type":"address"},{"name":"v","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"type":"function"}
];

// UniversalReferralAutoStake — ABI ที่ครอบคลุม owner + public
window.SALE_ABI = [
  // views (params)
  {"inputs":[],"name":"REWARD_APR_BPS","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"CLAIM_INTERVAL_STAKE","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"LOCK_DURATION","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"REF1_BPS","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"REF2_BPS","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"REF3_BPS","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"REF_CLAIM_INTERVAL","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[],"name":"paused","outputs":[{"type":"bool"}],"stateMutability":"view","type":"function"},

  // views (packages)
  {"inputs":[],"name":"packageCount","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"type":"uint256"}],"name":"packages","outputs":[
    {"name":"usdtIn","type":"uint256"},
    {"name":"tokenOut","type":"uint256"},
    {"name":"active","type":"bool"}
  ],"stateMutability":"view","type":"function"},

  // views (stakes)
  {"inputs":[{"name":"user","type":"address"}],"name":"getStakeCount","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"type":"address"},{"type":"uint256"}],"name":"stakes","outputs":[
    {"name":"amount","type":"uint256"},
    {"name":"startTime","type":"uint256"},
    {"name":"lastClaim","type":"uint256"},
    {"name":"withdrawn","type":"bool"}
  ],"stateMutability":"view","type":"function"},
  {"inputs":[{"name":"user","type":"address"},{"name":"index","type":"uint256"}],"name":"pendingStakeReward","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"name":"user","type":"address"},{"name":"index","type":"uint256"}],"name":"nextStakeClaimTime","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"type":"address"}],"name":"lastRefClaimAt","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"type":"address"}],"name":"accruedRefUSDT","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},

  // writes (owner)
  {"inputs":[
    {"name":"aprBps","type":"uint256"},{"name":"claimInt","type":"uint256"},{"name":"lockDur","type":"uint256"},
    {"name":"r1","type":"uint256"},{"name":"r2","type":"uint256"},{"name":"r3","type":"uint256"},{"name":"refClaimInt","type":"uint256"}
  ],"name":"setParams","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"name":"id","type":"uint256"},{"name":"usdtIn","type":"uint256"},{"name":"tokenOut","type":"uint256"},{"name":"active","type":"bool"}],"name":"setPackage","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"name":"amount","type":"uint256"},{"name":"to","type":"address"}],"name":"ownerWithdrawUSDT","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"name":"amount","type":"uint256"},{"name":"to","type":"address"}],"name":"ownerWithdrawStakeToken","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},

  // writes (public)
  {"inputs":[{"name":"ref","type":"address"}],"name":"setReferrer","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"name":"packageId","type":"uint256"},{"name":"ref","type":"address"}],"name":"buyPackage","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"name":"index","type":"uint256"}],"name":"claimStakingReward","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"claimReferralReward","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"name":"index","type":"uint256"}],"name":"unstake","outputs":[],"stateMutability":"nonpayable","type":"function"}
];
