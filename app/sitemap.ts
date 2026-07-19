import { MetadataRoute } from 'next';
import { challengesService } from '../services/challenges.service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://tolongin.co';

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/challenges`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    // Fetch all active challenges
    const { data: challenges } = await challengesService.getAll();
    
    const challengeRoutes = challenges.map((challenge: any) => ({
      url: `${baseUrl}/challenges/${challenge.slug}`, // using id as slug fallback
      lastModified: new Date(challenge.updatedAt || new Date()),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
    
    return [...routes, ...challengeRoutes];
  } catch (error) {
    console.error('Error generating sitemap for challenges', error);
    return routes;
  }
}
