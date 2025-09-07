// pages/api/connections/[id]/preview.js - BACKEND PROXY FOR USER DATA
import { getConnection } from '../../../../lib/simple-connections';

export default async function handler(req, res) {
  const { method, query: { id } } = req;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log(`Preview request for connection: ${id}`);
    
    // Get the connection configuration
    const connection = getConnection(id);
    if (!connection) {
      return res.status(404).json({ 
        error: 'Connection not found',
        connectionId: id
      });
    }

    // Check if user import is enabled
    if (!connection.enableUserImport) {
      return res.status(400).json({
        error: 'User import is not enabled for this connection',
        suggestion: 'Please enable user import in the connection settings to preview data.'
      });
    }

    // Check if User Import URL is configured
    if (!connection.userImportUrl) {
      return res.status(400).json({
        error: 'No User Import API URL configured',
        suggestion: 'Please set the User Import API URL in the connection settings.'
      });
    }

    console.log(`Fetching user data from: ${connection.userImportUrl}`);

    // Make the API request from the server (no CORS issues)
    const response = await fetch(connection.userImportUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'PingOne-Connector/1.0'
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${response.statusText}`);
      
      return res.status(response.status).json({
        error: `API responded with status ${response.status}: ${response.statusText}`,
        details: errorText,
        apiUrl: connection.userImportUrl,
        suggestion: 'Please check that the API endpoint is accessible and returns valid JSON data.'
      });
    }

    // Parse the response
    let userData;
    try {
      userData = await response.json();
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      return res.status(500).json({
        error: 'API response is not valid JSON',
        suggestion: 'Please ensure your API returns valid JSON data.'
      });
    }

    // Process the response based on common API formats
    let users = [];
    let totalUsers = 0;
    
    if (Array.isArray(userData)) {
      users = userData.slice(0, 10); // Show first 10 users
      totalUsers = userData.length;
    } else if (userData.data && Array.isArray(userData.data)) {
      users = userData.data.slice(0, 10);
      totalUsers = userData.total || userData.count || userData.data.length;
    } else if (userData.users && Array.isArray(userData.users)) {
      users = userData.users.slice(0, 10);
      totalUsers = userData.totalCount || userData.total || userData.users.length;
    } else if (userData.results && Array.isArray(userData.results)) {
      users = userData.results.slice(0, 10);
      totalUsers = userData.totalResults || userData.total || userData.results.length;
    } else {
      return res.status(400).json({
        error: 'Unexpected API response format',
        details: 'Expected an array or object with data/users/results array',
        receivedKeys: Object.keys(userData),
        suggestion: 'Please ensure your API returns data in a supported format.'
      });
    }

    console.log(`Successfully fetched ${users.length} users out of ${totalUsers} total`);

    // Return the processed data
    return res.status(200).json({
      success: true,
      users: users,
      totalUsers: totalUsers,
      sampleSize: users.length,
      apiUrl: connection.userImportUrl,
      lastSync: new Date().toISOString(),
      connection: {
        id: connection.id,
        name: connection.name
      }
    });

  } catch (error) {
    console.error('Preview error:', error);
    
    // Handle specific error types
    if (error.name === 'TimeoutError') {
      return res.status(408).json({
        error: 'Request timeout',
        details: 'The API request took too long to respond (>10 seconds)',
        suggestion: 'Please check if the API endpoint is responsive.'
      });
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Unable to connect to API',
        details: `Network error: ${error.message}`,
        suggestion: 'Please check that the API URL is correct and the service is running.'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      suggestion: 'Please try again or contact support if the issue persists.'
    });
  }
}