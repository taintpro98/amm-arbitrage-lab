import { ethers, network } from "hardhat";
import { saveDeployment } from "../utils/saveDeployment";

/**
 * Deploys two mock ERC-20s and one MinimalPair. Approve/mint flows are left to tests or follow-up scripts.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const { chainId } = await ethers.provider.getNetwork();

  const initialSupply = ethers.parseEther(process.env.MOCK_TOKEN_SUPPLY ?? "1000000");

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const tokenA = await MockERC20.deploy("Token A", "TOKA", initialSupply);
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();

  const tokenB = await MockERC20.deploy("Token B", "TOKB", initialSupply);
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();

  const MinimalPair = await ethers.getContractFactory("MinimalPair");
  const pair = await MinimalPair.deploy(tokenAAddress, tokenBAddress);
  await pair.waitForDeployment();
  const pairAddress = await pair.getAddress();

  const token0 = await pair.token0();
  const token1 = await pair.token1();

  const base = {
    chainId: Number(chainId),
    deployer: deployer.address,
    network: network.name,
  };

  saveDeployment({
    ...base,
    name: "MockERC20_TokenA",
    address: tokenAAddress,
    symbol: "TOKA",
  });
  saveDeployment({
    ...base,
    name: "MockERC20_TokenB",
    address: tokenBAddress,
    symbol: "TOKB",
  });
  saveDeployment({
    ...base,
    name: "MinimalPair",
    address: pairAddress,
    token0,
    token1,
  });

  console.log(JSON.stringify({ tokenA: tokenAAddress, tokenB: tokenBAddress, pair: pairAddress, token0, token1 }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
