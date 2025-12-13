/**
 * VS Code API Mock - For Unit Testing
 * 
 * Provides minimal mocks of vscode API to allow services to be tested
 * without full vscode-test environment.
 * 
 * Phase 1: Extension Stability & Testing
 */

/**
 * Mock OutputChannel for testing
 */
export class MockOutputChannel {
  private lines: string[] = [];
  
  appendLine(value: string): void {
    this.lines.push(value);
  }
  
  append(value: string): void {
    this.lines.push(value);
  }
  
  clear(): void {
    this.lines = [];
  }
  
  show(): void {
    // No-op in tests
  }
  
  hide(): void {
    // No-op in tests
  }
  
  dispose(): void {
    this.lines = [];
  }
  
  getLines(): string[] {
    return [...this.lines];
  }
}

/**
 * Mock DiagnosticCollection for testing
 */
export class MockDiagnosticCollection {
  private diagnostics = new Map<string, any[]>();
  
  set(uri: any, diagnostics: any[]): void {
    const key = typeof uri === 'string' ? uri : uri.toString();
    this.diagnostics.set(key, diagnostics);
  }
  
  delete(uri: any): void {
    const key = typeof uri === 'string' ? uri : uri.toString();
    this.diagnostics.delete(key);
  }
  
  clear(): void {
    this.diagnostics.clear();
  }
  
  forEach(callback: (uri: any, diagnostics: any[]) => void): void {
    this.diagnostics.forEach(callback);
  }
  
  get(uri: any): any[] | undefined {
    const key = typeof uri === 'string' ? uri : uri.toString();
    return this.diagnostics.get(key);
  }
  
  has(uri: any): boolean {
    const key = typeof uri === 'string' ? uri : uri.toString();
    return this.diagnostics.has(key);
  }
  
  dispose(): void {
    this.clear();
  }
  
  getAllDiagnostics(): Map<string, any[]> {
    return new Map(this.diagnostics);
  }
}

/**
 * Mock ExtensionContext for testing
 */
export class MockExtensionContext {
  subscriptions: { dispose(): any }[] = [];
  workspaceState = new MockMemento();
  globalState = new MockMemento();
  secrets = new MockSecretStorage();
  extensionUri: any = { fsPath: '/mock/extension/path', path: '/mock/extension/path' };
  extensionPath = '/mock/extension/path';
  storagePath = '/mock/storage/path';
  globalStoragePath = '/mock/global/storage/path';
  globalStorageUri: any = { fsPath: '/mock/global/storage/path', path: '/mock/global/storage/path' };
  logPath = '/mock/log/path';
  logUri: any = { fsPath: '/mock/log/path', path: '/mock/log/path' };
  extensionMode = 3; // ExtensionMode.Production
  environmentVariableCollection: any = {
    replace: () => {},
    append: () => {},
    prepend: () => {},
    get: () => undefined,
    forEach: () => {},
    clear: () => {},
    delete: () => {}
  };
  
  asAbsolutePath(relativePath: string): string {
    return `/mock/extension/path/${relativePath}`;
  }
}

/**
 * Mock Memento (workspace/global state)
 */
export class MockMemento {
  private storage = new Map<string, any>();
  
  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.storage.has(key) ? this.storage.get(key) : defaultValue;
  }
  
  async update(key: string, value: any): Promise<void> {
    this.storage.set(key, value);
  }
  
  keys(): readonly string[] {
    return Array.from(this.storage.keys());
  }
  
  clear(): void {
    this.storage.clear();
  }
}

/**
 * Mock SecretStorage for testing auth
 */
export class MockSecretStorage {
  private secrets = new Map<string, string>();
  
  async get(key: string): Promise<string | undefined> {
    return this.secrets.get(key);
  }
  
  async store(key: string, value: string): Promise<void> {
    this.secrets.set(key, value);
  }
  
  async delete(key: string): Promise<void> {
    this.secrets.delete(key);
  }
  
  clear(): void {
    this.secrets.clear();
  }
}

/**
 * Mock StatusBarItem for testing
 */
export class MockStatusBarItem {
  text = '';
  tooltip: string | undefined;
  command: string | undefined;
  color: string | undefined;
  backgroundColor: any;
  alignment = 1; // Left
  priority = 100;
  private _isShown = false;
  
  show(): void {
    this._isShown = true;
  }
  
  hide(): void {
    this._isShown = false;
  }
  
  dispose(): void {
    this._isShown = false;
  }
  
  isShown(): boolean {
    return this._isShown;
  }
}

/**
 * Mock EventEmitter for testing
 */
export class MockEventEmitter<T> {
  private listeners: ((e: T) => void)[] = [];
  
  get event() {
    return (listener: (e: T) => void) => {
      this.listeners.push(listener);
      return { dispose: () => {
        const index = this.listeners.indexOf(listener);
        if (index >= 0) {
          this.listeners.splice(index, 1);
        }
      }};
    };
  }
  
  fire(data: T): void {
    this.listeners.forEach(listener => listener(data));
  }
  
  dispose(): void {
    this.listeners = [];
  }
}
