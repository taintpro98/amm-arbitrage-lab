import { expect } from "chai";
import { ethers } from "hardhat";
import { deployMockPairFixture } from "../helpers/fixtures";

describe("Liquidity flow (integration)", () => {
  it("adds liquidity then removes proportional underlying", async () => {
    const { deployer, pair, token0, token1 } = await deployMockPairFixture();
    const a0 = ethers.parseEther("500");
    const a1 = ethers.parseEther("500");

    await token0.approve(await pair.getAddress(), a0);
    await token1.approve(await pair.getAddress(), a1);
    await pair.mint(a0, a1, 0, 0);

    const lp = await pair.balanceOf(deployer.address);

    const b0Before = await token0.balanceOf(deployer.address);
    const b1Before = await token1.balanceOf(deployer.address);

    await pair.burn(lp, 0, 0, deployer.address);

    expect(await token0.balanceOf(deployer.address)).to.be.gt(b0Before);
    expect(await token1.balanceOf(deployer.address)).to.be.gt(b1Before);
    expect(await pair.balanceOf(deployer.address)).to.equal(0n);
  });
});
