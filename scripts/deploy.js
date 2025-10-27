const hre = require("hardhat");

async function main() {
  // 'VehicleInfo' 대신 'contracts/VehicleInfo.sol:VehicleInfo'로 명확하게 지정
  const vehicleInfo = await hre.ethers.deployContract("contracts/VehicleInfo.sol:VehicleInfo");

  await vehicleInfo.waitForDeployment();

  console.log(
    `VehicleInfo contract deployed to ${vehicleInfo.target}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});