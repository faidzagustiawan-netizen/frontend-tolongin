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
    // Endpoint challenge sekarang berhalaman (default 24, maksimal 100 per
    // permintaan), jadi sitemap harus menelusuri seluruh halaman. Sebelumnya
    // satu permintaan mengembalikan seisi direktori.
    const PAGE_SIZE = 100;
    const MAX_PAGES = 50; // pagar pengaman: maksimal 5000 URL challenge
    const challenges: any[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const result = await challengesService.getAll({ page, limit: PAGE_SIZE });
      challenges.push(...result.data);

      if (challenges.length >= result.total || result.data.length < PAGE_SIZE) {
        break;
      }
    }

    const challengeRoutes: MetadataRoute.Sitemap = challenges.map(
      (challenge: any) => ({
        url: `${baseUrl}/challenges/${challenge.slug}`,
        lastModified: new Date(challenge.updatedAt || challenge.createdAt || Date.now()),
        // Harus berupa literal, bukan string lebar, agar cocok dengan tipe
        // MetadataRoute.Sitemap milik Next.
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }),
    );

    return [...routes, ...challengeRoutes];
  } catch (error) {
    console.error('Error generating sitemap for challenges', error);
    return routes;
  }
}
