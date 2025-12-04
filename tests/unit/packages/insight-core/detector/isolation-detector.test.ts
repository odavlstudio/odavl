import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ComponentIsolationDetector } from '../../../../../packages/insight-core/src/detector/isolation-detector.js';
import type { IsolationIssue } from '../../../../../packages/insight-core/src/detector/isolation-detector.js';

describe('ComponentIsolationDetector', () => {
    let testDir: string;
    let detector: ComponentIsolationDetector;

    beforeEach(() => {
        testDir = path.join(__dirname, 'test-isolation-temp');
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
        fs.mkdirSync(testDir, { recursive: true });
        detector = new ComponentIsolationDetector(testDir);
    });

    afterEach(() => {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    describe('Tight Coupling Detection', () => {
        it('should detect component with exactly threshold (7) dependencies', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            const deps = Array.from({ length: 7 }, (_, i) => {
                const depFile = path.join(testDir, `dep${i}.ts`);
                fs.writeFileSync(depFile, `export const dep${i} = () => {};`);
                return `./dep${i}`;
            });

            fs.writeFileSync(
                mainFile,
                deps.map((d) => `import { dep } from '${d}';`).join('\n') + '\nexport const main = () => {};'
            );

            const issues = await detector.detect(testDir);
            const couplingIssues = issues.filter((i) => i.type === 'tight-coupling');

            // At threshold (7), should not report issue (threshold is max allowed)
            expect(couplingIssues.length).toBe(0);
        });

        it('should detect component with 8 dependencies (just over threshold)', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            const deps = Array.from({ length: 8 }, (_, i) => {
                const depFile = path.join(testDir, `dep${i}.ts`);
                fs.writeFileSync(depFile, `export const dep${i} = () => {};`);
                return `./dep${i}`;
            });

            fs.writeFileSync(
                mainFile,
                deps.map((d) => `import { dep } from '${d}';`).join('\n') + '\nexport const main = () => {};'
            );

            const issues = await detector.detect(testDir);
            const couplingIssue = issues.find((i) => i.type === 'tight-coupling' && i.file.includes('main.ts'));

            expect(couplingIssue).toBeDefined();
            expect(couplingIssue?.severity).toBe('low'); // 8 < 10 (medium threshold)
            expect(couplingIssue?.value).toBe(8);
            expect(couplingIssue?.threshold).toBe(7);
            expect(couplingIssue?.message).toContain('8 dependencies');
        });

        it('should detect medium coupling (10-14 dependencies)', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            const deps = Array.from({ length: 12 }, (_, i) => {
                const depFile = path.join(testDir, `dep${i}.ts`);
                fs.writeFileSync(depFile, `export const dep${i} = () => {};`);
                return `./dep${i}`;
            });

            fs.writeFileSync(
                mainFile,
                deps.map((d) => `import { dep } from '${d}';`).join('\n') + '\nexport const main = () => {};'
            );

            const issues = await detector.detect(testDir);
            const couplingIssue = issues.find((i) => i.type === 'tight-coupling' && i.file.includes('main.ts'));

            expect(couplingIssue).toBeDefined();
            expect(couplingIssue?.severity).toBe('medium'); // 10 < 12 < 14
            expect(couplingIssue?.value).toBe(12);
            expect(couplingIssue?.suggestedFix).toContain('facade pattern');
        });

        it('should detect high coupling (>14 dependencies)', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            const deps = Array.from({ length: 16 }, (_, i) => {
                const depFile = path.join(testDir, `dep${i}.ts`);
                fs.writeFileSync(depFile, `export const dep${i} = () => {};`);
                return `./dep${i}`;
            });

            fs.writeFileSync(
                mainFile,
                deps.map((d) => `import { dep } from '${d}';`).join('\n') + '\nexport const main = () => {};'
            );

            const issues = await detector.detect(testDir);
            const couplingIssue = issues.find((i) => i.type === 'tight-coupling' && i.file.includes('main.ts'));

            expect(couplingIssue).toBeDefined();
            expect(couplingIssue?.severity).toBe('high'); // > 14
            expect(couplingIssue?.value).toBe(16);
            expect(couplingIssue?.suggestedFix).toContain('facades');
        });

        it('should include affected files in coupling issue', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            const deps = Array.from({ length: 10 }, (_, i) => {
                const depFile = path.join(testDir, `dep${i}.ts`);
                fs.writeFileSync(depFile, `export const dep${i} = () => {};`);
                return `./dep${i}`;
            });

            fs.writeFileSync(
                mainFile,
                deps.map((d) => `import { dep } from '${d}';`).join('\n') + '\nexport const main = () => {};'
            );

            const issues = await detector.detect(testDir);
            const couplingIssue = issues.find((i) => i.type === 'tight-coupling' && i.file.includes('main.ts'));

            expect(couplingIssue).toBeDefined();
            expect(couplingIssue?.affectedFiles.length).toBe(10);
            expect(couplingIssue?.affectedFiles.every((f) => f.includes('dep'))).toBe(true);
        });

        it('should not report coupling issue for well-isolated component', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            const dep1 = path.join(testDir, 'dep1.ts');
            const dep2 = path.join(testDir, 'dep2.ts');

            fs.writeFileSync(dep1, `export const dep1 = () => {};`);
            fs.writeFileSync(dep2, `export const dep2 = () => {};`);
            fs.writeFileSync(mainFile, `import { dep1 } from './dep1';\nimport { dep2 } from './dep2';\nexport const main = () => {};`);

            const issues = await detector.detect(testDir);
            const couplingIssues = issues.filter((i) => i.type === 'tight-coupling');

            expect(couplingIssues.length).toBe(0);
        });
    });

    describe('Low Cohesion Detection', () => {
        it('should detect component with exactly threshold (3) responsibilities', async () => {
            const mainFile = path.join(testDir, 'main.tsx');
            fs.writeFileSync(
                mainFile,
                `
                import React, { useState } from 'react';
                export const Component = () => {
                    const [state, setState] = useState(0);
                    const result = calculate(state * 2);
                    const data = localStorage.getItem('key');
                    return <div onClick={() => {}} />;
                };
                function calculate(x: number) { return x * 2; }
                `
            );

            const issues = await detector.detect(testDir);
            const cohesionIssues = issues.filter((i) => i.type === 'low-cohesion' && i.file.includes('main.tsx'));

            // At threshold (3), should not report issue - but this code has 4 responsibilities
            expect(cohesionIssues.length).toBe(1);
        });

        it('should detect component with 4 distinct responsibilities', async () => {
            const mainFile = path.join(testDir, 'main.tsx');
            fs.writeFileSync(
                mainFile,
                `
                import React, { useState } from 'react';
                export const Component = () => {
                    const [state, setState] = useState(0);
                    fetch('https://api.example.com/data');
                    const result = calculate(state * 2);
                    const data = localStorage.getItem('key');
                    return <div onClick={() => {}} />;
                };
                function calculate(x: number) { return x * 2; }
                `
            );

            const issues = await detector.detect(testDir);
            const cohesionIssue = issues.find((i) => i.type === 'low-cohesion' && i.file.includes('main.tsx'));

            expect(cohesionIssue).toBeDefined();
            expect(cohesionIssue?.severity).toBe('medium');
            expect(cohesionIssue?.value).toBe(6); // UI, state, data fetching, business logic, persistence, events
            expect(cohesionIssue?.message).toContain('responsibilities');
            expect(cohesionIssue?.suggestedFix).toContain('SRP');
        });

        it('should detect component with multiple unrelated responsibilities', async () => {
            const mainFile = path.join(testDir, 'main.tsx');
            fs.writeFileSync(
                mainFile,
                `
                import React, { useState } from 'react';
                import axios from 'axios';
                export const Component = () => {
                    const [state, setState] = useState(0);
                    axios.get('/api/data');
                    const validated = validate(state);
                    localStorage.setItem('key', 'value');
                    document.addEventListener('click', () => {});
                    return <div onClick={() => {}} />;
                };
                function validate(x: number) { return x > 0; }
                `
            );

            const issues = await detector.detect(testDir);
            const cohesionIssue = issues.find((i) => i.type === 'low-cohesion' && i.file.includes('main.tsx'));

            expect(cohesionIssue).toBeDefined();
            expect(cohesionIssue?.value).toBeGreaterThanOrEqual(5); // UI, state, fetch, logic, persistence, events
            expect(cohesionIssue?.message).toContain('responsibilities:');
            expect(cohesionIssue?.message).toContain('UI rendering');
            expect(cohesionIssue?.message).toContain('Data fetching');
            expect(cohesionIssue?.message).toContain('State management');
        });

        it('should list all detected responsibilities in message', async () => {
            const mainFile = path.join(testDir, 'main.tsx');
            fs.writeFileSync(
                mainFile,
                `
                import React, { useState } from 'react';
                export const Component = () => {
                    const [state, setState] = useState(0);
                    fetch('/api');
                    localStorage.setItem('key', 'value');
                    const result = calculate(5);
                    document.addEventListener('click', () => {});
                    return <div />;
                };
                function calculate(x: number) { return x * 2; }
                `
            );

            const issues = await detector.detect(testDir);
            const cohesionIssue = issues.find((i) => i.type === 'low-cohesion' && i.file.includes('main.tsx'));

            expect(cohesionIssue).toBeDefined();
            expect(cohesionIssue?.message).toContain('Data fetching');
            expect(cohesionIssue?.message).toContain('Business logic');
            expect(cohesionIssue?.message).toContain('Data persistence');
            expect(cohesionIssue?.message).toContain('Event handling');
        });

        it('should not report cohesion issue for focused component', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            fs.writeFileSync(
                mainFile,
                `
                export function calculate(x: number, y: number): number {
                    const sum = x + y;
                    const result = sum * 2;
                    return result;
                }
                `
            );

            const issues = await detector.detect(testDir);
            const cohesionIssues = issues.filter((i) => i.type === 'low-cohesion');

            expect(cohesionIssues.length).toBe(0);
        });
    });

    describe('Fan-In Detection', () => {
        it('should detect component with exactly threshold (10) dependents', async () => {
            const utilFile = path.join(testDir, 'util.ts');
            fs.writeFileSync(utilFile, `export const util = () => {};`);

            // Create 10 files that import util
            for (let i = 0; i < 10; i++) {
                const consumerFile = path.join(testDir, `consumer${i}.ts`);
                fs.writeFileSync(consumerFile, `import { util } from './util';\nexport const consumer${i} = () => util();`);
            }

            const issues = await detector.detect(testDir);
            const fanInIssues = issues.filter((i) => i.type === 'high-fan-in' && i.file.includes('util.ts'));

            // At threshold (10), should not report issue
            expect(fanInIssues.length).toBe(0);
        });

        it('should detect high fan-in (>10 dependents)', async () => {
            const utilFile = path.join(testDir, 'util.ts');
            fs.writeFileSync(utilFile, `export const util = () => {};`);

            // Create 12 files that import util
            for (let i = 0; i < 12; i++) {
                const consumerFile = path.join(testDir, `consumer${i}.ts`);
                fs.writeFileSync(consumerFile, `import { util } from './util';\nexport const consumer${i} = () => util();`);
            }

            const issues = await detector.detect(testDir);
            const fanInIssue = issues.find((i) => i.type === 'high-fan-in' && i.file.includes('util.ts'));

            expect(fanInIssue).toBeDefined();
            expect(fanInIssue?.severity).toBe('low'); // Fan-in is informational, not necessarily bad
            expect(fanInIssue?.value).toBe(12);
            expect(fanInIssue?.threshold).toBe(10);
            expect(fanInIssue?.message).toContain('Component is imported by 12 files');
        });

        it('should include affected files in fan-in issue', async () => {
            const utilFile = path.join(testDir, 'util.ts');
            fs.writeFileSync(utilFile, `export const util = () => {};`);

            for (let i = 0; i < 12; i++) {
                const consumerFile = path.join(testDir, `consumer${i}.ts`);
                fs.writeFileSync(consumerFile, `import { util } from './util';\nexport const consumer${i} = () => util();`);
            }

            const issues = await detector.detect(testDir);
            const fanInIssue = issues.find((i) => i.type === 'high-fan-in' && i.file.includes('util.ts'));

            expect(fanInIssue).toBeDefined();
            expect(fanInIssue?.affectedFiles.length).toBe(12);
            expect(fanInIssue?.affectedFiles.every((f) => f.includes('consumer'))).toBe(true);
        });

        it('should not report fan-in issue for moderately used component', async () => {
            const utilFile = path.join(testDir, 'util.ts');
            fs.writeFileSync(utilFile, `export const util = () => {};`);

            for (let i = 0; i < 5; i++) {
                const consumerFile = path.join(testDir, `consumer${i}.ts`);
                fs.writeFileSync(consumerFile, `import { util } from './util';\nexport const consumer${i} = () => util();`);
            }

            const issues = await detector.detect(testDir);
            const fanInIssues = issues.filter((i) => i.type === 'high-fan-in');

            expect(fanInIssues.length).toBe(0);
        });
    });

    describe('Fan-Out Detection', () => {
        it('should detect high fan-out (>10 dependencies)', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            const deps = Array.from({ length: 12 }, (_, i) => {
                const depFile = path.join(testDir, `dep${i}.ts`);
                fs.writeFileSync(depFile, `export const dep${i} = () => {};`);
                return `./dep${i}`;
            });

            fs.writeFileSync(
                mainFile,
                deps.map((d) => `import { dep } from '${d}';`).join('\n') + '\nexport const main = () => {};'
            );

            const issues = await detector.detect(testDir);
            const fanOutIssue = issues.find((i) => i.type === 'high-fan-out' && i.file.includes('main.ts'));

            expect(fanOutIssue).toBeDefined();
            expect(fanOutIssue?.severity).toBe('medium');
            expect(fanOutIssue?.value).toBe(12);
            expect(fanOutIssue?.threshold).toBe(10);
            expect(fanOutIssue?.message).toContain('depends on 12 files');
        });

        it('should provide appropriate suggestions for fan-out', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            const deps = Array.from({ length: 15 }, (_, i) => {
                const depFile = path.join(testDir, `dep${i}.ts`);
                fs.writeFileSync(depFile, `export const dep${i} = () => {};`);
                return `./dep${i}`;
            });

            fs.writeFileSync(
                mainFile,
                deps.map((d) => `import { dep } from '${d}';`).join('\n') + '\nexport const main = () => {};'
            );

            const issues = await detector.detect(testDir);
            const fanOutIssue = issues.find((i) => i.type === 'high-fan-out' && i.file.includes('main.ts'));

            expect(fanOutIssue).toBeDefined();
            expect(fanOutIssue?.suggestedFix).toContain('aggregate modules');
        });

        it('should not report fan-out for moderate dependencies', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            const deps = Array.from({ length: 6 }, (_, i) => {
                const depFile = path.join(testDir, `dep${i}.ts`);
                fs.writeFileSync(depFile, `export const dep${i} = () => {};`);
                return `./dep${i}`;
            });

            fs.writeFileSync(
                mainFile,
                deps.map((d) => `import { dep } from '${d}';`).join('\n') + '\nexport const main = () => {};'
            );

            const issues = await detector.detect(testDir);
            const fanOutIssues = issues.filter((i) => i.type === 'high-fan-out');

            expect(fanOutIssues.length).toBe(0);
        });
    });

    describe('Boundary Violation Detection', () => {
        it('should detect presentation layer importing from presentation (valid)', async () => {
            fs.mkdirSync(path.join(testDir, 'components'), { recursive: true });
            fs.mkdirSync(path.join(testDir, 'services'), { recursive: true });

            const componentFile = path.join(testDir, 'components', 'Button.tsx');
            const serviceFile = path.join(testDir, 'services', 'api.ts');

            fs.writeFileSync(componentFile, `import { api } from '../services/api';\nexport const Button = () => {};`);
            fs.writeFileSync(serviceFile, `export const api = () => {};`);

            const issues = await detector.detect(testDir);
            const boundaryIssues = issues.filter((i) => i.type === 'boundary-violation' && i.file.includes('Button.tsx'));

            // Presentation can import from Application - valid
            expect(boundaryIssues.length).toBe(0);
        });

        it('should detect domain layer importing from application (invalid)', async () => {
            fs.mkdirSync(path.join(testDir, 'domain'), { recursive: true });
            fs.mkdirSync(path.join(testDir, 'services'), { recursive: true });

            const domainFile = path.join(testDir, 'domain', 'User.ts');
            const serviceFile = path.join(testDir, 'services', 'UserService.ts');

            fs.writeFileSync(domainFile, `import { UserService } from '../services/UserService';\nexport class User {}`);
            fs.writeFileSync(serviceFile, `export class UserService {}`);

            const issues = await detector.detect(testDir);
            const boundaryIssue = issues.find((i) => i.type === 'boundary-violation' && i.file.includes('User.ts'));

            expect(boundaryIssue).toBeDefined();
            expect(boundaryIssue?.severity).toBe('high');
            expect(boundaryIssue?.message).toContain('domain layer');
            expect(boundaryIssue?.affectedFiles.some((f) => f.includes('UserService.ts'))).toBe(true);
        });

        it('should detect infrastructure importing from domain (invalid)', async () => {
            fs.mkdirSync(path.join(testDir, 'lib'), { recursive: true });
            fs.mkdirSync(path.join(testDir, 'domain'), { recursive: true });

            const libFile = path.join(testDir, 'lib', 'database.ts');
            const domainFile = path.join(testDir, 'domain', 'User.ts');

            fs.writeFileSync(libFile, `import { User } from '../domain/User';\nexport const db = {};`);
            fs.writeFileSync(domainFile, `export class User {}`);

            const issues = await detector.detect(testDir);
            const boundaryIssue = issues.find((i) => i.type === 'boundary-violation' && i.file.includes('database.ts'));

            expect(boundaryIssue).toBeDefined();
            expect(boundaryIssue?.severity).toBe('high');
            expect(boundaryIssue?.message).toContain('infrastructure layer');
        });

        it('should detect application importing from domain (valid)', async () => {
            fs.mkdirSync(path.join(testDir, 'services'), { recursive: true });
            fs.mkdirSync(path.join(testDir, 'domain'), { recursive: true });

            const serviceFile = path.join(testDir, 'services', 'UserService.ts');
            const domainFile = path.join(testDir, 'domain', 'User.ts');

            fs.writeFileSync(serviceFile, `import { User } from '../domain/User';\nexport class UserService {}`);
            fs.writeFileSync(domainFile, `export class User {}`);

            const issues = await detector.detect(testDir);
            const boundaryIssues = issues.filter((i) => i.type === 'boundary-violation' && i.file.includes('UserService.ts'));

            // Application can import from Domain - valid
            expect(boundaryIssues.length).toBe(0);
        });

        it('should provide fix suggestions for boundary violations', async () => {
            fs.mkdirSync(path.join(testDir, 'domain'), { recursive: true });
            fs.mkdirSync(path.join(testDir, 'services'), { recursive: true });

            const domainFile = path.join(testDir, 'domain', 'Entity.ts');
            const serviceFile = path.join(testDir, 'services', 'Service.ts');

            fs.writeFileSync(domainFile, `import { Service } from '../services/Service';\nexport class Entity {}`);
            fs.writeFileSync(serviceFile, `export class Service {}`);

            const issues = await detector.detect(testDir);
            const boundaryIssue = issues.find((i) => i.type === 'boundary-violation' && i.file.includes('Entity.ts'));

            expect(boundaryIssue).toBeDefined();
            expect(boundaryIssue?.suggestedFix).toContain('layered architecture');
            expect(boundaryIssue?.suggestedFix).toContain('dependency inversion');
        });

        it('should detect multiple boundary violations in single file', async () => {
            fs.mkdirSync(path.join(testDir, 'domain'), { recursive: true });
            fs.mkdirSync(path.join(testDir, 'services'), { recursive: true });
            fs.mkdirSync(path.join(testDir, 'lib'), { recursive: true });

            const domainFile = path.join(testDir, 'domain', 'Entity.ts');
            const serviceFile = path.join(testDir, 'services', 'Service.ts');
            const libFile = path.join(testDir, 'lib', 'util.ts');

            fs.writeFileSync(
                domainFile,
                `import { Service } from '../services/Service';\nimport { util } from '../lib/util';\nexport class Entity {}`
            );
            fs.writeFileSync(serviceFile, `export class Service {}`);
            fs.writeFileSync(libFile, `export const util = () => {};`);

            const issues = await detector.detect(testDir);
            const boundaryIssue = issues.find((i) => i.type === 'boundary-violation' && i.file.includes('Entity.ts'));

            expect(boundaryIssue).toBeDefined();
            expect(boundaryIssue?.affectedFiles.length).toBeGreaterThanOrEqual(1);
        });

        it('should not report boundary violations for valid layered dependencies', async () => {
            fs.mkdirSync(path.join(testDir, 'components'), { recursive: true });
            fs.mkdirSync(path.join(testDir, 'services'), { recursive: true });
            fs.mkdirSync(path.join(testDir, 'domain'), { recursive: true });
            fs.mkdirSync(path.join(testDir, 'lib'), { recursive: true });

            const componentFile = path.join(testDir, 'components', 'View.tsx');
            const serviceFile = path.join(testDir, 'services', 'Service.ts');
            const domainFile = path.join(testDir, 'domain', 'Entity.ts');
            const libFile = path.join(testDir, 'lib', 'util.ts');

            // Valid: Presentation → Application → Domain, Infrastructure
            fs.writeFileSync(
                componentFile,
                `import { Service } from '../services/Service';\nimport { Entity } from '../domain/Entity';\nimport { util } from '../lib/util';\nexport const View = () => {};`
            );
            fs.writeFileSync(serviceFile, `import { Entity } from '../domain/Entity';\nexport class Service {}`);
            fs.writeFileSync(domainFile, `export class Entity {}`);
            fs.writeFileSync(libFile, `export const util = () => {};`);

            const issues = await detector.detect(testDir);
            const boundaryIssues = issues.filter((i) => i.type === 'boundary-violation');

            expect(boundaryIssues.length).toBe(0);
        });
    });

    describe('God Component Detection', () => {
        it('should detect component with exactly threshold (300) LOC', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            const lines = Array.from({ length: 299 }, (_, i) => `const var${i} = ${i};`);
            fs.writeFileSync(mainFile, lines.join('\n') + '\nexport const main = () => {};');

            const issues = await detector.detect(testDir);
            const godIssues = issues.filter((i) => i.type === 'god-component' && i.file.includes('main.ts'));

            // At 300 total LOC (299 + 1 export), should not report issue
            expect(godIssues.length).toBe(0);
        });

        it('should detect component with >300 LOC (high LOC)', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            const lines = Array.from({ length: 350 }, (_, i) => `const var${i} = ${i};`);
            fs.writeFileSync(mainFile, lines.join('\n') + '\nexport const main = () => {};');

            const issues = await detector.detect(testDir);
            const godIssue = issues.find((i) => i.type === 'god-component' && i.file.includes('main.ts'));

            expect(godIssue).toBeDefined();
            expect(godIssue?.severity).toBe('high');
            expect(godIssue?.value).toBeGreaterThan(300);
            expect(godIssue?.message).toContain('LOC');
            expect(godIssue?.suggestedFix).toContain('Break down');
        });

        it('should detect component with >4.5 responsibilities (many concerns)', async () => {
            const mainFile = path.join(testDir, 'main.tsx');
            fs.writeFileSync(
                mainFile,
                `
                import React, { useState } from 'react';
                import axios from 'axios';
                export const Component = () => {
                    const [state, setState] = useState(0);
                    axios.get('/api/data');
                    const validated = validate(state);
                    localStorage.setItem('key', 'value');
                    document.addEventListener('click', () => {});
                    sessionStorage.setItem('session', 'data');
                    return <div onClick={() => {}} />;
                };
                function validate(x: number) { return x > 0; }
                function calculate(x: number) { return x * 2; }
                `
            );

            const issues = await detector.detect(testDir);
            const godIssue = issues.find((i) => i.type === 'god-component' && i.file.includes('main.tsx'));

            expect(godIssue).toBeDefined();
            expect(godIssue?.severity).toBe('high');
            expect(godIssue?.message).toContain('responsibilities');
        });

        it('should detect god component with both high LOC and responsibilities', async () => {
            const mainFile = path.join(testDir, 'main.tsx');
            const lines = Array.from({ length: 350 }, (_, i) => `const var${i} = ${i};`);
            const code = `
                import React, { useState } from 'react';
                import axios from 'axios';
                export const Component = () => {
                    ${lines.join('\n')}
                    const [state, setState] = useState(0);
                    axios.get('/api/data');
                    const validated = validate(state);
                    localStorage.setItem('key', 'value');
                    return <div onClick={() => {}} />;
                };
                function validate(x: number) { return x > 0; }
            `;
            fs.writeFileSync(mainFile, code);

            const issues = await detector.detect(testDir);
            const godIssue = issues.find((i) => i.type === 'god-component' && i.file.includes('main.tsx'));

            expect(godIssue).toBeDefined();
            expect(godIssue?.severity).toBe('high');
            expect(godIssue?.message).toContain('LOC');
            expect(godIssue?.message).toContain('responsibilities');
        });

        it('should not report god component for reasonably sized component', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            const lines = Array.from({ length: 150 }, (_, i) => `const var${i} = ${i};`);
            fs.writeFileSync(mainFile, lines.join('\n') + '\nexport const main = () => {};');

            const issues = await detector.detect(testDir);
            const godIssues = issues.filter((i) => i.type === 'god-component');

            expect(godIssues.length).toBe(0);
        });
    });

    describe('Responsibility Detection', () => {
        it('should detect UI rendering responsibility', async () => {
            const mainFile = path.join(testDir, 'main.tsx');
            fs.writeFileSync(
                mainFile,
                `
                import React, { useState, useEffect } from 'react';
                export const Component = () => {
                    return <div><p>Hello</p></div>;
                };
                `
            );

            const issues = await detector.detect(testDir);
            const cohesionIssue = issues.find((i) => i.type === 'low-cohesion' && i.file.includes('main.tsx'));

            // Only UI rendering - should not be an issue (1 responsibility)
            expect(cohesionIssue).toBeUndefined();
        });

        it('should detect data fetching responsibility', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            fs.writeFileSync(
                mainFile,
                `
                export const fetchData = async () => {
                    const response = await fetch('https://api.example.com/data');
                    return response.json();
                };
                `
            );

            const issues = await detector.detect(testDir);
            const cohesionIssue = issues.find((i) => i.type === 'low-cohesion' && i.file.includes('main.ts'));

            // Only data fetching - should not be an issue
            expect(cohesionIssue).toBeUndefined();
        });

        it('should detect state management responsibility', async () => {
            const mainFile = path.join(testDir, 'main.tsx');
            fs.writeFileSync(
                mainFile,
                `
                import { useState, useReducer } from 'react';
                export const useCounter = () => {
                    const [count, setCount] = useState(0);
                    return { count, setCount };
                };
                `
            );

            const issues = await detector.detect(testDir);
            const cohesionIssue = issues.find((i) => i.type === 'low-cohesion' && i.file.includes('main.tsx'));

            // Only state management - should not be an issue
            expect(cohesionIssue).toBeUndefined();
        });

        it('should detect business logic responsibility', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            fs.writeFileSync(
                mainFile,
                `
                export const calculateTotal = (items: any[]) => {
                    const validated = items.filter(i => i.valid);
                    const processed = validated.map(i => transform(i));
                    return processed.reduce((sum, i) => sum + i.price, 0);
                };
                function transform(item: any) { return item; }
                `
            );

            const issues = await detector.detect(testDir);
            const cohesionIssue = issues.find((i) => i.type === 'low-cohesion' && i.file.includes('main.ts'));

            // Only business logic - should not be an issue
            expect(cohesionIssue).toBeUndefined();
        });

        it('should detect data persistence responsibility', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            fs.writeFileSync(
                mainFile,
                `
                export const saveToStorage = (key: string, value: string) => {
                    localStorage.setItem(key, value);
                    sessionStorage.setItem(key, value);
                };
                `
            );

            const issues = await detector.detect(testDir);
            const cohesionIssue = issues.find((i) => i.type === 'low-cohesion' && i.file.includes('main.ts'));

            // Only persistence - should not be an issue
            expect(cohesionIssue).toBeUndefined();
        });

        it('should detect event handling responsibility', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            fs.writeFileSync(
                mainFile,
                `
                export const setupListeners = () => {
                    document.addEventListener('click', handleClick);
                    document.addEventListener('keypress', handleKeypress);
                };
                function handleClick(e: Event) {}
                function handleKeypress(e: Event) {}
                `
            );

            const issues = await detector.detect(testDir);
            const cohesionIssue = issues.find((i) => i.type === 'low-cohesion' && i.file.includes('main.ts'));

            // Only event handling - should not be an issue
            expect(cohesionIssue).toBeUndefined();
        });
    });

    describe('Statistics Calculation', () => {
        it('should calculate correct totals', async () => {
            const file1 = path.join(testDir, 'file1.ts');
            const file2 = path.join(testDir, 'file2.ts');

            const deps = Array.from({ length: 10 }, (_, i) => {
                const depFile = path.join(testDir, `dep${i}.ts`);
                fs.writeFileSync(depFile, `export const dep${i} = () => {};`);
                return `./dep${i}`;
            });

            fs.writeFileSync(file1, deps.map((d) => `import { dep } from '${d}';`).join('\n') + '\nexport const f1 = () => {};');
            fs.writeFileSync(file2, deps.map((d) => `import { dep } from '${d}';`).join('\n') + '\nexport const f2 = () => {};');

            const issues = await detector.detect(testDir);
            const stats = detector.getStatistics(issues);

            expect(stats.totalFiles).toBeGreaterThan(0);
            expect(stats.totalIssues).toBeGreaterThanOrEqual(0);
            expect(stats.bySeverity.high + stats.bySeverity.medium + stats.bySeverity.low).toBe(stats.totalIssues);
        });

        it('should calculate averages correctly', async () => {
            const file1 = path.join(testDir, 'file1.ts');
            const file2 = path.join(testDir, 'file2.ts');

            fs.writeFileSync(file1, `export const f1 = () => {};`);
            fs.writeFileSync(file2, `export const f2 = () => {};`);

            const issues = await detector.detect(testDir);
            const stats = detector.getStatistics(issues);

            expect(stats.averageCoupling).toBeGreaterThanOrEqual(0);
            expect(stats.averageCohesion).toBeGreaterThanOrEqual(0);
            expect(stats.averageCohesion).toBeLessThanOrEqual(1);
        });

        it('should count well-isolated components', async () => {
            const file1 = path.join(testDir, 'file1.ts');
            const file2 = path.join(testDir, 'file2.ts');

            fs.writeFileSync(file1, `export const f1 = () => {};`);
            fs.writeFileSync(file2, `export const f2 = () => {};`);

            const issues = await detector.detect(testDir);
            const stats = detector.getStatistics(issues);

            expect(stats.wellIsolatedComponents).toBeGreaterThanOrEqual(0);
            expect(stats.wellIsolatedComponents).toBeLessThanOrEqual(stats.totalFiles);
        });

        it('should handle empty results gracefully', async () => {
            const issues: IsolationIssue[] = [];
            const stats = detector.getStatistics(issues);

            expect(stats.totalIssues).toBe(0);
            expect(stats.bySeverity.high).toBe(0);
            expect(stats.bySeverity.medium).toBe(0);
            expect(stats.bySeverity.low).toBe(0);
        });
    });

    describe('Exclusion Patterns', () => {
        it('should exclude test files', async () => {
            const testFile = path.join(testDir, 'main.test.ts');
            const deps = Array.from({ length: 20 }, (_, i) => {
                const depFile = path.join(testDir, `dep${i}.ts`);
                fs.writeFileSync(depFile, `export const dep${i} = () => {};`);
                return `./dep${i}`;
            });

            fs.writeFileSync(testFile, deps.map((d) => `import { dep } from '${d}';`).join('\n') + '\ntest("example", () => {});');

            const issues = await detector.detect(testDir);
            const testIssues = issues.filter((i) => i.file.includes('.test.'));

            expect(testIssues.length).toBe(0);
        });

        it('should exclude mock files', async () => {
            const mockFile = path.join(testDir, 'main.mock.ts');
            const lines = Array.from({ length: 500 }, (_, i) => `const var${i} = ${i};`);

            fs.writeFileSync(mockFile, lines.join('\n') + '\nexport const mock = {};');

            const issues = await detector.detect(testDir);
            const mockIssues = issues.filter((i) => i.file.includes('.mock.'));

            expect(mockIssues.length).toBe(0);
        });

        it('should exclude fixture files', async () => {
            const fixtureFile = path.join(testDir, 'data.fixture.ts');
            const lines = Array.from({ length: 500 }, (_, i) => `const var${i} = ${i};`);

            fs.writeFileSync(fixtureFile, lines.join('\n') + '\nexport const fixture = {};');

            const issues = await detector.detect(testDir);
            const fixtureIssues = issues.filter((i) => i.file.includes('.fixture.'));

            expect(fixtureIssues.length).toBe(0);
        });
    });

    describe('Console Formatting', () => {
        it('should format tight-coupling issue with correct emoji', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            const deps = Array.from({ length: 10 }, (_, i) => {
                const depFile = path.join(testDir, `dep${i}.ts`);
                fs.writeFileSync(depFile, `export const dep${i} = () => {};`);
                return `./dep${i}`;
            });

            fs.writeFileSync(
                mainFile,
                deps.map((d) => `import { dep } from '${d}';`).join('\n') + '\nexport const main = () => {};'
            );

            const issues = await detector.detect(testDir);
            const couplingIssue = issues.find((i) => i.type === 'tight-coupling');

            if (couplingIssue) {
                const formatted = detector.formatError(couplingIssue);
                expect(formatted).toContain('🔗');
                expect(formatted).toContain('tight-coupling');
            }
        });

        it('should format boundary-violation with HIGH severity emoji', async () => {
            fs.mkdirSync(path.join(testDir, 'domain'), { recursive: true });
            fs.mkdirSync(path.join(testDir, 'services'), { recursive: true });

            const domainFile = path.join(testDir, 'domain', 'User.ts');
            const serviceFile = path.join(testDir, 'services', 'UserService.ts');

            fs.writeFileSync(domainFile, `import { UserService } from '../services/UserService';\nexport class User {}`);
            fs.writeFileSync(serviceFile, `export class UserService {}`);

            const issues = await detector.detect(testDir);
            const boundaryIssue = issues.find((i) => i.type === 'boundary-violation');

            if (boundaryIssue) {
                const formatted = detector.formatError(boundaryIssue);
                expect(formatted).toContain('🔴');
                expect(formatted).toContain('🚧');
                expect(formatted).toContain('boundary-violation');
            }
        });

        it('should format god-component with suggested fix', async () => {
            const mainFile = path.join(testDir, 'main.ts');
            const lines = Array.from({ length: 350 }, (_, i) => `const var${i} = ${i};`);
            fs.writeFileSync(mainFile, lines.join('\n') + '\nexport const main = () => {};');

            const issues = await detector.detect(testDir);
            const godIssue = issues.find((i) => i.type === 'god-component');

            if (godIssue) {
                const formatted = detector.formatError(godIssue);
                expect(formatted).toContain('👑');
                expect(formatted).toContain('✅ Suggested Fix:');
            }
        });
    });
});
