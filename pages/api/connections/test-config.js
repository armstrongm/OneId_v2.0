// pages/api/connections/test-config.js - CLEAN VERSION WITH NO IMPORTS
export default async function handler(req, res) {
  console.log('=== CONNECTION TEST API ===');
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: 'Invalid request body',
        received: typeof req.body
      });
    }

    const { connectionId } = req.body;
    
    if (connectionId === 'pingone-default') {
      console.log('Testing PingOne connection...');
      
      // Replace with your actual client secret here
      const testData = {
        clientId: '725210fd-3e86-449e-b992-27621e50b76a',
        clientSecret: 'Q.wmkjguB7IikeuwV8eM2gi~Wirz9W5lWPNWqBxC2NVp4hDCSFVJJI1ma-wStdhn', // ← REPLACE THIS WITH YOUR REAL SECRET
        environmentId: '2d4508d9-b793-4564-bfa7-e22aac80cd72'
      };
      
      if (testData.clientSecret === 'PUT-YOUR-REAL-CLIENT-SECRET-HERE') {
        return res.status(400).json({
          success: false,
          message: 'Please update the API with your real PingOne client secret',
          error: 'placeholder_secret'
        });
      }
      
      // Test PingOne connection
      const tokenUrl = `https://auth.pingone.com/${testData.environmentId}/as/token`;
      const tokenParams = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'p1:read:user p1:read:environment'
      });
      const authHeader = Buffer.from(`${testData.clientId}:${testData.clientSecret}`).toString('base64');

      console.log('Making PingOne API request to:', tokenUrl);

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json'
        },
        body: tokenParams.toString()
      });

      const responseText = await response.text();
      console.log('PingOne response status:', response.status);
      console.log('PingOne response:', responseText);
      
      if (response.ok) {
        const tokenData = JSON.parse(responseText);
        console.log('✅ PingOne test successful');
        
        return res.status(200).json({
          success: true,
          message: 'PingOne connection test successful',
          details: {
            token_type: tokenData.token_type,
            expires_in: tokenData.expires_in,
            scope: tokenData.scope,
            server_response: 'Authentication successful'
          }
        });
      } else {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { error: responseText };
        }

        console.log('❌ PingOne test failed:', errorData);
        
        return res.status(400).json({
          success: false,
          message: 'PingOne connection test failed',
          error: errorData.error || 'Authentication failed',
          details: errorData
        });
      }
    } else {
      return res.status(400).json({
        error: 'Unknown connection ID',
        connectionId: connectionId
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}