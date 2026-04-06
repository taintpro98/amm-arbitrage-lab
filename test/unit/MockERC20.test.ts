import { expect } from "chai";
import { ethers } from "hardhat";

describe("MockERC20", () => {
  it("mints initial supply to deployer", async () => {
    const [deployer] = await ethers.getSigners();
    const supply = ethers.parseEther("1000");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("Test", "TST", supply);
    await token.waitForDeployment();
    expect(await token.balanceOf(deployer.address)).to.equal(supply);
    expect(await token.totalSupply()).to.equal(supply);
  });
});
