// Mapping between database tier values and frontend display values
export type DatabaseTier = 'free' | 'tier1' | 'tier2' | 'tier3';
export type FrontendTier = 'free' | 'supporter' | 'pro' | 'enterprise';

// Map database tier to frontend tier
export function mapDatabaseTierToFrontend(dbTier: DatabaseTier): FrontendTier {
  switch (dbTier) {
    case 'free':
      return 'free';
    case 'tier1':
      return 'supporter';
    case 'tier2':
      return 'pro';
    case 'tier3':
      return 'enterprise';
    default:
      return 'free';
  }
}

// Map frontend tier to database tier
export function mapFrontendTierToDatabase(frontendTier: FrontendTier): DatabaseTier {
  switch (frontendTier) {
    case 'free':
      return 'free';
    case 'supporter':
      return 'tier1';
    case 'pro':
      return 'tier2';
    case 'enterprise':
      return 'tier3';
    default:
      return 'free';
  }
}

// Get tier display name
export function getTierDisplayName(tier: DatabaseTier | FrontendTier): string {
  const frontendTier = tier.startsWith('tier') ? mapDatabaseTierToFrontend(tier as DatabaseTier) : tier as FrontendTier;
  
  switch (frontendTier) {
    case 'free':
      return 'Free Account';
    case 'supporter':
      return 'Supporter';
    case 'pro':
      return 'Pro';
    case 'enterprise':
      return 'Enterprise';
    default:
      return 'Free Account';
  }
}

// Get tier description
export function getTierDescription(tier: DatabaseTier | FrontendTier): string {
  const frontendTier = tier.startsWith('tier') ? mapDatabaseTierToFrontend(tier as DatabaseTier) : tier as FrontendTier;
  
  switch (frontendTier) {
    case 'free':
      return 'Basic features and community access';
    case 'supporter':
      return 'Enhanced features and exclusive content';
    case 'pro':
      return 'Advanced features with Proxihub and Mission Control';
    case 'enterprise':
      return 'Ultimate space enthusiast experience';
    default:
      return 'Basic features and community access';
  }
}

// Check if tier is paid
export function isPaidTier(tier: DatabaseTier | FrontendTier): boolean {
  const frontendTier = tier.startsWith('tier') ? mapDatabaseTierToFrontend(tier as DatabaseTier) : tier as FrontendTier;
  return frontendTier !== 'free';
}
