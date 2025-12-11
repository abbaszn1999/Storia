import type { Request, Response } from 'express';
import type { LateWebhookEvent } from './types';
import { lateConfig } from './config';
import type { IStorage } from '../../storage';

export class LateWebhookHandler {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Verify webhook signature (if webhook secret is configured)
   */
  private verifySignature(req: Request): boolean {
    if (!lateConfig.webhookSecret) {
      console.warn('Webhook secret not configured - skipping signature verification');
      return true;
    }

    const signature = req.headers['x-late-signature'] as string;
    if (!signature) {
      return false;
    }

    // TODO: Implement actual signature verification based on Late.dev's webhook signing
    // For now, just check if signature exists
    return !!signature;
  }

  /**
   * Handle incoming webhook events
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Verify signature
      if (!this.verifySignature(req)) {
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }

      const event: LateWebhookEvent = req.body;

      console.log('Received Late webhook:', event.event, event.data);

      // Handle different event types
      switch (event.event) {
        case 'account.connected':
          await this.handleAccountConnected(event);
          break;

        case 'account.disconnected':
          await this.handleAccountDisconnected(event);
          break;

        case 'account.error':
          await this.handleAccountError(event);
          break;

        default:
          console.log('Unhandled webhook event:', event.event);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Handle account.connected event
   */
  private async handleAccountConnected(event: LateWebhookEvent): Promise<void> {
    const { accountId, profileId, platform, platformAccountId, platformUsername, platformName, platformProfileImage } = event.data;

    if (!accountId || !profileId || !platform) {
      console.error('Missing required fields in account.connected event');
      return;
    }

    try {
      // Find workspace by late profile ID
      const workspaces = await this.storage.getWorkspacesByUserId(''); // Need to get all workspaces
      const workspace = workspaces.find(w => (w as any).lateProfileId === profileId);

      if (!workspace) {
        console.error('No workspace found for profile:', profileId);
        return;
      }

      // Upsert integration (create or update)
      await this.storage.upsertLateIntegration({
        workspaceId: workspace.id,
        platform: platform as any,
        lateAccountId: accountId,
        platformUserId: platformAccountId || '',
        platformUsername: platformUsername || platformName || '',
        platformProfileImage: platformProfileImage || '',
      });

      console.log('Successfully processed account.connected event for', platform);
    } catch (error) {
      console.error('Error processing account.connected event:', error);
    }
  }

  /**
   * Handle account.disconnected event
   */
  private async handleAccountDisconnected(event: LateWebhookEvent): Promise<void> {
    const { accountId } = event.data;

    if (!accountId) {
      console.error('Missing accountId in account.disconnected event');
      return;
    }

    try {
      const integration = await this.storage.getIntegrationByLateAccountId(accountId);

      if (integration) {
        // Delete the integration from database
        await this.storage.deleteWorkspaceIntegration(integration.id);
        console.log('Successfully deleted disconnected account:', accountId);
      }
    } catch (error) {
      console.error('Error processing account.disconnected event:', error);
    }
  }

  /**
   * Handle account.error event
   */
  private async handleAccountError(event: LateWebhookEvent): Promise<void> {
    const { accountId, error } = event.data;

    console.error('Account error for', accountId, ':', error);

    if (accountId) {
      try {
        const integration = await this.storage.getIntegrationByLateAccountId(accountId);

        if (integration) {
          // Delete the integration due to error (account no longer valid)
          await this.storage.deleteWorkspaceIntegration(integration.id);
          console.log('Deleted integration due to error:', accountId);
        }
      } catch (err) {
        console.error('Error processing account.error event:', err);
      }
    }
  }
}

