# Learning roadmap (PHASE)

Use this file as a **study guide**: complete phases in order unless you already master a topic. Each phase lists goals, where to work in the repo, what to build, what to test, and concepts to internalize before moving on.

---

## Phase 1 — Environment & mock ERC-20 locally

**Learning goal:** Run the toolchain end-to-end and deploy a simple OpenZeppelin-based token you control.

**Files / folders:** `contracts/tokens/MockERC20.sol`, `scripts/deploy/deployAll.ts`, `test/unit/MockERC20.test.ts`, `hardhat.config.ts`, `docker-compose.yml`

**Implement:**

- Run `npm install`, `npx hardhat compile`, `npx hardhat test`.
- Optionally start Anvil: `docker compose up -d anvil`, then point `LOCAL_RPC_URL` at `http://127.0.0.1:8545`.
- Deploy mocks: `npx hardhat run scripts/deploy/deployAll.ts --network localhost` (with node/Anvil running).

**Test:** Unit tests pass; you see `deployments/<chainId>/MockERC20_*.json` after deploy.

**Understand before Phase 2:** ERC-20 balances/allowances, what `transfer` vs `transferFrom` implies for contracts pulling tokens.

---

## Phase 2 — Reserves & adding liquidity

**Learning goal:** See how a pair holds two assets and how **reserves** represent the pool state.

**Files / folders:** `contracts/amm/MinimalPair.sol` (`mint`, `getReserves`, `_update`), `contracts/libraries/Math.sol`, `test/unit/MinimalPair.test.ts`

**Implement:**

- Trace `mint`: tokens pulled with `transferFrom`, `amount0`/`amount1` computed from balance deltas, LP shares minted (first mint uses `sqrt` minus `MINIMUM_LIQUIDITY` locked to `dEaD`).
- Add a script under `scripts/local/` that approves and seeds liquidity with chosen ratios.

**Test:** Extend tests for imbalanced deposits (excess stays as reserve donation vs router-shaped exact amounts).

**Understand before Phase 3:** Why token addresses are sorted into `token0`/`token1`, and why the first mint locks minimum liquidity.

---

## Phase 3 — Swap math (constant product + fee)

**Learning goal:** Derive **exact-in** output with a fee on the way in (Uniswap V2 style: 997/1000).

**Files / folders:** `MinimalPair.sol` (`swap`, `_getAmountOut`, `getAmountOut`)

**Implement:**

- Re-derive `amountOut` on paper; compare with `getAmountOut`.
- Experiment with small/large trades and observe price impact.

**Test:** Fuzz or table-test `getAmountOut` against reference calculations in TypeScript.

**Understand before Phase 4:** Why **k** increases slightly on swaps that charge a fee (fee stays in the pool), and what “price impact” means.

---

## Phase 4 — LP accounting (burn / remove liquidity)

**Learning goal:** Internal **LP shares** vs reserves; pro-rata withdrawal.

**Files / folders:** `MinimalPair.sol` (`burn`), `test/integration/liquidity-flow.test.ts`

**Implement:**

- Add edge-case tests: partial burn, multiple LPs (second depositor), rounding behavior.

**Test:** Integration test covers remove; add multi-user scenario.

**Understand before Phase 5:** Why internal shares differ from ERC-20 LP tokens (transferability, composability tradeoffs).

---

## Phase 5 — Router abstraction (planning)

**Learning goal:** See why UIs rarely call `pair` directly: routing, deadlines, ETH wrapping, multi-hop.

**Files / folders:** `contracts/amm/PlaceholderNotes.sol`, `docs/` (design notes)

**Implement:**

- Sketch a `Router` interface (no need for full production): `swapExactTokensForTokens`, `addLiquidity` with optimal amounts.
- Optional: Thin Hardhat script that performs “router-like” sequencing of approvals + calls.

**Test:** Script-level test on local fork or Hardhat network.

**Understand before Phase 6:** Slippage limits (`amountOutMin`) and approval hygiene.

---

## Phase 6 — Testnet deploy & DEX visibility context

**Learning goal:** Deploy to a **public testnet**, verify on an explorer, and relate to how aggregators/scanners index pools.

**Files / folders:** `.env.example`, `hardhat.config.ts`, `deployments/<chainId>/`, `scripts/deploy/`

**Implement:**

- Set `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, `ETHERSCAN_API_KEY`.
- Deploy `MockERC20` + `MinimalPair` (or your evolved contracts).
- Verify: `npx hardhat verify --network sepolia <address> <constructor args>`.

**Test:** Contract source visible on Etherscan; addresses recorded under `deployments/11155111/` (Sepolia).

**Understand before Phase 7:** Explorers show **contracts** and **events**; DEX aggregators and tools like DEXTools/DexScreener surface **liquidity and trading activity** on public pairs — use only for **learning and transparent demos**, not misleading activity.

---

## Phase 7 — Bots, scripts & analytics

**Learning goal:** Off-chain monitoring and automation against JSON-RPC (quotes, arb checks, gas estimates).

**Files / folders:** `scripts/local/`, future `scripts/arbitrage/` (optional)

**Implement:**

- Read reserves via `eth_call`, compute effective price, compare with another venue or pool.
- Log structured JSON for simple “lab dashboards.”

**Test:** Dry-run against local Anvil; never commit private keys.

**Understand before Phase 8:** MEV, sandwich risk, and that **on-chain math is only one part** of execution.

---

## Phase 8 — Toward a realistic AMM architecture

**Learning goal:** Map this sandbox to production patterns: **factory**, **CREATE2** pairs, **router**, **ERC-20 LP**, or concentrated liquidity (Uniswap v3-style).

**Files / folders:** `contracts/amm/`, `contracts/interfaces/`, `contracts/libraries/`

**Implement:**

- Incremental milestones: Factory → LP ERC-20 → Router → advanced fee/oracle modules.

**Test:** Integration tests per module; consider fork tests of mainnet routers for integration experiments.

**Understand:** Security audits, oracle manipulation, reentrancy, and economic attacks are mandatory before any mainnet value.

---

## How to use this document

1. Check off phases as you complete them.
2. When adding code, **prefer small PR-sized steps** aligned with a phase.
3. Keep `deployments/<chainId>/` updated when you ship to shared networks so experiments stay reproducible.
