import { ethers } from "ethers";
import { BlockchainClient } from "./blockchain-client";

function logSection(title: string, data: unknown): void {
  console.log(`\n--- ${title} ---`);
  console.log(
    JSON.stringify(
      data,
      (_, v) => (typeof v === "bigint" ? v.toString() : v),
      2,
    ),
  );
}

/**
 * Demonstrates every `MinimalPair` surface used by this client:
 * views/constants → ERC-20 balances → `getAmountOut` → `approve` → `mint` →
 * `getAmountOut` / `swap` → `burn`.
 */
async function main(): Promise<void> {
  const client = await BlockchainClient.connect();
  const signerAddr = client.signer.address;
  logSection("signer", { address: signerAddr });

  const token0Addr = await client.pair.token0();

  logSection("pair overview (token0/1, reserve slots, getReserves, totalSupply, lpBalance, fee constants)", {
    ...(await client.getPairOverview(signerAddr)),
  });

  logSection("ERC-20 balanceOf(signer)", {
    token0: (await client.erc20Balance("token0", signerAddr)).toString(),
    token1: (await client.erc20Balance("token1", signerAddr)).toString(),
  });

  logSection("getAmountOut (1 token0, empty pool → 0)", {
    amountOut: (await client.getAmountOut(token0Addr, ethers.parseEther("1"))).toString(),
  });

  const mint0 = ethers.parseEther("100");
  const mint1 = ethers.parseEther("400");
  // One max allowance per token avoids extra approve txs (and nonce races) before mint + swap.
  const maxAllowance = ethers.MaxUint256;
  logSection("approve token0 + token1 for pair (max)", {
    token0: (await client.approveToken("token0", maxAllowance)).hash,
    token1: (await client.approveToken("token1", maxAllowance)).hash,
  });

  logSection("mint(amount0, amount1, mins)", {
    tx: (await client.mint(mint0, mint1, 0n, 0n)).hash,
  });

  logSection("pair state after mint", await client.getPairOverview(signerAddr));

  const swapIn = ethers.parseEther("1");
  const quotedOut = await client.getAmountOut(token0Addr, swapIn);
  logSection("getAmountOut (1 token0 after liquidity)", { amountOut: quotedOut.toString() });

  logSection("swap(tokenIn, amountIn, amountOutMin, to) — uses prior max approve", {
    tx: (await client.swap(token0Addr, swapIn, 0n, signerAddr)).hash,
  });

  logSection("pair state after swap", await client.getPairOverview(signerAddr));

  const lpBeforeBurn = await client.pair.balanceOf(signerAddr);
  logSection("burn(all LP, mins)", {
    liquidity: lpBeforeBurn.toString(),
    tx: (await client.burn(lpBeforeBurn, 0n, 0n, signerAddr)).hash,
  });

  logSection("pair overview after burn", await client.getPairOverview(signerAddr));

  logSection("ERC-20 balances after burn", {
    token0: (await client.erc20Balance("token0", signerAddr)).toString(),
    token1: (await client.erc20Balance("token1", signerAddr)).toString(),
  });
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
