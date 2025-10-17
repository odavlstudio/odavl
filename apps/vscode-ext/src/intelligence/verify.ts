export async function verify(action: any) {
    // Parse action result for verification (stub: check for errors)
    const success = action.result && !/error|fail/i.test(action.result);
    return { verified: success, details: action.result };
}
