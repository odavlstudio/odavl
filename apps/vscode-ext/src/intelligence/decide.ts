export async function decide(observed: any) {
    // Analyze observed data for quality issues (stub: count files, check git status)
    const issues = observed.gitStatus.split('\n').filter((l: string) => l.trim()).length;
    return { issues, summary: issues > 0 ? 'Issues found' : 'Clean' };
}
