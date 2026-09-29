import { RawInstagramProfile } from '@/types';
import { DiscoverySearchOptions, InstagramDiscoveryProvider, ProviderUsage } from './provider.interface';

export class MockInstagramProvider implements InstagramDiscoveryProvider {
  id = 'sandbox-mock';
  name = 'Built-in Sandbox / Test Provider ($0 Cost)';
  isMock = true;

  private mockCatalog: RawInstagramProfile[] = [
    {
      username: 'elena.contentlab',
      fullName: 'Elena Vance | Content Strategist',
      biography: 'Content strategist for B2B & SaaS founders. Turning complex software into high-converting Reels. Save this post for your content calendar framework. 💡 Weekly newsletter below.',
      followersCount: 8420,
      followsCount: 420,
      postsCount: 148,
      profilePicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      isVerified: false,
      isPrivate: false,
      isBusinessAccount: true,
      businessCategoryName: 'Digital Creator',
      externalUrl: 'https://contentlab.substack.com',
      latestPostsCaptions: [
        'Save this reel: 7 viral hooks that work in any niche. Swipe file included in bio.',
        'The exact 4-step content research system I use to plan 30 days of posts in 2 hours.'
      ]
    },
    {
      username: 'marcus_builds',
      fullName: 'Marcus Sterling | Solopreneur',
      biography: 'Solo founder building AI micro-tools. Sharing breakdowns, frameworks, and revenue learnings. Bookmark this for your next launch. 🚀',
      followersCount: 12450,
      followsCount: 310,
      postsCount: 92,
      profilePicUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
      isVerified: false,
      isPrivate: false,
      isBusinessAccount: true,
      businessCategoryName: 'Entrepreneur',
      externalUrl: 'https://marcusbuilds.com',
      latestPostsCaptions: [
        'How I automated my competitor research using ChatGPT + Claude workflows. Save this reel for reference.',
        'Case study: 0 to $10k MRR without paying for ads.'
      ]
    },
    {
      username: 'sarah.growthops',
      fullName: 'Sarah Chen ⚡ UGC & Social Media Strategist',
      biography: 'Helping brands 10x organic reach. UGC creator & social media strategist. Come back to this reel when writing your next script. Free hook templates in bio!',
      followersCount: 5620,
      followsCount: 512,
      postsCount: 215,
      profilePicUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
      isVerified: false,
      isPrivate: false,
      isBusinessAccount: true,
      businessCategoryName: 'Creator Educator',
      externalUrl: 'https://sarahgrowth.bio',
      latestPostsCaptions: [
        'Save this post: 5 short-form script templates that retain 80%+ viewers.',
        'My creative research routine before filming any client Reel.'
      ]
    },
    {
      username: 'ai_workflow_guy',
      fullName: 'David K. | AI & Automation Educator',
      biography: 'Demystifying generative AI & productivity tools. Save this reel to test these 3 ChatGPT prompts later. 🤖 Prompt engineering & workflow breakdowns.',
      followersCount: 16800,
      followsCount: 180,
      postsCount: 174,
      profilePicUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
      isVerified: false,
      isPrivate: false,
      isBusinessAccount: true,
      businessCategoryName: 'Education',
      externalUrl: 'https://aiworkplace.kit.com',
      latestPostsCaptions: [
        'Save this reel: the ultimate prompt swipe file for research and summarization.',
        'Why your saved folder is full of AI tools you never actually open.'
      ]
    },
    {
      username: 'clara_copywriting',
      fullName: 'Clara Moss | Copywriter & Brand Strategist',
      biography: 'Direct response copywriter. Teaching personal brands how to write hooks that sell. Save this post for later when you need inspiration for your next offer.',
      followersCount: 4190,
      followsCount: 388,
      postsCount: 88,
      profilePicUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80',
      isVerified: false,
      isPrivate: false,
      isBusinessAccount: true,
      businessCategoryName: 'Consultant',
      externalUrl: 'https://claracopy.com',
      latestPostsCaptions: [
        'Steal this copywriting framework for your Instagram carousels.',
        'Swipe file breakdown: 3 ad hooks that printed $50k last month.'
      ]
    },
    {
      username: 'tech_product_notes',
      fullName: 'Liam Patel | UX & Product Management',
      biography: 'Product manager & UX designer sharing product teardowns, design systems, and productivity frameworks. Save this for your next sprint review.',
      followersCount: 7890,
      followsCount: 420,
      postsCount: 65,
      profilePicUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80',
      isVerified: false,
      isPrivate: false,
      isBusinessAccount: true,
      businessCategoryName: 'Designer',
      externalUrl: 'https://liampatel.design',
      latestPostsCaptions: [
        'Save this post: 10 UX audit questions every PM must ask.',
        'My design research system for gathering competitor references.'
      ]
    },
    {
      username: 'jordan_creator_economy',
      fullName: 'Jordan Diaz | Media Consultant',
      biography: 'Advising creators on monetization & media systems. Agency founder. Save this reel for your next sponsorship outreach pitch.',
      followersCount: 14200,
      followsCount: 690,
      postsCount: 130,
      profilePicUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80',
      isVerified: false,
      isPrivate: false,
      isBusinessAccount: true,
      businessCategoryName: 'Agency',
      externalUrl: 'https://diazagency.co',
      latestPostsCaptions: [
        'Creator monetization breakdown: what 50 creators made in Q3.',
        'Save this reel: the media kit framework that lands 4-figure deals.'
      ]
    },
    // Excluded / Negative examples that the pipeline should filter out
    {
      username: 'daily_laugh_memes',
      fullName: 'Daily Laughs & Viral Clips 😂',
      biography: 'Best memes on the internet! DM for promo or giveaway. Repost daily. Follow for comedy.',
      followersCount: 18500,
      followsCount: 45,
      postsCount: 1200,
      profilePicUrl: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=256&h=256&q=80',
      isVerified: false,
      isPrivate: false,
      isBusinessAccount: false,
      businessCategoryName: 'Entertainment',
      latestPostsCaptions: ['Tag a friend who does this 😂 #memes #viral #comedy']
    },
    {
      username: 'zendaya_fan_forever',
      fullName: 'Zendaya Updates & Fan Page',
      biography: 'Daily clips, red carpet looks, and fan edits for queen Zendaya! Not Zendaya.',
      followersCount: 14300,
      followsCount: 12,
      postsCount: 640,
      profilePicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
      isVerified: false,
      isPrivate: false,
      isBusinessAccount: false,
      businessCategoryName: 'Fan page',
      latestPostsCaptions: ['She looked stunning at the premiere! ❤️']
    },
    {
      username: 'inactive_ghost_user',
      fullName: 'Ghost',
      biography: 'Just vibes.',
      followersCount: 450, // under 1,000 follower threshold
      followsCount: 890,
      postsCount: 2,
      profilePicUrl: '',
      isVerified: false,
      isPrivate: false,
      isBusinessAccount: false,
      latestPostsCaptions: []
    }
  ];

  async searchProfiles(options: DiscoverySearchOptions): Promise<{
    profiles: RawInstagramProfile[];
    usage: ProviderUsage;
  }> {
    // Simulate brief network delay
    await new Promise(res => setTimeout(res, 500));

    const limit = Math.min(options.maxResults || 20, this.mockCatalog.length);
    const selected = this.mockCatalog.slice(0, limit);

    return {
      profiles: selected,
      usage: {
        computeUnits: 0,
        estimatedCostUsd: 0.0,
        providerRunId: `mock-run-${Date.now()}`
      }
    };
  }

  async getProfile(username: string): Promise<RawInstagramProfile | null> {
    return this.mockCatalog.find(p => p.username.toLowerCase() === username.toLowerCase()) || null;
  }

  async getRunUsage(providerRunId: string): Promise<ProviderUsage> {
    return {
      computeUnits: 0,
      estimatedCostUsd: 0.0,
      providerRunId
    };
  }
}
