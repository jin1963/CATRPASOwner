// ===========================
// CAT Owner Config (BSC Mainnet)
// ===========================
const OWNER_CONFIG = {
  chainId: "0x38", // BSC Mainnet
  contractAddress: "0x69975B4212516FD869cF5e44CFc10FEB1aa7BFcd", // UniversalReferralAutoStake
  usdtAddress: "0x55d398326f99059fF775485246999027B3197955",     // USDT (BEP20)
  stakeTokenAddress: "0xd1961485ad351D140DFB231De85d6D6Ec30AC6d5" // CAT Token
};

// (optional) Minimal ERC20 ABI – ใช้เช็ค balance / approve ได้ถ้าจำเป็น
const ERC20_MINI_ABI = [
  { "constant": true,  "inputs": [{"name":"_owner","type":"address"}],
    "name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function" },
  { "constant": true,  "inputs": [], "name":"decimals",
    "outputs":[{"name":"","type":"uint8"}],"type":"function" },
  { "constant": true,  "inputs": [{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],
    "name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"type":"function" },
  { "constant": false, "inputs": [{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],
    "name":"approve","outputs":[{"name":"success","type":"bool"}],"type":"function" }
];

// ===========================
// UniversalReferralAutoStake – Minimal Owner ABI
// (ครอบคลุมฟังก์ชันที่หน้า owner ใช้จริง)
// ===========================
const STAKING_ABI = [
  // ----- views: พารามิเตอร์/โทเค็น/สถานะ -----
  { "inputs": [], "name": "REWARD_APR_BPS", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "CLAIM_INTERVAL_STAKE", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "LOCK_DURATION", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "REF1_BPS", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "REF2_BPS", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "REF3_BPS", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "REF_CLAIM_INTERVAL", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "USDT", "outputs": [{"internalType":"address","name":"","type":"address"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "STAKE_TOKEN", "outputs": [{"internalType":"address","name":"","type":"address"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name": "paused", "outputs": [{"internalType":"bool","name":"","type":"bool"}], "stateMutability":"view", "type":"function" },

  // ----- views: แพ็กเกจ -----
  { "inputs": [], "name": "packageCount", "outputs":[{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs":[{"internalType":"uint256","name":"","type":"uint256"}], "name":"packages",
    "outputs":[
      {"internalType":"uint256","name":"usdtIn","type":"uint256"},
      {"internalType":"uint256","name":"tokenOut","type":"uint256"},
      {"internalType":"bool","name":"active","type":"bool"}
    ], "stateMutability":"view", "type":"function" },

  // ----- owner actions: ตั้งค่าพารามิเตอร์/แพ็กเกจ -----
  { "inputs":[
      {"internalType":"uint256","name":"aprBps","type":"uint256"},
      {"internalType":"uint256","name":"claimInt","type":"uint256"},
      {"internalType":"uint256","name":"lockDur","type":"uint256"},
      {"internalType":"uint256","name":"ref1_bps","type":"uint256"},
      {"internalType":"uint256","name":"ref2_bps","type":"uint256"},
      {"internalType":"uint256","name":"ref3_bps","type":"uint256"},
      {"internalType":"uint256","name":"refClaimInt","type":"uint256"}
    ],
    "name":"setParams","outputs":[],"stateMutability":"nonpayable","type":"function"
  },
  { "inputs":[
      {"internalType":"uint256","name":"id","type":"uint256"},
      {"internalType":"uint256","name":"usdtIn","type":"uint256"},
      {"internalType":"uint256","name":"tokenOut","type":"uint256"},
      {"internalType":"bool","name":"active","type":"bool"}
    ],
    "name":"setPackage","outputs":[],"stateMutability":"nonpayable","type":"function"
  },

  // ----- owner actions: ถอนเหรียญ -----
  { "inputs":[
      {"internalType":"uint256","name":"amount","type":"uint256"},
      {"internalType":"address","name":"to","type":"address"}
    ], "name":"ownerWithdrawUSDT","outputs":[], "stateMutability":"nonpayable", "type":"function"
  },
  { "inputs":[
      {"internalType":"uint256","name":"amount","type":"uint256"},
      {"internalType":"address","name":"to","type":"address"}
    ], "name":"ownerWithdrawStakeToken","outputs":[], "stateMutability":"nonpayable", "type":"function"
  },

  // ----- owner actions: pause -----
  { "inputs": [], "name":"pause", "outputs":[], "stateMutability":"nonpayable", "type":"function" },
  { "inputs": [], "name":"unpause", "outputs":[], "stateMutability":"nonpayable", "type":"function" },

  // ----- (เผื่อใช้) airdrop stake -----
  { "inputs":[
      {"internalType":"address[]","name":"users","type":"address[]"},
      {"internalType":"uint256[]","name":"amounts","type":"uint256[]"},
      {"internalType":"uint256","name":"startTime","type":"uint256"}
    ], "name":"airdropStakes","outputs":[], "stateMutability":"nonpayable", "type":"function"
  }
];

// export แบบ global ให้ owner.js ใช้งาน
window.OWNER_CONFIG = OWNER_CONFIG;
window.ERC20_MINI_ABI = ERC20_MINI_ABI;
window.STAKING_ABI = STAKING_ABI;
