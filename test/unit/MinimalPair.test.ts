import { expect } from "chai";
import { ethers } from "hardhat";
import { deployMockPairFixture } from "../helpers/fixtures";

describe("MinimalPair", () => {
  it("orders token0 < token1", async () => {
    const { pair, tokenA, tokenB } = await deployMockPairFixture();
    const t0 = await pair.token0();
    const t1 = await pair.token1();
    const a = await tokenA.getAddress();
    const b = await tokenB.getAddress();
    expect(t0.toLowerCase() < t1.toLowerCase()).to.equal(true);
    expect([a, b].sort((x, y) => (x.toLowerCase() < y.toLowerCase() ? -1 : 1))).to.deep.equal([t0, t1].sort((x, y) => (x.toLowerCase() < y.toLowerCase() ? -1 : 1)));
  });

  it("mints liquidity and updates reserves", async () => {
    const { deployer, pair, token0, token1 } = await deployMockPairFixture();
    const amount0 = ethers.parseEther("100");
    const amount1 = ethers.parseEther("400");

    await token0.approve(await pair.getAddress(), amount0);
    await token1.approve(await pair.getAddress(), amount1);

    await expect(pair.mint(amount0, amount1, 0, 0)).to.emit(pair, "Mint");

    const [r0, r1] = await pair.getReserves();
    expect(r0).to.equal(amount0);
    expect(r1).to.equal(amount1);
    expect(await pair.totalSupply()).to.be.gt(0n);
    expect(await pair.balanceOf(deployer.address)).to.be.gt(0n);
  });

  it("swaps with fee and preserves k approximately", async () => {
    const { deployer, alice, pair, token0, token1 } = await deployMockPairFixture();
    const a0 = ethers.parseEther("1000");
    const a1 = ethers.parseEther("1000");

    await token0.approve(await pair.getAddress(), a0);
    await token1.approve(await pair.getAddress(), a1);
    await pair.mint(a0, a1, 0, 0);

    const [r0Before, r1Before] = await pair.getReserves();
    const kBefore = r0Before * r1Before;

    const amountIn = ethers.parseEther("10");
    await token0.connect(deployer).getFunction("transfer")(alice.address, amountIn);
    await token0.connect(alice).getFunction("approve")(await pair.getAddress(), amountIn);

    const expectedOut = await pair.getAmountOut(await token0.getAddress(), amountIn);
    await expect(
      pair.connect(alice).getFunction("swap")(await token0.getAddress(), amountIn, 0, alice.address),
    ).to.emit(pair, "Swap");

    const [r0After, r1After] = await pair.getReserves();
    const kAfter = r0After * r1After;
    expect(kAfter).to.be.gte(kBefore);
    expect(await token1.balanceOf(alice.address)).to.equal(expectedOut);
  });
});
