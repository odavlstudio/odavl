// False Positive: Enum type name should NOT be flagged
export enum SecretType {
  TOKEN = 'third_party_token',
  SECRET = 'webhook_secret',
  KEY = 'api_key_value',
  PASSWORD = 'user_password',
}

// This is a TYPE NAME, not an actual credential!
