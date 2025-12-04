// Browser and Node globals for all apps
// Augment global scope for ODAVL apps (safe extension)
export { };
declare global {
    // Browser globals
    var window: Window;
    var document: Document;
    var URL: typeof URL;
    var console: Console;
    var self: typeof globalThis;
    var Blob: typeof Blob;
    var FileReader: typeof FileReader;
    var FormData: typeof FormData;
    var XMLHttpRequest: typeof XMLHttpRequest;
    // Node globals
    var require: NodeRequire;
    var process: NodeJS.Process;
    var global: typeof globalThis;
    // Legacy/IE
    var ActiveXObject: any;
}
