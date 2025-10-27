require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/247f279c5c55404983e3582a19fe8ddd",
      accounts: ["b04ee6a2602f25d732e064490c5a7b784f8aa46f159c7cd00e91f0babdcf92d7"]
    }
  }
};