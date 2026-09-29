import { Lead, MessageTemplate, SenderAccount } from '@/types';

export const DEFAULT_TEMPLATES: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Creator who uses "save this"',
    niche: 'general',
    target_tier: 'Tier A',
    is_active: true,
    template: `Hey {{first_name}}, you literally tell people to save your Reels, which is basically the problem I’ve spent the last few weeks thinking about.

People save useful things constantly, but Instagram gives them almost no useful way to revisit or actually use those saves.

I built something around that called Vault.

You just send a Reel to @{{vault_username}} and it turns it into searchable knowledge you can actually use.

Would genuinely love to know what you think.`
  },
  {
    name: 'AI / business creator',
    niche: 'ai',
    target_tier: 'Tier A',
    is_active: true,
    template: `Hey {{first_name}}, I’m building Vault around something I keep noticing with AI/business content.

People save useful Reels constantly because they want to try the tools, workflows, ideas, or frameworks later.

Then their saved folder becomes impossible to use.

Vault is a really simple experiment around that. You send a Reel to @{{vault_username}} and it turns the useful part into something you can actually come back to.

Would love for you to test it with one.`
  },
  {
    name: 'Founder / Solopreneur',
    niche: 'startup',
    target_tier: 'Tier A',
    is_active: true,
    template: `Hey {{first_name}}, founder here.

I came across your content and you’re unusually close to the problem I’m building around.

People increasingly use Instagram as a research feed, but all that information ends up trapped inside a saved folder.

I built Vault to test a different workflow.

You send a Reel to @{{vault_username}} and it extracts what’s actually worth remembering.

Would love to hear what you think after trying one.`
  },
  {
    name: 'Creator-Operator',
    niche: 'creator-economy',
    target_tier: 'Tier A',
    is_active: true,
    template: `Hey {{first_name}}, I’m building something called Vault around a problem I think you might relate to.

You create the kind of content people save with the intention of coming back to later. I’ve been thinking a lot about what actually happens to those saves.

I built a really simple experiment around it. You send a Reel to @{{vault_username}} and it turns the useful part into something you can actually find and use later.

Would love for you to try it with one Reel.`
  },
  {
    name: 'Personal creator observation',
    niche: 'general',
    target_tier: 'Tier B',
    is_active: true,
    template: `Hey {{first_name}}, saw your content around {{niche}}.

It’s actually the kind of stuff I would normally save, which is slightly ironic because that’s exactly the problem I’ve been building around.

I have hundreds of useful Reels sitting in my saves that I’ll probably never open again.

So I built Vault. You send a Reel to @{{vault_username}} and it turns it into something you can actually come back to.

Would love for you to try one.`
  }
];

export function extractFirstName(displayName?: string, username?: string): string {
  if (!displayName || displayName.trim().length === 0) {
    return username || 'there';
  }

  // Remove emojis, symbols, and pipe separators often found in IG names (e.g. "Sarah | Content Strategist 🚀")
  const cleaned = displayName
    .replace(/[^\w\s-]/gi, ' ')
    .trim()
    .split(/\s+/)[0];

  if (!cleaned || cleaned.length < 2 || cleaned.length > 20) {
    return 'there';
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

export function formatFollowersCount(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

/**
 * Deterministically picks the most contextually relevant template based strictly
 * on public facts found in the prospect's profile.
 */
export function selectBestTemplate(
  lead: Partial<Lead>,
  availableTemplates: (MessageTemplate | Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>)[] = DEFAULT_TEMPLATES
): MessageTemplate | Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'> {
  const research = lead.matched_research || [];
  const niches = lead.matched_niches || [];
  const roles = lead.matched_roles || [];

  const hasSaveBehavior = research.some(r =>
    ['save this', 'save this reel', 'save this post', 'bookmark this', 'for later'].includes(r)
  );

  const isAIOrTech = niches.some(n =>
    ['ai', 'artificial intelligence', 'chatgpt', 'saas', 'software', 'technology', 'developer'].includes(n)
  );

  const isFounder = roles.some(r =>
    ['founder', 'co-founder', 'solopreneur', 'entrepreneur'].includes(r)
  );

  const isCreatorOrStrategist = roles.some(r =>
    ['content creator', 'content strategist', 'social media manager', 'ugc creator'].includes(r)
  );

  if (hasSaveBehavior) {
    const tpl = availableTemplates.find(t => t.name.includes('"save this"'));
    if (tpl) return tpl;
  }

  if (isAIOrTech) {
    const tpl = availableTemplates.find(t => t.name.includes('AI / business'));
    if (tpl) return tpl;
  }

  if (isFounder) {
    const tpl = availableTemplates.find(t => t.name.includes('Founder'));
    if (tpl) return tpl;
  }

  if (isCreatorOrStrategist) {
    const tpl = availableTemplates.find(t => t.name.includes('Creator-Operator'));
    if (tpl) return tpl;
  }

  // Fallback to personal creator observation
  return availableTemplates.find(t => t.name.includes('Personal creator observation')) || availableTemplates[0];
}

export function renderMessage(
  templateText: string,
  lead: Partial<Lead>,
  sender?: Partial<SenderAccount>,
  vaultUsername: string = 'vault.moment'
): string {
  const firstName = extractFirstName(lead.display_name, lead.instagram_username);
  const username = lead.instagram_username || '';
  const niche = lead.matched_niches?.[0] || 'your niche';
  const followers = formatFollowersCount(lead.followers || 0);
  const senderName = sender?.display_name || sender?.name || 'Paritosh';

  return templateText
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{username\}\}/g, username)
    .replace(/\{\{niche\}\}/g, niche)
    .replace(/\{\{followers\}\}/g, followers)
    .replace(/\{\{sender_name\}\}/g, senderName)
    .replace(/\{\{vault_username\}\}/g, vaultUsername);
}
