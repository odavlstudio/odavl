// False Positive: Template with only variables should NOT be flagged
export function buildUrl(protocol: string, host: string, port: number) {
  const url = `${protocol}://${host}:${port}`;
  return url;
}

// No hardcoded secrets here!
