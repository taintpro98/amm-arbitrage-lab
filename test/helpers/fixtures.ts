import { ethers } from "hardhat";

export async function deployMockPairFixture() {
  const [deployer, alice] = await ethers.getSigners();
  const supply = ethers.parseEther("1000000");

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const tokenA = await MockERC20.deploy("Token A", "TOKA", supply);
  const tokenB = await MockERC20.deploy("Token B", "TOKB", supply);
  await tokenA.waitForDeployment();
  await tokenB.waitForDeployment();

  const MinimalPair = await ethers.getContractFactory("MinimalPair");
  const pair = await MinimalPair.deploy(await tokenA.getAddress(), await tokenB.getAddress());
  await pair.waitForDeployment();

  const token0Addr = await pair.token0();
  const token0 = token0Addr === (await tokenA.getAddress()) ? tokenA : tokenB;
  const token1 = token0Addr === (await tokenA.getAddress()) ? tokenB : tokenA;

  return { deployer, alice, tokenA, tokenB, token0, token1, pair };
}
