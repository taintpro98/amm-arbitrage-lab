# AMM Arbitrage Lab

Educational sandbox for **ERC-20**, **constant-product AMM mechanics** (reserves, liquidity, swaps), **Hardhat** workflows, and **deployment patterns** that extend to testnets and mainnet-compatible EVM chains. The repo is intentionally small but structured like a serious engineering lab—not a one-off toy.

## Stack

- **Solidity** `^0.8.24`
- **Hardhat** + **TypeScript**
- **OpenZeppelin** contracts
- **Docker / Compose** for optional local chain (Anvil) and reproducible Node tooling

## Folder structure

```text
contracts/
  tokens/        # ERC-20 mocks and future project tokens
  amm/           # Pair/pool logic, future factory/router
  interfaces/    # ABI-facing surfaces for scripts/tests
  libraries/     # Math and shared helpers
scripts/
  deploy/        # Deployment entrypoints; writes deployments/<chainId>/
  local/         # RPC checks, one-off experiments
  utils/         # Shared TS helpers (e.g. saving deployment JSON)
test/
  unit/          # Contract unit tests
  integration/   # Multi-step flows
  helpers/       # Fixtures
deployments/
  <chainId>/     # JSON artifacts per network (addresses, metadata)
docker/          # Dockerfile for compose `deploy` service
docs/            # Notes, ADRs, diagrams (optional)
PHASE.md         # Step-by-step learning roadmap
```

**Why this layout:** contracts are grouped by domain; scripts separate **deploy** from **local hacks**; tests scale from unit to integration; `deployments/` gives you a reproducible audit trail for public demos and DEX-related experiments later (explorers, aggregators, analytics—used responsibly and transparently).

## Prerequisites

- **Node.js** 20+ (22 recommended)
- **npm**
- Optional: **Docker** for Anvil via Compose

## Install & compile

```bash
npm install
npx hardhat compile
```

## Test & coverage

```bash
npx hardhat test
npm run coverage
```

## Docker & local chain (recommended hybrid)

**Default approach:** run **Anvil** in Docker for a stable JSON-RPC, and run **Hardhat** on the host (fast iteration, native file watchers).

**Auto-deploy:** `make compose-up` (or `docker compose up --build -d`) starts **Anvil**, waits until it is healthy, then runs a one-shot **`deploy`** service (`npm ci` + `hardhat run ... --network localhost`). Deployment JSON is written to `deployments/<chainId>/` on your machine via the bind mount. The compose file defaults to **Anvil account #0**’s well-known private key (local-only); override with **`DEPLOY_PRIVATE_KEY`** in your shell or `.env` used by Compose. Check output with `docker compose logs deploy`.

1. Start Anvil only (no auto-deploy):

   ```bash
   docker compose up -d anvil
   ```

2. Point tools at it (host machine):

   ```bash
   export LOCAL_RPC_URL=http://127.0.0.1:8545
   npx hardhat run scripts/local/checkRpc.ts --network localhost
   ```

3. Deploy to that chain:

   ```bash
   npx hardhat run scripts/deploy/deployAll.ts --network localhost
   ```

See `docker-compose.yml` and `docker/Dockerfile` for details.

## Deploy locally (Hardhat in-process or localhost network)

**Option A — Hardhat built-in network (CI / quick scripts):**

```bash
npx hardhat run scripts/deploy/deployAll.ts --network hardhat
```

**Option B — Local JSON-RPC (Anvil or `npx hardhat node`):**

```bash
# Terminal 1: anvil OR hardhat node
docker compose up -d anvil
# Terminal 2:
cp .env.example .env   # add PRIVATE_KEY for real accounts on local chain if needed
npx hardhat run scripts/deploy/deployAll.ts --network localhost
```

Artifacts are written to `deployments/<chainId>/` (e.g. `31337` for local).

## Deploy to testnet (e.g. Sepolia)

1. Copy `.env.example` → `.env` and set:

   - `PRIVATE_KEY` (funded test account)
   - `SEPOLIA_RPC_URL`
   - `ETHERSCAN_API_KEY` (verification)

2. Deploy:

   ```bash
   npx hardhat run scripts/deploy/deployAll.ts --network sepolia
   ```

3. Verify (example for a contract with constructor args—adjust per contract):

   ```bash
   npx hardhat verify --network sepolia <DEPLOYED_ADDRESS> "arg1" "arg2"
   ```

## Deploy to mainnet or another EVM network

1. Add/adjust a network in `hardhat.config.ts` (RPC + `accounts` from `PRIVATE_KEY`).
2. Use a dedicated key with minimal funds and monitor gas.
3. Run the same deploy script with `--network mainnet` (or your custom network name).
4. Store outputs under `deployments/<chainId>/` and verify on the chain’s explorer when available.

**Safety:** never commit `.env`; treat mainnet keys as production secrets.

## Deployment outputs

- Scripts use `scripts/utils/saveDeployment.ts` to write `deployments/<chainId>/<Name>.json`.
- Commit these JSON files for team visibility on shared testnets; avoid embedding secrets.

## Using `PHASE.md`

Open [`PHASE.md`](./PHASE.md) for a **phased curriculum**: mock token → reserves/liquidity → swap math → LP burns → router thinking → testnet + explorer context → automation → realistic AMM architecture.

## Scripts (package.json)

| Script | Purpose |
|--------|---------|
| `npm run compile` | `hardhat compile` |
| `npm run test` | `hardhat test` |
| `npm run deploy:local` | Deploy all to `localhost` |
| `npm run deploy:sepolia` | Deploy all to Sepolia |
| `npm run deploy:mainnet` | Deploy all to mainnet config |

## License

MIT (default). Adjust if you add dependencies with other terms.
