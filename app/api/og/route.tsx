import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Dynamic params
    const title = searchParams.get('title') || 'Tolongin.co';
    const subtitle = searchParams.get('subtitle') || 'Real-Performance Hiring Platform';
    const type = searchParams.get('type') || 'Challenge'; // Challenge or Profile
    
    // Background and accent colors
    const isProfile = type === 'Profile';
    const accentColor = isProfile ? '#3b82f6' : '#10b981'; // Blue for profile, Emerald for challenge

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundColor: '#09090b',
            padding: '80px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Top subtle gradient */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '10px',
              background: `linear-gradient(90deg, ${accentColor}, #8b5cf6)`,
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '32px',
                fontWeight: 'bold',
                marginRight: '20px',
              }}
            >
              T
            </div>
            <span style={{ fontSize: '36px', color: '#a1a1aa', fontWeight: 600 }}>
              Tolongin.co
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                textTransform: 'uppercase',
                color: accentColor,
                fontWeight: 800,
                letterSpacing: '2px',
              }}
            >
              {type}
            </div>
            <div
              style={{
                fontSize: '72px',
                fontWeight: 900,
                color: '#ffffff',
                lineHeight: 1.1,
                maxWidth: '900px',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: '36px',
                color: '#a1a1aa',
                marginTop: '20px',
                maxWidth: '900px',
              }}
            >
              {subtitle}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
