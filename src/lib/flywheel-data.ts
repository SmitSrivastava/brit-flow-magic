export type Stage = {
  id: string;
  num: number;
  title: string;
  subtitle: string;
  inputs: { group: string; items: string[] }[];
  output: string;
};

export type Wheel = {
  id: "britgpt" | "creative" | "aeo";
  name: string;
  tagline: string;
  color: string;
  stages: Stage[];
};

export const britgpt: Wheel = {
  id: "britgpt",
  name: "BritGPT Flywheel",
  tagline: "Core intelligence engine",
  color: "var(--britgpt)",
  stages: [
    {
      id: "bg1", num: 1, title: "Detect Market Shifts",
      subtitle: "Cultural · Search · Influencers · Commerce",
      inputs: [
        { group: "Social Listening", items: ["Instagram", "Reddit", "X / Twitter", "YouTube comments", "Forums & communities"] },
        { group: "Search & Discovery", items: ["Google Search trends", "Amazon search trends", "YouTube search behaviour", "Quick commerce search"] },
        { group: "Consumer Conversation", items: ["Influencer narratives", "Recipe trends", "Food creator themes", "Health & wellness discourse"] },
        { group: "Commerce Signals", items: ["Product reviews", "Ratings sentiment", "Basket combinations", "Emerging category demand"] },
        { group: "Competitive Signals", items: ["Competitor launches", "Messaging themes", "Campaign narratives", "Shelf visibility shifts"] },
        { group: "AEO / GEO Signals", items: ["AI answer visibility", "Generative search mentions", "Prompt recommendation trends", "Discoverability in ChatGPT/Gemini/Perplexity"] },
      ],
      output: "Emerging consumer shifts, category narratives, unmet demand spaces, and reputation signals.",
    },
    {
      id: "bg2", num: 2, title: "Connect to Consumers",
      subtitle: "Relevant cohorts · Salesforce FPD",
      inputs: [
        { group: "Salesforce FPD", items: ["CRM behaviour", "Purchase history", "Campaign engagement", "Loyalty participation"] },
        { group: "Audience Intelligence", items: ["Affinity clusters", "Lifestyle cohorts", "Nutrition-conscious users", "Family-led buyers"] },
        { group: "Behavioural Signals", items: ["Repeat behaviour", "Content engagement", "Cross-brand consumption", "Lapsed vs active users"] },
        { group: "Identity Resolution", items: ["Unified consumer profiles", "Cross-channel identity stitching"] },
      ],
      output: "High-propensity cohorts, exposed audiences, and consumer segments most impacted by the trend.",
    },
    {
      id: "bg3", num: 3, title: "Connect to Commerce",
      subtitle: "SKU visibility · Channel demand",
      inputs: [
        { group: "1DS Commerce Intelligence", items: ["SKU visibility", "Shelf share", "Organic ranking", "Availability / OOS"] },
        { group: "Quick Commerce", items: ["Search placement", "Discovery journeys", "Conversion trends", "Pack preference"] },
        { group: "Retail & Market", items: ["Regional demand", "Basket associations", "Competitor placement", "Assortment gaps"] },
        { group: "Channel Performance", items: ["D2C", "Modern trade", "Ecommerce", "Quick commerce"] },
      ],
      output: "Where Britannia is winning, losing, under-indexed, or missing conversion opportunities.",
    },
    {
      id: "bg4", num: 4, title: "Activate",
      subtitle: "CRM · Paid Media · Commerce Ops",
      inputs: [
        { group: "Audience Intelligence", items: ["Salesforce cohorts"] },
        { group: "Commerce Priorities", items: ["1DS insights"] },
        { group: "Creative Studio", items: ["AI-generated creatives", "Dynamic content variants", "Packaging creatives", "Commerce banners", "Platform-specific adaptations"] },
        { group: "Channel Systems", items: ["Salesforce Marketing Cloud", "Meta", "Google / DV360", "Ecommerce media", "CRM journeys"] },
      ],
      output: "Personalized campaigns, dynamic creatives, CRM journeys, commerce optimization, and media activation.",
    },
    {
      id: "bg5", num: 5, title: "Measure Impact",
      subtitle: "Conversion · Engagement · Lift",
      inputs: [
        { group: "Media Performance", items: ["CTR", "Engagement", "Reach"] },
        { group: "CRM Performance", items: ["Open rate", "Repeat behaviour", "Journey completion"] },
        { group: "Commerce Performance", items: ["Conversion", "SKU uplift", "Visibility improvement"] },
        { group: "Brand Signals", items: ["Sentiment shifts", "Share of conversation", "Search lift"] },
      ],
      output: "What drove engagement, conversion, repeat behaviour, and brand lift.",
    },
    {
      id: "bg6", num: 6, title: "Learn & Refine",
      subtitle: "Validate trends & cohorts",
      inputs: [
        { group: "Winning Cohorts", items: ["High-converting audiences", "High-LTV segments"] },
        { group: "Winning Creatives", items: ["Top-performing narratives", "Best-performing formats", "High-engagement messaging"] },
        { group: "Winning Commerce", items: ["High-converting SKUs", "Best-performing channels"] },
        { group: "AEO / GEO Learning", items: ["Prompt discoverability", "AI recommendation visibility", "Answer engine presence"] },
      ],
      output: "Smarter targeting, refined narratives, optimized creatives, and stronger future recommendations.",
    },
  ],
};

export const creative: Wheel = {
  id: "creative",
  name: "Creative Studio Flywheel",
  tagline: "Ingests context · Generates · Learns",
  color: "var(--creative)",
  stages: [
    {
      id: "cs1", num: 1, title: "Ingest Context",
      subtitle: "Trend · Audience · Commerce · Brand",
      inputs: [
        { group: "From BritGPT", items: ["Trend narratives", "Audience cohorts (Salesforce)", "Commerce priorities (1DS)"] },
        { group: "Brand Inputs", items: ["Campaign briefs", "Brand guidelines", "Historical creatives", "Platform specifications"] },
      ],
      output: "Creative intelligence context for campaign generation.",
    },
    {
      id: "cs2", num: 2, title: "Generate Creative",
      subtitle: "Multi-platform AI variants",
      inputs: [
        { group: "Generates", items: ["Static creatives", "Social creatives", "Commerce banners", "CRM creatives", "Packaging concepts", "Dynamic content variants", "Video adaptations", "Platform-specific assets"] },
      ],
      output: "AI-generated multi-platform creative variants.",
    },
    {
      id: "cs3", num: 3, title: "Activate (→ BritGPT)",
      subtitle: "Deploys via BritGPT activation",
      inputs: [
        { group: "Channels", items: ["CRM", "Paid media", "Commerce", "Social", "Retail media", "Quick commerce"] },
      ],
      output: "Live campaign deployment across channels.",
    },
    {
      id: "cs4", num: 4, title: "Measure Performance (→ BritGPT)",
      subtitle: "Creative-level performance signals",
      inputs: [
        { group: "Metrics", items: ["CTR", "Engagement", "View-through", "Commerce conversion", "Scroll-stop rate", "Creative fatigue", "Repeat interaction", "Platform-level performance"] },
      ],
      output: "Performance signals across creative formats, messages, and audiences.",
    },
    {
      id: "cs5", num: 5, title: "Learn Creative Intelligence",
      subtitle: "The most important box",
      inputs: [
        { group: "Learns", items: ["Which narratives perform best", "Which visual styles drive engagement", "Which creators / formats resonate", "Which CTAs convert better", "Which audiences respond to which messaging", "Which commerce creatives drive conversion"] },
      ],
      output: "Refined creative recommendations and smarter future generation.",
    },
    {
      id: "cs6", num: 6, title: "Refine & Regenerate",
      subtitle: "Smarter prompt generation",
      inputs: [
        { group: "Uses learning to", items: ["Improve prompts", "Improve creative selection", "Improve personalization", "Reduce low-performing variants", "Generate stronger future creatives"] },
      ],
      output: "Continuously improving AI-powered creative ecosystem.",
    },
  ],
};

export const aeo: Wheel = {
  id: "aeo",
  name: "AEO / GEO Flywheel",
  tagline: "Discovery · Visibility · Answer engines",
  color: "var(--aeo)",
  stages: [
    {
      id: "ae1", num: 1, title: "Detect Discovery & Narrative Shifts",
      subtitle: "Consumer intent & discovery signals",
      inputs: [
        { group: "Signals", items: ["Search behaviour", "AI prompt trends", "Social conversations", "Influencer narratives", "Commerce discovery behaviour", "Reviews & forums", "BritGPT trend signals"] },
      ],
      output: "Emerging consumer questions, discovery trends, narrative opportunities, AI/search visibility gaps, content demand themes.",
    },
    {
      id: "ae2", num: 2, title: "Connect to Consumers & Commerce",
      subtitle: "Map intent to cohorts & SKUs",
      inputs: [
        { group: "Consumer", items: ["Salesforce FPD", "Cohort behaviour", "Engagement signals"] },
        { group: "Commerce", items: ["1DS commerce intelligence", "SKU visibility", "Conversion patterns", "Channel performance"] },
      ],
      output: "High-intent cohorts, audience opportunity mapping, commerce gaps, under-indexed SKUs, conversion opportunities.",
    },
    {
      id: "ae3", num: 3, title: "Generate Creative & Content",
      subtitle: "AI-prompt optimized content",
      inputs: [
        { group: "Inputs", items: ["Trend narratives", "Audience intelligence", "Commerce priorities", "AEO / GEO learnings", "Brand guidelines", "Historical creatives", "Campaign objectives"] },
      ],
      output: "Paid media, CRM, commerce creatives, AI/search optimized content, dynamic variants, platform-ready assets.",
    },
    {
      id: "ae4", num: 4, title: "Activate Across Discovery Ecosystem",
      subtitle: "Push to search & answer engines",
      inputs: [
        { group: "Inputs", items: ["Creative assets", "Audience cohorts", "Commerce priorities", "AI/search optimization signals", "Channel strategies"] },
      ],
      output: "Personalized campaigns, CRM journeys, commerce optimization, AI/search discoverability, cross-channel activation.",
    },
    {
      id: "ae5", num: 5, title: "Measure Engagement, Conversion & Discoverability",
      subtitle: "Track search/AI lift",
      inputs: [
        { group: "Metrics", items: ["Engagement", "Conversion", "Commerce performance", "Search visibility", "AI answer visibility", "Recommendation presence", "Sentiment signals"] },
      ],
      output: "Creative performance insights, discoverability intelligence, channel effectiveness, AI visibility insights, reputation signals.",
    },
    {
      id: "ae6", num: 6, title: "Learn & Refine Intelligence",
      subtitle: "Improve prompts & narratives",
      inputs: [
        { group: "Inputs", items: ["Winning creatives", "High-performing narratives", "Audience response patterns", "AI/search learnings", "Commerce learnings", "Conversion insights"] },
      ],
      output: "Smarter future creatives, better narrative optimization, improved discoverability, refined audience targeting, optimized commerce strategies.",
    },
  ],
};

export const wheels: Wheel[] = [britgpt, creative, aeo];

export const interlinks = [
  { from: "creative", to: "britgpt", label: "Creative variants → Activate" },
  { from: "britgpt", to: "creative", label: "Trend & audience context" },
  { from: "aeo", to: "britgpt", label: "Discovery signals" },
  { from: "britgpt", to: "aeo", label: "Trend signals & cohorts" },
];
