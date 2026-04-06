import * as fs from "fs";
import * as path from "path";

export type DeploymentRecord = {
  name: string;
  address: string;
  chainId: number;
  deployedAt?: string;
  deployer?: string;
  [key: string]: unknown;
};

/**
 * Writes `deployments/<chainId>/<name>.json` for reproducibility and tooling.
 */
export function saveDeployment(record: DeploymentRecord): void {
  const dir = path.join(process.cwd(), "deployments", String(record.chainId));
  fs.mkdirSync(dir, { recursive: true });
  const out = {
    ...record,
    deployedAt: record.deployedAt ?? new Date().toISOString(),
  };
  fs.writeFileSync(path.join(dir, `${record.name}.json`), JSON.stringify(out, null, 2));
}
