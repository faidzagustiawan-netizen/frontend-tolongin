const axios = require('axios');

const API = 'http://localhost:3001/api/v1';

async function run() {
  console.log('--- Starting Integration Test ---');
  try {
    const timestamp = Date.now();
    
    // 1. Register a Company
    console.log('[1] Registering Company...');
    const regRes = await axios.post(`${API}/auth/register`, {
      email: `company_${timestamp}@test.com`,
      password: 'password123',
      role: 'COMPANY',
      companyName: 'Tech Innovations ' + timestamp,
      industry: 'Software',
      subscriptionTier: 'KONGLOMERAT'
    });
    const companyToken = regRes.data.accessToken;
    const companyId = regRes.data.user.id;
    console.log('Company registered. Verified:', regRes.data.user.isVerified);
    
    // 2. Register Talent
    console.log('[2] Registering Talent...');
    const talRes = await axios.post(`${API}/auth/register`, {
      email: `talent_${timestamp}@test.com`,
      password: 'password123',
      role: 'TALENT',
      fullName: 'John Doe'
    });
    const talentToken = talRes.data.accessToken;
    console.log('Talent registered.');

    // 3. Create Challenge
    console.log('[3] Creating Challenge...');
    try {
      const challengeRes = await axios.post(`${API}/challenges`, {
        title: 'Backend Node Challenge',
        description: 'Test Challenge',
        difficulty: 'BEGINNER',
        
        
        summary: 'summary', category: 'BACKEND'
      }, {
        headers: { Authorization: `Bearer ${companyToken}` }
      });
      console.log('Challenge Response:', challengeRes.data);
    } catch (e) {
      console.log('Challenge creation failed:', e.response?.data?.message || e.message);
    }
    
    // 4. Test Fetch Profile (to check if companyId is resolved correctly)
    console.log('[4] Fetching Profile Stats...');
    try {
      const statsRes = await axios.get(`${API}/workspace/challenge-stats`, {
        headers: { Authorization: `Bearer ${companyToken}` }
      });
      console.log('Company stats returned:', statsRes.data);
    } catch (e) {
      console.log('Stats fetch failed:', e.response?.data?.message || e.message);
    }
    
    console.log('--- Integration Test Finished ---');
  } catch (error) {
    console.error('Test Failed!', error.response?.data || error.message);
  }
}

run();
