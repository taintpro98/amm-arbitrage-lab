/**
 * Standalone Node client for local experiments (Anvil / localhost).
 * Uses ethers + deployment JSON + artifacts — no Hardhat runtime required.
 *
 * CLI entry: `client-testing/main.ts` → `npm run client:demo`
 */
import * as fs from "fs";
import * as path from "path";
import { ethers, type InterfaceAbi } from "ethers";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const ROOT = process.cwd();

function readJson<T>(relativePath: string): T {
  const full = path.join(ROOT, relativePath);
  return JSON.parse(fs.readFileSync(full, "utf8")) as T;
}

export type DeploymentPair = {
  name: string;
  address: string;
  chainId: number;
  token0: string;
  token1: string;
  deployer?: string;
};

export type BlockchainClientOptions = {
  /** Default: LOCAL_RPC_URL or http://127.0.0.1:8545 */
  rpcUrl?: string;
  /** Default: LOCAL_CHAIN_ID or 31337 */
  chainId?: number;
  /** Default: PRIVATE_KEY from .env (Anvil account #0 if unset for read-only) */
  privateKey?: string;
};

/** Raw on-chain reserves (same units as `MinimalPair.getReserves()`). */
export type PairReserves = {
  reserve0: bigint;
  reserve1: bigint;
};

/** Reserves with token metadata for display. */
export type PairReservesFormatted = {
  reserve0: string;
  reserve1: string;
  symbol0: string;
  symbol1: string;
  decimals0: number;
  decimals1: number;
};

function loadPairAbi(): InterfaceAbi {
  const artifact = readJson<{ abi: InterfaceAbi }>(
    "artifacts/contracts/amm/MinimalPair.sol/MinimalPair.json",
  );
  return artifact.abi;
}

function loadErc20Abi(): InterfaceAbi {
  const artifact = readJson<{ abi: InterfaceAbi }>(
    "artifacts/contracts/tokens/MockERC20.sol/MockERC20.json",
  );
  return artifact.abi;
}

function loadDeployment(chainId: number): DeploymentPair {
  const file = path.join(ROOT, "deployments", String(chainId), "MinimalPair.json");
  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing ${file}. Deploy first: npm run deploy:local (with chain running) or deploy:hardhat.`,
    );
  }
  return readJson<DeploymentPair>(path.relative(ROOT, file));
}

export class BlockchainClient {
  readonly provider: ethers.JsonRpcProvider;
  readonly signer: ethers.Wallet;
  readonly pair: ethers.Contract;
  readonly token0: ethers.Contract;
  readonly token1: ethers.Contract;

  /** Monotonic nonce for sequential txs (avoids duplicate nonce from provider races). */
  private txNonce: number | null = null;

  private constructor(
    provider: ethers.JsonRpcProvider,
    signer: ethers.Wallet,
    pair: ethers.Contract,
    token0: ethers.Contract,
    token1: ethers.Contract,
  ) {
    this.provider = provider;
    this.signer = signer;
    this.pair = pair;
    this.token0 = token0;
    this.token1 = token1;
  }

  static async connect(options: BlockchainClientOptions = {}): Promise<BlockchainClient> {
    const rpcUrl = options.rpcUrl ?? process.env.LOCAL_RPC_URL ?? "http://127.0.0.1:8545";
    const chainId = options.chainId ?? (Number(process.env.LOCAL_CHAIN_ID) || 31337);

    let pk =
      options.privateKey ??
      process.env.PRIVATE_KEY ??
      // Anvil default account #0 (local only)
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    if (pk && !pk.startsWith("0x")) {
      pk = `0x${pk}`;
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
    const signer = new ethers.Wallet(pk, provider);

    const dep = loadDeployment(chainId);
    const pairAbi = loadPairAbi();
    const erc20Abi = loadErc20Abi();

    const pair = new ethers.Contract(dep.address, pairAbi, signer);
    const token0 = new ethers.Contract(dep.token0, erc20Abi, signer);
    const token1 = new ethers.Contract(dep.token1, erc20Abi, signer);

    return new BlockchainClient(provider, signer, pair, token0, token1);
  }

  /**
   * Calls `MinimalPair.getReserves()` — pool balances of token0 and token1 (wei / smallest units).
   */
  async getReserves(): Promise<PairReserves> {
    const fn = this.pair.getFunction("getReserves");
    const result = (await fn.staticCall()) as [bigint, bigint];
    return { reserve0: result[0], reserve1: result[1] };
  }

  /** Same as `getReserves()` plus human-readable strings using each token’s `decimals`. */
  async getReservesFormatted(): Promise<PairReservesFormatted> {
    const [raw, dec0, dec1, sym0, sym1] = await Promise.all([
      this.getReserves(),
      this.token0.decimals(),
      this.token1.decimals(),
      this.token0.symbol(),
      this.token1.symbol(),
    ]);
    return {
      reserve0: ethers.formatUnits(raw.reserve0, dec0),
      reserve1: ethers.formatUnits(raw.reserve1, dec1),
      symbol0: sym0,
      symbol1: sym1,
      decimals0: Number(dec0),
      decimals1: Number(dec1),
    };
  }

  /** Pretty-print reserves and token symbols (requires compile artifacts). */
  async printPairState(): Promise<void> {
    const { reserve0: r0, reserve1: r1 } = await this.getReserves();
    const sym0 = await this.token0.symbol();
    const sym1 = await this.token1.symbol();
    const dec0 = await this.token0.decimals();
    const dec1 = await this.token1.decimals();
    console.log(
      JSON.stringify(
        {
          pair: await this.pair.getAddress(),
          token0: { address: await this.token0.getAddress(), symbol: sym0, reserve: ethers.formatUnits(r0, dec0) },
          token1: { address: await this.token1.getAddress(), symbol: sym1, reserve: ethers.formatUnits(r1, dec1) },
        },
        null,
        2,
      ),
    );
  }

  /** All `MinimalPair` view / constant getters in one object. */
  async getPairOverview(account: string): Promise<{
    pairAddress: string;
    token0: string;
    token1: string;
    reserve0Slot: bigint;
    reserve1Slot: bigint;
    getReserves: PairReserves;
    totalSupply: bigint;
    lpBalance: bigint;
    MINIMUM_LIQUIDITY: bigint;
    FEE_NUMERATOR: bigint;
    FEE_DENOMINATOR: bigint;
  }> {
    const p = this.pair;
    const [
      pairAddress,
      token0,
      token1,
      reserve0Slot,
      reserve1Slot,
      reserves,
      totalSupply,
      lpBalance,
      minLiq,
      feeNum,
      feeDen,
    ] = await Promise.all([
      p.getAddress(),
      p.token0(),
      p.token1(),
      p.reserve0(),
      p.reserve1(),
      this.getReserves(),
      p.totalSupply(),
      p.balanceOf(account),
      p.MINIMUM_LIQUIDITY(),
      p.FEE_NUMERATOR(),
      p.FEE_DENOMINATOR(),
    ]);
    return {
      pairAddress,
      token0,
      token1,
      reserve0Slot,
      reserve1Slot,
      getReserves: reserves,
      totalSupply,
      lpBalance,
      MINIMUM_LIQUIDITY: minLiq,
      FEE_NUMERATOR: feeNum,
      FEE_DENOMINATOR: feeDen,
    };
  }

  /** `MinimalPair.getAmountOut` */
  async getAmountOut(tokenIn: string, amountIn: bigint): Promise<bigint> {
    const fn = this.pair.getFunction("getAmountOut");
    return (await fn.staticCall(tokenIn, amountIn)) as bigint;
  }

  /** ERC-20 `approve` for the pair as spender. */
  async approveToken(
    which: "token0" | "token1",
    amount: bigint,
  ): Promise<{ hash: string }> {
    const token = which === "token0" ? this.token0 : this.token1;
    const pairAddr = await this.pair.getAddress();
    const nonce = await this.nextNonce();
    const tx = await token.getFunction("approve")(pairAddr, amount, { nonce });
    const receipt = await tx.wait();
    return { hash: receipt!.hash };
  }

  /** `MinimalPair.mint` (requires prior `approve` on both tokens). */
  async mint(
    amount0Desired: bigint,
    amount1Desired: bigint,
    amount0Min: bigint,
    amount1Min: bigint,
  ): Promise<{ hash: string }> {
    const nonce = await this.nextNonce();
    const tx = await this.pair.getFunction("mint")(amount0Desired, amount1Desired, amount0Min, amount1Min, {
      nonce,
    });
    const receipt = await tx.wait();
    return { hash: receipt!.hash };
  }

  /** `MinimalPair.swap` (requires `approve` on `tokenIn`). */
  async swap(
    tokenIn: string,
    amountIn: bigint,
    amountOutMin: bigint,
    to: string,
  ): Promise<{ hash: string }> {
    const nonce = await this.nextNonce();
    const tx = await this.pair.getFunction("swap")(tokenIn, amountIn, amountOutMin, to, { nonce });
    const receipt = await tx.wait();
    return { hash: receipt!.hash };
  }

  /** `MinimalPair.burn` */
  async burn(
    liquidity: bigint,
    amount0Min: bigint,
    amount1Min: bigint,
    to: string,
  ): Promise<{ hash: string }> {
    const nonce = await this.nextNonce();
    const tx = await this.pair.getFunction("burn")(liquidity, amount0Min, amount1Min, to, { nonce });
    const receipt = await tx.wait();
    return { hash: receipt!.hash };
  }

  async erc20Balance(token: "token0" | "token1", account: string): Promise<bigint> {
    const t = token === "token0" ? this.token0 : this.token1;
    return (await t.getFunction("balanceOf").staticCall(account)) as bigint;
  }

  /** Next nonce: seed from chain once, then increment locally for each tx. */
  private async nextNonce(): Promise<number> {
    if (this.txNonce === null) {
      this.txNonce = await this.provider.getTransactionCount(this.signer.address, "latest");
    }
    const n = this.txNonce;
    this.txNonce += 1;
    return n;
  }
}
