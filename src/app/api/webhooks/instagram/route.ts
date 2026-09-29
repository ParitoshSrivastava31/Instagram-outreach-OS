import { NextResponse } from 'next/server';
import { getLeads, getLeadByUsername, updateLeadStatus } from '@/lib/db';

const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'vault_outreach_meta_token_2026';

/**
 * Meta Webhook Verification (GET)
 * Meta makes a GET request when you configure the webhook subscription in the Meta Developer Portal.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    console.log('[Meta Webhook] Webhook verified successfully');
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  console.warn('[Meta Webhook] Verification token mismatch or missing mode');
  return new Response('Forbidden', { status: 403 });
}

/**
 * Meta Instagram Messaging Webhook (POST)
 * Receives incoming messages from connected professional Instagram account.
 * Automatically matches sender to leads and transitions them from CONTACTED -> REPLIED.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verify this is an instagram object
    if (body.object !== 'instagram' && body.object !== 'page') {
      return NextResponse.json({ status: 'IGNORED_NON_INSTAGRAM_OBJECT' }, { status: 200 });
    }

    const entries = body.entry || [];
    let processedReplies = 0;

    for (const entry of entries) {
      const messagingEvents = entry.messaging || [];
      for (const event of messagingEvents) {
        // We only care about incoming messages
        if (event.message && !event.message.is_echo) {
          const senderId = event.sender?.id;
          const senderUsername = event.sender?.username;
          const messageText = event.message?.text || '[Media/Voice Reel received]';

          console.log(`[Meta Webhook] Incoming DM from sender: ${senderUsername || senderId}`);

          // Look up lead by username first (O(1)), fall back to scoped ID scan only if needed
          let matchedLead = null;
          if (senderUsername) {
            matchedLead = await getLeadByUsername(senderUsername);
          }
          if (!matchedLead && senderId) {
            // Fallback: search by scoped ID in metadata (rare — only when username not in webhook payload)
            const allLeads = await getLeads({ limit: 500 });
            matchedLead = allLeads.find(l =>
              l.raw_metadata?.instagram_scoped_id === senderId ||
              l.raw_metadata?.id === senderId
            ) || null;
          }

          if (matchedLead) {
            console.log(`[Meta Webhook] Matched lead @${matchedLead.instagram_username}. Updating to REPLIED.`);
            await updateLeadStatus(matchedLead.id, 'REPLIED', {
              webhook_source: 'meta_graph_api',
              sender_id: senderId,
              message_snippet: messageText.substring(0, 100),
              received_at: new Date().toISOString()
            });
            processedReplies++;
          } else {
            console.log(`[Meta Webhook] Received message from unknown prospect ID: ${senderId}`);
          }
        }
      }
    }

    return NextResponse.json({
      status: 'EVENT_RECEIVED',
      processedReplies
    });
  } catch (error: any) {
    console.error('[Meta Webhook] Error processing event:', error);
    // Meta requires a 200 OK to acknowledge receipt, otherwise it retries indefinitely
    return NextResponse.json({ status: 'ERROR_RECORDED', error: error.message }, { status: 200 });
  }
}
