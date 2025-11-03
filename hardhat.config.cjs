require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify"); // ✅ 1. 인증(verify) 플러그인 추가

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/247f279c5c55404983e3582a19fe8ddd",
      accounts: ["b04ee6a2602f25d732e064490c5a7b784f8aa46f159c7cd00e91f0babdcf92d7"]
    }
  },
  
  // ✅ 2. Etherscan 인증 설정 추가
  etherscan: {
    // Etherscan API 키를 여기에 하드코딩합니다.
    // "YOUR_ETHERSCAN_API_KEY" 부분을 실제 발급받은 키로 교체하세요.
    apiKey: "E448ZM2S8J7HN6WG3T9EIZNVEW1H25T1HD"
  }
};