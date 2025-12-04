import { nanoid } from 'nanoid';

// False Positive: Dynamic generation should NOT be flagged
export function createApiKey() {
  const apiKey = `odavl_${nanoid(16)}_${nanoid(32)}`;
  return apiKey;
}

// This is GENERATED at runtime, not hardcoded!
