import { Metadata, ResolvingMetadata } from 'next';
import ChallengeClient from './ChallengeClient';
import { challengesService } from '../../../services/challenges.service';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  try {
    const { data: challenge } = await challengesService.getOne(slug);
    
    return {
      title: `${challenge.title} | Tolongin.co`,
      description: challenge.summary || (challenge.description ? challenge.description.substring(0, 160) : ''),
      openGraph: {
        title: `${challenge.title} | Tolongin.co`,
        description: challenge.summary,
        url: `https://tolongin.co/challenges/${slug}`,
        images: [
          {
            url: `https://tolongin.co/api/og?title=${encodeURIComponent(challenge.title)}&subtitle=${encodeURIComponent(challenge.company?.companyName || 'Hiring Challenge')}&type=Challenge`,
            width: 1200,
            height: 630,
            alt: challenge.title,
          }
        ],
        type: 'website',
      },
    };
  } catch (e) {
    return {
      title: "Challenge | Tolongin.co"
    };
  }
}

export default async function ChallengePage({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  let initialChallenge = null;
  
  try {
    const { data } = await challengesService.getOne(slug);
    initialChallenge = data;
  } catch (e) {
    // Client akan menangani error state (misalnya 404)
  }

  return <ChallengeClient slug={slug} initialChallenge={initialChallenge} />;
}
