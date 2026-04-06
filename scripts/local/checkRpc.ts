import { ethers } from "hardhat";

/** Quick sanity check that `LOCAL_RPC_URL` / default localhost is reachable. */
async function main() {
  const url = process.env.LOCAL_RPC_URL ?? "http://127.0.0.1:8545";
  const provider = new ethers.JsonRpcProvider(url);
  const block = await provider.getBlockNumber();
  const net = await provider.getNetwork();
  console.log(JSON.stringify({ url, blockNumber: block, chainId: net.chainId.toString() }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
