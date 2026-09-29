import { RawInstagramProfile, LeadTier, Campaign } from '@/types';
import { ROLE_KEYWORDS, RESEARCH_KEYWORDS, NICHE_KEYWORDS, EXCLUDED_KEYWORDS } from './taxonomy';

export interface ScoringResult {
  score: number;
  tier: LeadTier;
  qualificationReason: string;
  matchedRoles: string[];
  matchedResearch: string[];
  matchedNiches: string[];
  isQualified: boolean;
  rejectionReason?: string;
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

  // 1. Follower Check
  const minFollowers = campaign?.target_min_followers ?? 1000;
  const maxFollowers = campaign?.target_max_followers ?? 20000;
  const followers = profile.followersCount || 0;

  if (followers < minFollowers) {
    return {
      score: 0,
      tier: 'Disqualified',
      qualificationReason: `Followers (${followers}) below minimum threshold (${minFollowers})`,
      matchedRoles: [],
      matchedResearch: [],
      matchedNiches: [],
      isQualified: false,
      rejectionReason: `Follower count ${followers} is under campaign minimum of ${minFollowers}`
    };
  }

  if (followers > maxFollowers) {
    return {
      score: 0,
      tier: 'Disqualified',
      qualificationReason: `Followers (${followers.toLocaleString()}) exceed maximum threshold (${maxFollowers.toLocaleString()})`,
      matchedRoles: [],
      matchedResearch: [],
      matchedNiches: [],
      isQualified: false,
      rejectionReason: `Follower count ${followers} exceeds target ceiling of ${maxFollowers}`
    };
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
      rejectionReason: 'Private accounts cannot be viewed or qualified for public outreach'
    };
  }

  // 3. Exclusions & Negative Signal Detection
  const exclusions = campaign?.excluded_keywords?.length ? campaign.excluded_keywords : EXCLUDED_KEYWORDS;
  for (const excl of exclusions) {
    if (textToScan.includes(excl.toLowerCase())) {
      matchedNegative.push(excl);
    }
  }

  if (matchedNegative.some(n => ['meme', 'memes', 'entertainment', 'fan page', 'fanpage', 'giveaway'].includes(n))) {
    score -= 30;
  }
  if (matchedNegative.some(n => ['repost', 'reposts', 'aggregator', 'viral clips'].includes(n))) {
    score -= 30;
  }
  if (matchedNegative.some(n => ['giveaway', 'giveaways', 'win free'].includes(n))) {
    score -= 25;
  }

  // Activity & Quality checks
  const postsCount = profile.postsCount ?? 0;
  const bio = (profile.biography || '').trim();

  if (postsCount < 5) {
    score -= 20; // Inactive or barely started
  }
  if (bio.length < 15) {
    score -= 15; // Bare profile
  }

  if (options?.alreadyContacted) {
    score -= 20;
  }

  // 4. Role Matching
  const roleKeywords = campaign?.role_keywords?.length ? campaign.role_keywords : ROLE_KEYWORDS;
  for (const role of roleKeywords) {
    if (textToScan.includes(role.toLowerCase())) {
      if (!matchedRoles.includes(role)) {
        matchedRoles.push(role);
      }
    }
  }

  // Role Scoring
  const hasOperatorRole = matchedRoles.some(r =>
    ['content creator', 'content strategist', 'social media manager', 'ugc creator', 'creator educator', 'digital creator'].includes(r)
  );
  const hasResearchRole = matchedRoles.some(r =>
    ['content strategy', 'content marketing', 'marketing strategist', 'growth marketer'].includes(r)
  );
  const hasFounderRole = matchedRoles.some(r =>
    ['founder', 'co-founder', 'solopreneur', 'entrepreneur', 'consultant'].includes(r)
  );
  const hasEducatorRole = matchedRoles.some(r =>
    ['educator', 'teacher', 'coach', 'course creator'].includes(r)
  );

  if (hasOperatorRole) score += 25;
  else if (hasResearchRole) score += 20;
  else if (hasFounderRole) score += 15;
  else if (hasEducatorRole) score += 10;
  else if (matchedRoles.length > 0) score += 10;

  // 5. Research & Problem Keyword Matching ("save this", "hooks", "research", etc.)
  const researchKeywords = campaign?.research_keywords?.length ? campaign.research_keywords : RESEARCH_KEYWORDS;
  for (const kw of researchKeywords) {
    if (textToScan.includes(kw.toLowerCase())) {
      if (!matchedResearch.includes(kw)) {
        matchedResearch.push(kw);
      }
    }
  }

  const hasSaveBehavior = matchedResearch.some(r =>
    ['save this', 'save this reel', 'save this post', 'bookmark this', 'come back to this', 'for later', 'use this later'].includes(r)
  );
  const hasContentResearch = matchedResearch.some(r =>
    ['content ideas', 'content research', 'research', 'competitor research', 'creative research'].includes(r)
  );
  const hasHooksOrFrameworks = matchedResearch.some(r =>
    ['hooks', 'hook ideas', 'scripts', 'framework', 'frameworks', 'templates', 'prompts', 'tools', 'swipe file'].includes(r)
  );
  const hasInspirationOrNotes = matchedResearch.some(r =>
    ['inspiration', 'knowledge', 'notes', 'learning', 'curation', 'breakdown', 'case study'].includes(r)
  );

  if (hasSaveBehavior) score += 20;
  if (hasContentResearch) score += 15;
  if (hasHooksOrFrameworks) score += 10;
  if (hasInspirationOrNotes) score += 10;

  // 6. Niche Matching
  const nicheKeywords = campaign?.niche_keywords?.length ? campaign.niche_keywords : NICHE_KEYWORDS;
  for (const n of nicheKeywords) {
    if (textToScan.includes(n.toLowerCase())) {
      if (!matchedNiches.includes(n)) {
        matchedNiches.push(n);
      }
    }
  }

  const hasAINiche = matchedNiches.some(n =>
    ['ai', 'artificial intelligence', 'generative ai', 'chatgpt', 'claude', 'automation', 'saas', 'software', 'technology', 'developer'].includes(n)
  );
  const hasMarketingNiche = matchedNiches.some(n =>
    ['marketing', 'growth', 'sales', 'content marketing', 'creator economy'].includes(n)
  );
  const hasStartupNiche = matchedNiches.some(n =>
    ['startup', 'startups', 'founder', 'entrepreneurship', 'business', 'b2b'].includes(n)
  );
  const hasDesignOrProduct = matchedNiches.some(n =>
    ['ux', 'ui', 'design', 'product', 'product management', 'copywriting', 'branding'].includes(n)
  );
  const hasProductivityOrEducation = matchedNiches.some(n =>
    ['productivity', 'career', 'leadership', 'education', 'writing', 'newsletter'].includes(n)
  );

  if (hasAINiche) score += 15;
  else if (hasMarketingNiche) score += 15;
  else if (hasStartupNiche) score += 15;
  else if (hasDesignOrProduct) score += 12;
  else if (hasProductivityOrEducation) score += 10;
  else if (matchedNiches.length > 0) score += 8;

  // 7. Business Signal
  if (textToScan.includes('agency')) score += 10;
  if (textToScan.includes('consultant') || textToScan.includes('consulting')) score += 10;
  if (textToScan.includes('newsletter') || textToScan.includes('substack')) score += 10;
  if (textToScan.includes('course') || textToScan.includes('digital product') || textToScan.includes('gumroad')) score += 10;

  // 8. Profile Quality Baseline
  if (bio.length >= 25) score += 5;
  if (postsCount >= 10) score += 5;
  if (followers >= 1000 && followers <= 20000) score += 5;

  // Hard penalty if it was flagged with negative keywords
  if (matchedNegative.length > 0) {
    score -= matchedNegative.length * 10;
  }

  // 9. Tier Assignment & Critical Qualification Rule
  // Critical Rule: A profile must satisfy at least 1 role signal AND 1 research/behavior signal AND 1 niche/business signal
  const roleCount = matchedRoles.length;
  const researchCount = matchedResearch.length;
  const nicheCount = matchedNiches.length;

  let tier: LeadTier = 'Disqualified';
  let isQualified = false;

  // Tier A: Creator-operators with research behavior and active niche
  if (score >= 50 && roleCount >= 1 && researchCount >= 1 && (nicheCount >= 1 || hasFounderRole)) {
    tier = 'Tier A';
    isQualified = true;
  } else if (score >= 35 && (roleCount >= 1 || nicheCount >= 1) && (researchCount >= 1 || hasSaveBehavior)) {
    // Tier B: High-value knowledge creators
    tier = 'Tier B';
    isQualified = true;
  } else if (score >= 25 && researchCount >= 1) {
    // Tier C: Niche experts with explicit research or save language
    tier = 'Tier C';
    isQualified = true;
  } else {
    tier = 'Disqualified';
    isQualified = false;
  }

  // Formulate Human-readable Qualification Reason
  const formatFollowers = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const reasonParts: string[] = [];
  if (matchedRoles.length > 0) {
    reasonParts.push(capitalizeWords(matchedRoles[0]));
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
    rejectionReason: isQualified ? undefined : `Low score (${score}) or missing role/research/niche intersection`
  };
}

function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
