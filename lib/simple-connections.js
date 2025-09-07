// lib/simple-connections.js - ENHANCED WITH FULL FEATURE SUPPORT
let connections = [
  {
    id: 'pingone-default',
    name: 'PingOne Connection', 
    type: 'PINGONE',
    clientId: '725210fd-3e86-449e-b992-27621e50b76a',
    clientSecret: 'Q.wmkjguB7IikeuwV8eM2gi~Wirz9W5lWPNWqBxC2NVp4hDCSFVJJI1ma-wStdhn', // Replace with real secret
    environmentId: '2d4508d9-b793-4564-bfa7-e22aac80cd72',
    region: 'NA',
    status: 'created',
    createdAt: new Date().toISOString(),
    lastTested: null,
    
    // Import Configuration
    enableUserImport: false,
    enableGroupImport: false,
    userImportUrl: '',
    groupImportUrl: '',
    syncInterval: 60,
    
    // Attribute Mappings
    attributeMappings: [
      { source: 'email', destination: 'email', transform: '', required: true },
      { source: 'first_name', destination: 'name.given', transform: '', required: true },
      { source: 'last_name', destination: 'name.family', transform: '', required: true },
      { source: 'username', destination: 'username', transform: '', required: true },
      { source: 'phone', destination: 'phoneNumbers[0].value', transform: 's/[^0-9]//g', required: false },
      { source: 'department', destination: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:department', transform: '', required: false }
    ]
  }
];

export function getAllConnections() {
  console.log('getAllConnections called, returning:', connections.length, 'connections');
  return connections.map(conn => ({
    ...conn,
    hasClientSecret: !!conn.clientSecret,
    clientSecret: conn.clientSecret ? '[SAVED]' : undefined
  }));
}

export function getConnection(id) {
  console.log(`Getting connection: ${id}`);
  const conn = connections.find(conn => conn.id === id);
  if (conn) {
    console.log(`Found connection: ${conn.name} (${conn.type})`);
    return {
      ...conn,
      clientSecret: conn.clientSecret ? '[SAVED]' : ''
    };
  }
  console.log(`Connection not found: ${id}`);
  return null;
}

export function updateConnection(id, data) {
  console.log(`Updating connection: ${id}`);
  console.log('Update data:', data);
  
  const index = connections.findIndex(conn => conn.id === id);
  if (index === -1) {
    console.log(`Connection not found for update: ${id}`);
    return null;
  }
  
  const existingConnection = connections[index];
  const updateData = { ...data };
  
  // Handle client secret properly
  if (updateData.clientSecret === '[SAVED]') {
    updateData.clientSecret = existingConnection.clientSecret;
  } else if (updateData.clientSecret === '') {
    updateData.clientSecret = existingConnection.clientSecret;
  }
  
  // Ensure attribute mappings are preserved if not provided
  if (!updateData.attributeMappings && existingConnection.attributeMappings) {
    updateData.attributeMappings = existingConnection.attributeMappings;
  }
  
  connections[index] = { 
    ...existingConnection, 
    ...updateData, 
    id: id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString() 
  };
  
  console.log('Updated connection:', connections[index]);
  return connections[index];
}

export function createConnection(data) {
  console.log('Creating connection:', data);
  const connection = {
    id: `conn-${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString(),
    status: 'created',
    
    // Default values for new connections
    enableUserImport: data.enableUserImport || false,
    enableGroupImport: data.enableGroupImport || false,
    userImportUrl: data.userImportUrl || '',
    groupImportUrl: data.groupImportUrl || '',
    syncInterval: data.syncInterval || 60,
    attributeMappings: data.attributeMappings || [
      { source: 'email', destination: 'email', transform: '', required: true },
      { source: 'first_name', destination: 'name.given', transform: '', required: true },
      { source: 'last_name', destination: 'name.family', transform: '', required: true },
      { source: 'username', destination: 'username', transform: '', required: true }
    ]
  };
  connections.push(connection);
  console.log('Created connection:', connection.id);
  return connection;
}

export function deleteConnection(id) {
  console.log(`Deleting connection: ${id}`);
  const index = connections.findIndex(conn => conn.id === id);
  if (index === -1) {
    console.log(`Connection not found for deletion: ${id}`);
    return false;
  }
  
  const deletedConnection = connections[index];
  connections.splice(index, 1);
  console.log(`Deleted connection: ${deletedConnection.name}`);
  return deletedConnection;
}

// Utility function to apply attribute transformations
export function applyAttributeTransform(value, transform) {
  if (!transform || !value) return value;
  
  try {
    // Handle simple regex substitution (s/pattern/replacement/flags)
    if (transform.startsWith('s/')) {
      const parts = transform.split('/');
      if (parts.length >= 3) {
        const pattern = parts[1];
        const replacement = parts[2] || '';
        const flags = parts[3] || '';
        return value.replace(new RegExp(pattern, flags), replacement);
      }
    }
    
    // Handle other transformation types here
    // For now, just return the original value for unknown transforms
    return value;
  } catch (error) {
    console.error('Error applying transform:', transform, error);
    return value;
  }
}

// Function to get mapped attributes for a user record
export function getMappedAttributes(userRecord, attributeMappings) {
  const mappedUser = {};
  
  for (const mapping of attributeMappings) {
    if (mapping.source && mapping.destination) {
      let value = userRecord[mapping.source];
      
      // Apply transformation if specified
      if (mapping.transform) {
        value = applyAttributeTransform(value, mapping.transform);
      }
      
      // Set the value in the mapped object
      // Handle nested paths like 'name.given'
      if (mapping.destination.includes('.')) {
        const paths = mapping.destination.split('.');
        let current = mappedUser;
        for (let i = 0; i < paths.length - 1; i++) {
          if (!current[paths[i]]) current[paths[i]] = {};
          current = current[paths[i]];
        }
        current[paths[paths.length - 1]] = value;
      } else {
        mappedUser[mapping.destination] = value;
      }
    }
  }
  
  return mappedUser;
}

// Debug function
export function debugConnections() {
  console.log('=== CONNECTION DEBUG ===');
  console.log('Total connections:', connections.length);
  connections.forEach((conn, index) => {
    console.log(`${index + 1}. ${conn.name} (${conn.id}) - Type: ${conn.type}`);
    console.log(`   Import enabled: Users=${conn.enableUserImport}, Groups=${conn.enableGroupImport}`);
    console.log(`   Mappings: ${conn.attributeMappings?.length || 0} configured`);
  });
  console.log('=== END DEBUG ===');
}