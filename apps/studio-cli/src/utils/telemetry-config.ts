/**
 * Phase 1.2: Telemetry Configuration Utility
 * 
 * Priority order (highest to lowest):
 * 1. CLI flag: --no-telemetry
 * 2. Environment variable: ODAVL_TELEMETRY=0 or false
 * 3. Config file: ~/.odavlrc.json { "telemetry": false }
 * 4. Default: false (opt-in)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export interface ODAVLConfig {
  telemetry?: boolean;
}

/**
 * Read ~/.odavlrc.json config file
 */
function readConfigFile(): ODAVLConfig {
  try {
    const configPath = path.join(os.homedir(), '.odavlrc.json');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    // Ignore errors - config file is optional
  }
  return {};
}

/**
 * Check if telemetry is enabled
 * 
 * @param cliFlag - Explicit CLI flag (--no-telemetry means false)
 * @returns true if telemetry should be enabled
 */
export function isTelemetryEnabled(cliFlag?: boolean): boolean {
  // 1. CLI flag has highest priority
  if (cliFlag !== undefined) {
    return cliFlag;
  }
  
  // 2. Environment variable
  const envVar = process.env.ODAVL_TELEMETRY;
  if (envVar !== undefined) {
    return envVar !== '0' && envVar !== 'false' && envVar !== 'FALSE';
  }
  
  // 3. Config file
  const config = readConfigFile();
  if (config.telemetry !== undefined) {
    return config.telemetry;
  }
  
  // 4. Default: OFF (opt-in)
  return false;
}

/**
 * Get telemetry status explanation for debugging
 */
export function getTelemetryStatus(cliFlag?: boolean): string {
  if (cliFlag === false) {
    return 'Telemetry: OFF (via --no-telemetry flag)';
  }
  if (cliFlag === true) {
    return 'Telemetry: ON (via --telemetry flag)';
  }
  
  const envVar = process.env.ODAVL_TELEMETRY;
  if (envVar !== undefined) {
    const enabled = envVar !== '0' && envVar !== 'false' && envVar !== 'FALSE';
    return `Telemetry: ${enabled ? 'ON' : 'OFF'} (via ODAVL_TELEMETRY=${envVar})`;
  }
  
  const config = readConfigFile();
  if (config.telemetry !== undefined) {
    return `Telemetry: ${config.telemetry ? 'ON' : 'OFF'} (via ~/.odavlrc.json)`;
  }
  
  return 'Telemetry: OFF (default - opt-in required)';
}
