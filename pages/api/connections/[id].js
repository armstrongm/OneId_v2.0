// pages/api/connections/[id].js - COMPREHENSIVE UPDATE API
import { getConnection, updateConnection } from '../../../lib/simple-connections';

export default async function handler(req, res) {
  const { method, query: { id } } = req;

  console.log(`API Call: ${method} /api/connections/${id}`);
  console.log('Request body:', req.body);

  try {
    if (method === 'GET') {
      const connection = getConnection(id);
      if (!connection) {
        console.log(`GET: Connection not found: ${id}`);
        return res.status(404).json({ error: 'Connection not found' });
      }
      console.log(`GET: Returning connection: ${connection.name}`);
      return res.status(200).json(connection);
    }

    if (method === 'PUT') {
      console.log('PUT: Request body:', req.body);
      
      if (!req.body) {
        return res.status(400).json({ error: 'Request body required' });
      }

      // Validate PingOne specific fields
      if (req.body.type === 'PINGONE' || req.body.environmentId) {
        const { environmentId, clientId, region } = req.body;
        
        // Validate Environment ID format (UUID)
        if (environmentId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(environmentId)) {
          return res.status(400).json({ 
            error: 'Invalid Environment ID format. Must be a valid UUID.' 
          });
        }

        // Validate Client ID format (UUID)
        if (clientId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) {
          return res.status(400).json({ 
            error: 'Invalid Client ID format. Must be a valid UUID.' 
          });
        }

        // Validate region
        if (region && !['NA', 'EU', 'APAC'].includes(region)) {
          return res.status(400).json({ 
            error: 'Invalid region. Must be NA, EU, or APAC.' 
          });
        }

        // Validate import URLs if provided
        if (req.body.userImportUrl) {
          try {
            new URL(req.body.userImportUrl);
          } catch (e) {
            return res.status(400).json({ 
              error: 'Invalid user import URL format.' 
            });
          }
        }

        if (req.body.groupImportUrl) {
          try {
            new URL(req.body.groupImportUrl);
          } catch (e) {
            return res.status(400).json({ 
              error: 'Invalid group import URL format.' 
            });
          }
        }

        // Validate attribute mappings
        if (req.body.attributeMappings && Array.isArray(req.body.attributeMappings)) {
          for (let i = 0; i < req.body.attributeMappings.length; i++) {
            const mapping = req.body.attributeMappings[i];
            
            if (!mapping.source || !mapping.destination) {
              return res.status(400).json({ 
                error: `Attribute mapping ${i + 1}: Source and destination fields are required.` 
              });
            }

            // Validate regex if provided
            if (mapping.transform) {
              try {
                new RegExp(mapping.transform);
              } catch (e) {
                return res.status(400).json({ 
                  error: `Attribute mapping ${i + 1}: Invalid regex pattern in transform field.` 
                });
              }
            }
          }
        }

        // Validate sync interval
        if (req.body.syncInterval !== undefined) {
          const interval = parseInt(req.body.syncInterval);
          if (isNaN(interval) || interval < 5 || interval > 1440) {
            return res.status(400).json({ 
              error: 'Sync interval must be between 5 and 1440 minutes.' 
            });
          }
        }
      }

      const updatedConnection = updateConnection(id, req.body);
      if (!updatedConnection) {
        console.log(`PUT: Connection not found: ${id}`);
        return res.status(404).json({ error: 'Connection not found' });
      }
      
      console.log(`PUT: Successfully updated connection: ${id}`);
      return res.status(200).json(updatedConnection);
    }

    if (method === 'DELETE') {
      const { deleteConnection } = await import('../../../lib/simple-connections');
      const deleted = deleteConnection(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Connection not found' });
      }
      
      console.log(`DELETE: Successfully deleted connection: ${id}`);
      return res.status(200).json({ message: 'Connection deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error(`API Error for ${method} ${id}:`, error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}