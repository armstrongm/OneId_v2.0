// pages/api/connections/[id]/test.js - New API endpoint for testing connections
import { getConnectionForTesting } from '../../../../lib/simple-connections';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  console.log(`=== TESTING CONNECTION: ${id} ===`);
  
  try {
    // Get the actual connection with real credentials for testing
    const connection = getConnectionForTesting(id);
    
    if (!connection) {
      console.log(`❌ Connection not found: ${id}`);
      return res.status(404).json({ error: 'Connection not found' });
    }
    
    console.log(`🔍 Testing connection: ${connection.name} (${connection.type})`);
    console.log(`🔑 Has client secret: ${!!connection.clientSecret}`);
    console.log(`📊 Client secret preview: ${connection.clientSecret ? connection.clientSecret.substring(0, 8) + '...' : 'NONE'}`);
    
    // Test the connection based on its type
    if (connection.type === 'PINGONE') {
      return await testPingOneConnection(connection, res);
    } else {
      return res.status(400).json({ 
        error: 'Unsupported connection type',
        type: connection.type 
      });
    }
    
  } catch (error) {
    console.error('❌ Connection test error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

async function testPingOneConnection(connection, res) {
  const { clientId, clientSecret, environmentId } = connection;
  
  console.log('🧪 Testing PingOne connection...');
  console.log(`📋 Client ID: ${clientId}`);
  console.log(`🔑 Client Secret Length: ${clientSecret ? clientSecret.length : 0}`);
  console.log(`🌍 Environment ID: ${environmentId}`);
  
  // Validate required fields
  if (!clientId || !clientSecret || !environmentId) {
    const missing = [];
    if (!clientId) missing.push('clientId');
    if (!clientSecret) missing.push('clientSecret');
    if (!environmentId) missing.push('environmentId');
    
    console.log(`❌ Missing required fields: ${missing.join(', ')}`);
    
    return res.status(400).json({
      success: false,
      error: 'Missing required PingOne credentials',
      missing: missing,
      details: {
        clientId: clientId ? 'PROVIDED' : 'MISSING',
        clientSecret: clientSecret ? 'PROVIDED' : 'MISSING',
        environmentId: environmentId ? 'PROVIDED' : 'MISSING'
      }
    });
  }
  
  // Check if still using placeholder
  if (clientSecret === 'your-actual-client-secret-here' || clientSecret === 'PUT-YOUR-REAL-CLIENT-SECRET-HERE') {
    console.log('❌ Still using placeholder client secret');
    
    return res.status(400).json({
      success: false,
      error: 'Placeholder client secret detected',
      message: 'Please update the connection with your real PingOne client secret',
      placeholder: clientSecret
    });
  }
  
  try {
    const tokenUrl = `https://auth.pingone.com/${environmentId}/as/token`;
    
    const tokenParams = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'p1:read:user p1:create:user p1:update:user p1:delete:user p1:read:environment p1:read:population p1:read:group'
    });

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    console.log(`🌐 Making request to: ${tokenUrl}`);

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
    console.log(`📡 PingOne response status: ${response.status}`);
    
    if (response.ok) {
      const tokenData = JSON.parse(responseText);
      console.log('✅ PingOne test successful!');
      
      return res.status(200).json({
        success: true,
        message: 'PingOne connection test successful',
        details: {
          access_token: 'RECEIVED',
          token_type: tokenData.token_type,
          expires_in: tokenData.expires_in,
          scope: tokenData.scope,
          server_response: 'Authentication successful'
        },
        tests: [{
          name: 'PingOne Authentication',
          success: true,
          message: 'Successfully authenticated with PingOne',
          details: {
            token_type: tokenData.token_type,
            expires_in: tokenData.expires_in,
            scope: tokenData.scope
          }
        }],
        timestamp: new Date().toISOString()
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
        details: errorData,
        tests: [{
          name: 'PingOne Authentication',
          success: false,
          message: errorData.error_description || 'Authentication failed',
          details: errorData
        }],
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ Network error during PingOne test:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Network error',
      message: 'Failed to connect to PingOne',
      details: error.message
    });
  }
}