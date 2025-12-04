#!/usr/bin/env node
import { GuardianBridge } from '../packages/insight-core/src/lib/bridge/GuardianBridge';
import { GuardianSync } from '../packages/insight-core/src/lib/bridge/GuardianSync';
import { VerifyAttestation } from '../packages/insight-core/src/lib/bridge/VerifyAttestation';

const workspaceRoot = process.cwd();

console.log('🛡️ [Guardian Bridge] Starting Insight → Guardian verification...\n');

const bridge = new GuardianBridge(workspaceRoot);
const sync = new GuardianSync(workspaceRoot);
const verify = new VerifyAttestation(workspaceRoot);

const projects = ['website', 'extension', 'cli'];
const packets = await Promise.all(projects.map(p => bridge.buildPacket(p)));

console.log(`📦 Built ${packets.length} insight packets`);

const syncState = await sync.syncPackets(packets);
await sync.logSync(syncState);

if (!syncState.success) {
    console.error(`❌ Sync failed: ${syncState.error}`);
    process.exit(1);
}

console.log(`✅ Synced ${syncState.packetsSent} packets to Guardian`);

const attestation = await verify.generate(packets);

let statusEmoji = '✅';
if (attestation.status === 'WARNING') statusEmoji = '⚠️';
if (attestation.status === 'CRITICAL') statusEmoji = '❌';

console.log(`\n🛡️ [Guardian Bridge] Insight → Guardian verification completed.`);
console.log(`Status: ${attestation.status} ${statusEmoji} | RiskScore: ${attestation.riskScore}\n`);
