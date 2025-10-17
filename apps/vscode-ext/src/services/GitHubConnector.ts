import * as vscode from 'vscode';

// Simple in-memory cache per scopes key to avoid redundant session checks
type CachedSession = { session: vscode.AuthenticationSession | null; checkedAt: number };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const sessionCache: Map<string, CachedSession> = new Map();

function scopesKey(scopes: string[]): string {
    return scopes.slice().sort().join(' ');
}

export async function getGitHubSession(scopes: string[], force = false): Promise<vscode.AuthenticationSession | null> {
    const key = scopesKey(scopes);
    const now = Date.now();
    const cached = sessionCache.get(key);

    if (!force && cached && (now - cached.checkedAt) < CACHE_TTL_MS) {
        return cached.session;
    }

    // Do not create a session automatically; reuse if available to reduce prompts and traffic
    const session = await vscode.authentication.getSession('github', scopes, { createIfNone: false, silent: true });
    const normalized = session ?? null;
    sessionCache.set(key, { session: normalized, checkedAt: now });
    return normalized;
}

export async function getGitHubAccessToken(scopes: string[], force = false): Promise<string | null> {
    const ses = await getGitHubSession(scopes, force);
    return ses?.accessToken ?? null; // Never log or persist this value in plaintext
}

export function getLastChecked(scopes: string[]): number | undefined {
    const key = scopesKey(scopes);
    return sessionCache.get(key)?.checkedAt;
}
