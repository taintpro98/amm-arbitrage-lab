# Deployments

JSON artifacts written by `scripts/deploy/*.ts` as `deployments/<chainId>/<ContractName>.json`.

- Commit these for team visibility on testnets; avoid committing secrets.
- `chainId` matches the EVM chain (e.g. `31337` for local Anvil/Hardhat, `11155111` for Sepolia).
