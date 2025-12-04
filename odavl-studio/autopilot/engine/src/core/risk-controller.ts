import { getGovernanceConfig } from "./policies.js";
import { adaptGovernance } from "./adaptive-governance.js";

let currentGovernance = await getGovernanceConfig();

export async function getActiveGovernance() {
    currentGovernance = await adaptGovernance(currentGovernance);
    return currentGovernance;
}
