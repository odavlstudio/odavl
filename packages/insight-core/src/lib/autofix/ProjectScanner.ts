export type ProjectType = 'website' | 'extension' | 'cli' | 'unknown';

export interface ProjectInfo {
    type: ProjectType;
    name: string;
    rootPath: string;
}

export class ProjectScanner {
    detectProject(filePath: string): ProjectInfo {
        const normalized = filePath.replaceAll('\\', '/');

        if (normalized.includes('/odavl-website') || normalized.includes('/apps/odavl-website-v2')) {
            return { type: 'website', name: 'ODAVL Website', rootPath: 'apps/odavl-website-v2' };
        }

        if (normalized.includes('/vscode-ext') || normalized.includes('/apps/vscode-ext')) {
            return { type: 'extension', name: 'VS Code Extension', rootPath: 'apps/vscode-ext' };
        }

        if (normalized.includes('/cli') || normalized.includes('/apps/cli')) {
            return { type: 'cli', name: 'ODAVL CLI', rootPath: 'apps/cli' };
        }

        if (normalized.includes('/packages/insight-core') || normalized.includes('packages/insight-core')) {
            return { type: 'cli', name: 'Insight Core', rootPath: 'packages/insight-core' };
        }

        if (normalized.includes('/.odavl/insight/tests') || normalized.includes('.odavl/insight/tests')) {
            return { type: 'cli', name: 'Insight Test Fixtures', rootPath: '.odavl/insight/tests' };
        }

        return { type: 'unknown', name: 'Unknown Project', rootPath: '' };
    }

    isFixable(projectType: ProjectType): boolean {
        return projectType !== 'unknown';
    }
}
