You are a senior smart contract engineer and repo architect.

I want you to create a clean, practical, learning-oriented repository for me. The goal is to study AMM / liquidity pool concepts while keeping the repo structured enough to grow into a more realistic on-chain trading lab.

## Primary requirements

Build a repository that satisfies all of the following:

- Use **Hardhat** as the main framework for smart contract development
- Include **Dockerfile(s)** and **docker-compose.yml** so I can run the project comfortably on local machine
- Have a **clear, maintainable folder structure**
- Include a **PHASE.md** file that describes how I should expand the repo step by step for learning
- Support deployment to:
  - local chain
  - testnet
  - mainnet-compatible EVM networks
- Make it realistic to later deploy a token / AMM-related contracts on a public chain and use **DEXTools / DexScreener-style demo visibility**
- Keep the design simple enough for a solo engineer, but not messy

## Important design philosophy

I do NOT want a random toy repo.

I want a repo that is:

- educational
- extendable
- cleanly separated by responsibility
- good for local experiments
- compatible with future public deployment

I want the repo to feel like a serious engineering sandbox.

## What this repo should focus on

This repo is for learning and experimentation around:

- ERC-20 token deployment
- AMM / liquidity pool concepts
- local testing and scripting
- deploy scripts for public EVM networks
- DEX integration experiments later

Do NOT overbuild everything at once.
Design the repo so I can start simple and grow it safely.

## Deliverables I want you to generate

Please generate the repository scaffold and the core project files.

I want at least:

1. A recommended folder structure
2. `package.json`
3. `hardhat.config.ts`
4. `.env.example`
5. `docker-compose.yml`
6. One or more Dockerfiles if needed
7. `README.md`
8. `PHASE.md`
9. Example contracts
10. Example deploy scripts
11. Example test files
12. Helpful scripts for local workflow

## Folder structure requirements

Design a clear structure. Prefer something close to this spirit, but improve it if needed:

```text
repo-root/
├── contracts/
│   ├── tokens/
│   ├── amm/
│   ├── interfaces/
│   └── libraries/
├── scripts/
│   ├── deploy/
│   ├── local/
│   └── utils/
├── test/
│   ├── unit/
│   ├── integration/
│   └── helpers/
├── deployments/
│   └── <chainId>/
├── docker/
├── docs/
├── PHASE.md
├── README.md
├── hardhat.config.ts
├── package.json
├── tsconfig.json
├── .env.example
└── docker-compose.yml

I want you to choose a final structure and explain it briefly in README.

Smart contract requirements

Include starter contracts that are useful for learning:

1. Mock ERC20 token

A simple ERC-20 token using OpenZeppelin, minting an initial supply to deployer.

2. Minimal AMM pair contract OR starter AMM learning contract

I do NOT need a full production Uniswap clone immediately.

I want a minimal, educational AMM contract that helps me understand:
	•	reserves
	•	add liquidity
	•	swap
	•	LP share concept

Keep it simple but meaningful.

If you think it is better to start with a very small AMM contract instead of factory/router complexity, do that.

3. Optional future-ready placeholders

It is okay to include placeholders or TODO notes for:
	•	factory
	•	router
	•	LP tokenization
	•	fee logic
	•	arbitrage experiments

But do not overcomplicate the initial scaffold.

Hardhat requirements

Configure Hardhat for:
	•	local development
	•	local node endpoint
	•	testnet deployment
	•	mainnet deployment
	•	Etherscan-compatible verification support if appropriate
	•	TypeScript usage

Please include sensible environment variable usage for:
	•	PRIVATE_KEY
	•	RPC URLs
	•	ETHERSCAN_API_KEY or chain-equivalent explorer key
	•	optional deployer settings

Docker and Docker Compose requirements

I want Docker support so local setup feels smooth.

Please design Docker usage thoughtfully.

Important:

Hardhat is my smart contract dev framework.
I am okay with using Docker mainly for local developer convenience.

I want Docker / Compose to help me run:
	•	project dependencies
	•	optional local blockchain service
	•	repeatable local environment

You may choose one of these approaches if you think it is clean:
	•	Hardhat scripts on host, local node in Docker
	•	everything in Docker
	•	or a hybrid approach

But you must explain the choice.

Local chain

For local chain, choose a practical approach.
If you think using Anvil in Docker is better than Hardhat node for local chain, you may recommend that — but Hardhat must remain my smart contract development framework.

Make the setup practical and easy to run.

PHASE.md requirements

This is very important.

Create a PHASE.md file that gives me a learning roadmap using this repo.

It should be structured in phases, for example:
	•	Phase 1: deploy mock ERC20 locally
	•	Phase 2: understand reserves and add liquidity
	•	Phase 3: implement swap math
	•	Phase 4: add LP accounting
	•	Phase 5: add router abstraction
	•	Phase 6: deploy to testnet and try DEX-related experiments
	•	Phase 7: add bots / scripts / analytics
	•	Phase 8: move toward a more realistic AMM architecture

For each phase, include:
	•	learning goal
	•	files/folders involved
	•	what to implement
	•	what to test
	•	what concept I should understand before moving on

The file should feel like a serious study guide.

README.md requirements

README should include:
	•	what this repo is for
	•	stack used
	•	folder structure explanation
	•	how to run locally
	•	how to compile
	•	how to test
	•	how to deploy locally
	•	how to deploy to testnet
	•	how to deploy to mainnet-compatible network
	•	how to store deployment outputs
	•	how to use PHASE.md

Deployment requirements

The repo must be structured so that later I can deploy to a public EVM network.

Please include:
	•	deployment script pattern
	•	deployment output storage in deployments/<chainId>/...
	•	environment variables for RPC and private key
	•	scripts for local and public deployment

Keep this practical and realistic.

DEXTools / public demo context

I am NOT asking you to build anything deceptive or manipulative.

But I do want the repo structured so that later I can:
	•	deploy ERC20 token to a public EVM network
	•	add liquidity through a known DEX router or a future custom AMM path
	•	use public DEX analytics visibility as part of learning/demo

So the repo should not assume local-only forever.

Coding style expectations
	•	Use TypeScript for Hardhat scripts/tests
	•	Use Solidity ^0.8.24 unless you have a strong reason otherwise
	•	Prefer clarity over cleverness
	•	Keep starter contracts educational and readable
	•	Use OpenZeppelin where appropriate
	•	Do not overengineer with too many abstractions too early

Output format

I want you to generate the actual repository scaffold content.

Please provide:
	1.	Final folder tree
	2.	Key file contents
	3.	Explanations only where needed
	4.	PHASE.md content in full
	5.	README.md content in full
	6.	Docker / Compose files in full
	7.	Hardhat config and example scripts in full

Do not just describe the repo.
Actually scaffold it.

Final preference

Optimize for:
	•	learning AMM deeply
	•	clean repo evolution
	•	easy local setup
	•	future deployment readiness

Keep the repo practical, structured, and serious.
