/**
 * Shotstack API Configuration
 * 
 * Environment variables:
 * - SHOTSTACK_API_KEY: Sandbox API key for development/testing
 * - SHOTSTACK_PRODUCTION_KEY: Production API key for live deployments
 * - SHOTSTACK_ENV: 'sandbox' or 'production' (defaults to 'sandbox')
 * - SHOTSTACK_WEBHOOK_SECRET: Secret for verifying webhook signatures
 */

export interface ShotstackConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
  baseUrl: string;
  webhookSecret?: string;
}

/**
 * Get the Shotstack configuration based on environment variables
 */
export function getShotstackConfig(): ShotstackConfig {
  const environment = (process.env.SHOTSTACK_ENV || 'sandbox') as 'sandbox' | 'production';
  
  const apiKey = environment === 'production' 
    ? process.env.SHOTSTACK_PRODUCTION_KEY 
    : process.env.SHOTSTACK_API_KEY;
  
  if (!apiKey) {
    console.warn('[Shotstack] No API key configured. Set SHOTSTACK_API_KEY or SHOTSTACK_PRODUCTION_KEY environment variable.');
  }
  
  const baseUrl = environment === 'production'
    ? 'https://api.shotstack.io/v1'
    : 'https://api.shotstack.io/stage';
  
  return {
    apiKey: apiKey || '',
    environment,
    baseUrl,
    webhookSecret: process.env.SHOTSTACK_WEBHOOK_SECRET,
  };
}

/**
 * Check if Shotstack is properly configured
 */
export function isShotstackConfigured(): boolean {
  const config = getShotstackConfig();
  return !!config.apiKey;
}

/**
 * Shotstack API endpoints
 */
export const SHOTSTACK_ENDPOINTS = {
  // Edit API
  render: '/render',
  renderStatus: (id: string) => `/render/${id}`,
  
  // Ingest API
  ingest: '/ingest',
  ingestStatus: (id: string) => `/ingest/${id}`,
  
  // Serve API
  assets: '/assets',
  assetById: (id: string) => `/assets/${id}`,
} as const;

