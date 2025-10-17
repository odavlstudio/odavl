import * as assert from 'assert';
import * as vscode from 'vscode';
import { registerWebviewMessageHandler, postWebviewMessage } from './webviewMessaging';

describe('webviewMessaging utility', () => {
    it('registerWebviewMessageHandler should call handler on message', async () => {
        let called = false;
        const fakeWebview = {
            onDidReceiveMessage: (cb: (msg: { test: number }) => void) => {
                cb({ test: 1 });
                return { dispose: () => { } };
            }
        } as unknown as vscode.Webview;
        registerWebviewMessageHandler(fakeWebview, async (msg: unknown) => {
            if (typeof msg === 'object' && msg !== null && 'test' in msg) {
                called = (msg as { test: number }).test === 1;
            }
        });
        assert.strictEqual(called, true);
    });

    it('postWebviewMessage should call postMessage', async () => {
        let sent: unknown = null;
        const fakeWebview = {
            postMessage: (msg: unknown) => {
                sent = msg;
                return Promise.resolve(true);
            }
        } as unknown as vscode.Webview;
        const result = await postWebviewMessage(fakeWebview, { foo: 'bar' });
        assert.strictEqual(result, true);
        assert.deepStrictEqual(sent, { foo: 'bar' });
    });
});
