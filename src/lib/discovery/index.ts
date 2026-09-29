import { InstagramDiscoveryProvider } from './provider.interface';
import { ApifyInstagramProvider } from './apify-provider';
import { MockInstagramProvider } from './mock-provider';

export function getDiscoveryProvider(forceMock: boolean = false): InstagramDiscoveryProvider {
  const token = process.env.APIFY_API_TOKEN;

  if (!forceMock && token && token.trim().length > 10) {
    return new ApifyInstagramProvider();
  }

  return new MockInstagramProvider();
}

export * from './provider.interface';
export * from './apify-provider';
export * from './mock-provider';
