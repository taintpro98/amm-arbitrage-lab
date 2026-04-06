# AMM Arbitrage Lab — common tasks (see README.md)

.DEFAULT_GOAL := help

NPM ?= npm
NPX ?= npx
DOCKER_COMPOSE ?= docker compose

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z0-9_.-]+:.*?##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

.PHONY: install
install: ## Install dependencies (npm install)
	$(NPM) install

.PHONY: install-ci
install-ci: ## Install from lockfile (npm ci)
	$(NPM) ci

.PHONY: compile
compile: ## Compile contracts (hardhat compile)
	$(NPM) run compile

.PHONY: test
test: ## Run tests
	$(NPM) run test

.PHONY: coverage
coverage: ## Run Solidity coverage
	$(NPM) run coverage

.PHONY: clean
clean: ## Remove Hardhat cache and artifacts
	$(NPM) run clean

.PHONY: lint-sol
lint-sol: ## Run solhint on contracts/
	$(NPM) run lint:sol

.PHONY: node
node: ## Start Hardhat JSON-RPC node (foreground)
	$(NPM) run node

.PHONY: check-rpc
check-rpc: ## Sanity-check LOCAL_RPC_URL / localhost:8545
	$(NPX) hardhat run scripts/local/checkRpc.ts --network localhost

.PHONY: deploy-hardhat
deploy-hardhat: ## Deploy to Hardhat in-process network
	$(NPM) run deploy:hardhat

.PHONY: deploy-local
deploy-local: ## Deploy to localhost (start Anvil or hardhat node first)
	$(NPM) run deploy:local

.PHONY: deploy-sepolia
deploy-sepolia: ## Deploy to Sepolia (.env required)
	$(NPM) run deploy:sepolia

.PHONY: deploy-mainnet
deploy-mainnet: ## Deploy to mainnet (.env required)
	$(NPM) run deploy:mainnet

.PHONY: compose-up
compose-up: ## Start Anvil + one-shot auto-deploy (see: docker compose logs deploy)
	$(DOCKER_COMPOSE) up --build -d

.PHONY: compose-down
compose-down: ## Stop compose stack (Anvil, etc.)
	$(DOCKER_COMPOSE) down

.PHONY: anvil-up
anvil-up: ## Start only Anvil (no auto-deploy; port 8545)
	$(DOCKER_COMPOSE) up -d anvil

.PHONY: anvil-down
anvil-down: ## Stop Anvil container
	$(DOCKER_COMPOSE) stop anvil

.PHONY: anvil-logs
anvil-logs: ## Follow Anvil logs
	$(DOCKER_COMPOSE) logs -f anvil
