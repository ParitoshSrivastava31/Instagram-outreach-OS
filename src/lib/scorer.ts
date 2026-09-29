import { RawInstagramProfile, LeadTier, Campaign } from '@/types';
import { ROLE_KEYWORDS, RESEARCH_KEYWORDS, NICHE_KEYWORDS, EXCLUDED_KEYWORDS } from './taxonomy';

/**
 * Word-boundary matching to prevent false positives.
 * e.g. 'ai' won't match 'email', 'ux' won't match 'luxury'.
 * Multi-word terms like 'content creator' use exact substring match (already safe).
 */
const wordMatchCache = new Map<string, RegExp>();
function wordMatch(text: string, term: string): boolean {
  // Multi-word phrases are safe with includes — no false positive risk
  if (term.includes(' ')) return text.includes(term);
  let regex = wordMatchCache.get(term);
  if (!regex) {
    regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    wordMatchCache.set(term, regex);
  }
  return regex.test(text);
}

export interface ScoringResult {
  score: number;
  tier: LeadTier;
  qualificationReason: string;
  matchedRoles: string[];
  matchedResearch: string[];
  matchedNiches: string[];
  isQualified: boolean;
  rejectionReason?: string;
  isUnverifiedFollowers?: boolean;
}

export function scoreInstagramProfile(
  profile: RawInstagramProfile,
  campaign?: Campaign,
  options?: { alreadyContacted?: boolean }
): ScoringResult {
  let score = 0;
  const matchedRoles: string[] = [];
  const matchedResearch: string[] = [];
  const matchedNiches: string[] = [];
  const matchedNegative: string[] = [];

  const textToScan = [
    profile.biography || '',
    profile.fullName || '',
    profile.businessCategoryName || '',
    profile.username || '',
    ...(profile.latestPostsCaptions || []).slice(0, 5)
  ]
    .join(' ')
    .toLowerCase();

  // 1. Follower Check & Unverified Tolerance
  const minFollowers = campaign?.target_min_followers ?? 1000;
  const maxFollowers = campaign?.target_max_followers ?? 20000;
  let followers = profile.followersCount || 0;
  let isUnverifiedFollowers = false;

  if (followers === 0) {
    // When scraped without direct follower metrics (e.g. preview item or private API rate limit),
    // do not throw away the lead. Assign an estimated baseline of 2,500 followers.
    isUnverifiedFollowers = true;
    followers = 2500;
  } else if (followers < 300) {
    // Brand new bot, empty or test account
    return {
      score: 0,
      tier: 'Disqualified',
      qualificationReason: `Followers (${followers.toLocaleString()}) below minimum viable creator threshold (300)`,
      matchedRoles: [],
      matchedResearch: [],
      matchedNiches: [],
      isQualified: false,
      rejectionReason: `Account has only ${followers} followers (under 300)`
    };
  } else if (followers > Math.max(maxFollowers * 2.5, 60000)) {
    // Celebrity / mega-influencer account where cold outreach reply rate is near zero
    return {
      score: 0,
      tier: 'Disqualified',
      qualificationReason: `Followers (${followers.toLocaleString()}) exceed target outreach ceiling`,
      matchedRoles: [],
      matchedResearch: [],
      matchedNiches: [],
      isQualified: false,
      rejectionReason: `Follower count ${followers.toLocaleString()} is too large for personalized creator DM outreach`
    };
  } else if (followers >= minFollowers && followers <= maxFollowers) {
    // Right in the campaign's sweet spot
    score += 15;
  } else {
    // Close to threshold (e.g. 500-1000 or 20k-35k)
    score += 8;
  }

  // 2. Private account check
  if (profile.isPrivate) {
    return {
      score: 0,
      tier: 'Disqualified',
      qualificationReason: 'Account is private. Public creator profile required.',
      matchedRoles: [],
      matchedResearch: [],
      matchedNiches: [],
      isQualified: false,
      rejectionReason: 'Private accounts cannot be reached via standard creator outreach'
    };
  }

  // 3. Exclusions & Negative Signal Detection
  const exclusions = campaign?.excluded_keywords?.length ? campaign.excluded_keywords : EXCLUDED_KEYWORDS;
  for (const excl of exclusions) {
    if (wordMatch(textToScan, excl.toLowerCase())) {
      matchedNegative.push(excl);
    }
  }

  // Penalize aggregators, meme pages, giveaway spam
  if (matchedNegative.some(n => ['meme', 'memes', 'entertainment', 'fan page', 'fanpage', 'giveaway', 'giveaways', 'win free'].includes(n))) {
    score -= 35;
  }
  if (matchedNegative.some(n => ['repost', 'reposts', 'aggregator', 'viral clips', 'daily clips'].includes(n))) {
    score -= 35;
  }

  // Activity & Quality baseline
  const postsCount = profile.postsCount ?? 0;
  const bio = (profile.biography || '').trim();

  if (postsCount > 0 && postsCount < 3) {
    score -= 10;
  }
  if (bio.length > 20) {
    score += 10;
  }
  if (profile.isBusinessAccount || profile.businessCategoryName) {
    score += 10;
  }

  if (options?.alreadyContacted) {
    score -= 20;
  }

  // 4. Role Matching
  const roleKeywords = campaign?.role_keywords?.length ? campaign.role_keywords : ROLE_KEYWORDS;
  for (const role of roleKeywords) {
    if (wordMatch(textToScan, role.toLowerCase())) {
      if (!matchedRoles.includes(role)) {
        matchedRoles.push(role);
      }
    }
  }

  // Additional general creator role detection
  const generalRoleMatches = [
    { key: 'content creator', terms: ['content creator', 'digital creator', 'creator', 'ugc creator', 'ugc'] },
    { key: 'strategist', terms: ['strategist', 'strategy', 'social media manager', 'smm', 'copywriter'] },
    { key: 'founder', terms: ['founder', 'co-founder', 'solopreneur', 'entrepreneur', 'consultant', 'agency'] },
    { key: 'educator', terms: ['educator', 'coach', 'mentor', 'teacher', 'author', 'speaker', 'i help', 'helping', 'sharing tips'] },
    { key: 'designer', terms: ['designer', 'creative director', 'video editor', 'art director', 'photographer'] }
  ];

  for (const group of generalRoleMatches) {
    if (group.terms.some(t => wordMatch(textToScan, t))) {
      if (!matchedRoles.includes(group.key)) {
        matchedRoles.push(group.key);
      }
    }
  }

  if (matchedRoles.length > 0) {
    score += 25;
  }

  // 5. Niche Matching
  const nicheKeywords = campaign?.niche_keywords?.length ? campaign.niche_keywords : NICHE_KEYWORDS;
  for (const n of nicheKeywords) {
    if (wordMatch(textToScan, n.toLowerCase())) {
      if (!matchedNiches.includes(n)) {
        matchedNiches.push(n);
      }
    }
  }

  // Additional general niche topics
  const generalNicheMatches = [
    { key: 'marketing', terms: ['marketing', 'growth', 'sales', 'branding', 'personal brand'] },
    { key: 'ai & tech', terms: ['ai', 'tech', 'software', 'saas', 'automation', 'chatgpt', 'claude'] },
    { key: 'business', terms: ['business', 'b2b', 'startup', 'revenue', 'ecommerce', 'monetize'] },
    { key: 'design', terms: ['design', 'ui/ux', 'visual', 'creative', 'typography', 'interior design'] },
    { key: 'lifestyle & content', terms: ['lifestyle', 'blogger', 'vlog', 'reels', 'travel', 'fashion', 'wellness'] }
  ];

  for (const group of generalNicheMatches) {
    if (group.terms.some(t => wordMatch(textToScan, t))) {
      if (!matchedNiches.includes(group.key)) {
        matchedNiches.push(group.key);
      }
    }
  }

  if (matchedNiches.length > 0) {
    score += 20;
  }

  // 6. Research & Problem Keyword Matching (Bonus accelerator, NOT a mandatory barrier!)
  const researchKeywords = campaign?.research_keywords?.length ? campaign.research_keywords : RESEARCH_KEYWORDS;
  for (const kw of researchKeywords) {
    if (wordMatch(textToScan, kw.toLowerCase())) {
      if (!matchedResearch.includes(kw)) {
        matchedResearch.push(kw);
      }
    }
  }

  const hasSaveBehavior = matchedResearch.some(r =>
    ['save this', 'save this reel', 'save this post', 'bookmark this', 'come back to this', 'for later', 'use this later'].includes(r)
  );

  if (hasSaveBehavior) {
    score += 20;
  } else if (matchedResearch.length > 0) {
    score += 15;
  }

  // Commercial / Creator Monetization Signals
  if (wordMatch(textToScan, 'dm for') || wordMatch(textToScan, 'collab') || wordMatch(textToScan, 'inquiries')) score += 10;
  if (wordMatch(textToScan, 'newsletter') || wordMatch(textToScan, 'substack') || wordMatch(textToScan, 'course') || wordMatch(textToScan, 'gumroad')) score += 10;

  // Penalize negative keywords
  if (matchedNegative.length > 0) {
    score -= matchedNegative.length * 15;
  }

  // 7. Tier Assignment Logic
  const roleCount = matchedRoles.length;
  const nicheCount = matchedNiches.length;
  const researchCount = matchedResearch.length;

  let tier: LeadTier = 'Disqualified';
  let isQualified = false;

  // Disqualification conditions
  if (score < 15 || (matchedNegative.length > 0 && score < 25)) {
    tier = 'Disqualified';
    isQualified = false;
  }
  // Tier A: Strong creator role + (active niche OR high-intent save/research signal)
  else if (score >= 45 && (roleCount >= 1 || profile.businessCategoryName) && (nicheCount >= 1 || researchCount >= 1)) {
    tier = 'Tier A';
    isQualified = true;
  }
  // Tier B: Creator role OR target niche match with active profile bio
  else if (score >= 25 && (roleCount >= 1 || nicheCount >= 1 || bio.length >= 15)) {
    tier = 'Tier B';
    isQualified = true;
  }
  // Tier C: Emerging creator or general profile matching keywords
  else if (score >= 15) {
    tier = 'Tier C';
    isQualified = true;
  } else {
    tier = 'Disqualified';
    isQualified = false;
  }

  // Formulate Human-readable Qualification Reason
  const formatFollowers = (num: number) => {
    if (isUnverifiedFollowers) return '~2.5K est.';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const reasonParts: string[] = [];
  if (matchedRoles.length > 0) {
    reasonParts.push(capitalizeWords(matchedRoles[0]));
  } else if (profile.businessCategoryName) {
    reasonParts.push(capitalizeWords(profile.businessCategoryName));
  }
  if (matchedNiches.length > 0) {
    reasonParts.push(capitalizeWords(matchedNiches[0]) + ' focus');
  }
  if (hasSaveBehavior) {
    reasonParts.push('"save this" language');
  } else if (matchedResearch.length > 0) {
    reasonParts.push(matchedResearch[0] + ' references');
  }
  reasonParts.push(`${formatFollowers(followers)} followers`);

  const qualificationReason = `${tier} · ${reasonParts.join(' + ')}`;

  return {
    score: Math.max(0, score),
    tier,
    qualificationReason,
    matchedRoles,
    matchedResearch,
    matchedNiches,
    isQualified,
    rejectionReason: isQualified ? undefined : `Low relevance score (${score}) or missing creator indicators`,
    isUnverifiedFollowers
  };
}

function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
