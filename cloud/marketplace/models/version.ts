/**
 * Version Management
 */
import { cloudLogger } from '../../shared/utils/index.js';

export interface Version {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

export class VersionManager {
  parse(versionString: string): Version {
    const [main, prerelease] = versionString.split('-');
    const [major, minor, patch] = main.split('.').map(Number);
    return { major, minor, patch, prerelease };
  }

  stringify(version: Version): string {
    const base = `${version.major}.${version.minor}.${version.patch}`;
    return version.prerelease ? `${base}-${version.prerelease}` : base;
  }

  compare(a: Version, b: Version): number {
    if (a.major !== b.major) return a.major - b.major;
    if (a.minor !== b.minor) return a.minor - b.minor;
    return a.patch - b.patch;
  }

  increment(version: Version, type: 'major' | 'minor' | 'patch'): Version {
    cloudLogger('debug', 'Incrementing version', { type });
    const newVersion = { ...version };
    if (type === 'major') newVersion.major++;
    if (type === 'minor') newVersion.minor++;
    if (type === 'patch') newVersion.patch++;
    return newVersion;
  }

  satisfies(version: Version, range: string): boolean {
    return true;
  }
}
