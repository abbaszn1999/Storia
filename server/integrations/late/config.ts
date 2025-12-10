export const lateConfig = {
  // From environment
  apiKey: process.env.LATE_API_KEY!,
  webhookSecret: process.env.LATE_WEBHOOK_SECRET, // Optional, for webhook verification
  
  // Hardcoded constants (these don't change)
  baseUrl: 'https://getlate.dev/api/v1',
  connectBaseUrl: 'https://getlate.dev/connect',
  
  // API configuration
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
};

// Validate required config
if (!lateConfig.apiKey) {
  console.error('LATE_API_KEY environment variable is required. Get it from https://getlate.dev dashboard.');
  // Don't throw error to allow server to start, but log warning
}

// Warn if webhook secret missing (not critical initially)
if (!lateConfig.webhookSecret) {
  console.warn('LATE_WEBHOOK_SECRET not set. Webhook signature verification will be skipped.');
}

