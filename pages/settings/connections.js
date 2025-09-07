// pages/settings/connections.js - CARD-BASED WITH REAL PINGONE PREVIEW
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Plus, Trash2, TestTube, Edit, Download, Upload, Settings, X, Save, RefreshCw, Database, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function ConnectionsPage() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showSecrets, setShowSecrets] = useState({});
  const [previewData, setPreviewData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingConnections, setRefreshingConnections] = useState(new Set());

  // Mock user table metadata
  const userTableColumns = [
    { value: 'id', label: 'ID (Primary Key)', type: 'number' },
    { value: 'email', label: 'Email Address', type: 'string' },
    { value: 'username', label: 'Username', type: 'string' },
    { value: 'first_name', label: 'First Name', type: 'string' },
    { value: 'last_name', label: 'Last Name', type: 'string' },
    { value: 'full_name', label: 'Full Name', type: 'string' },
    { value: 'phone', label: 'Phone Number', type: 'string' },
    { value: 'mobile', label: 'Mobile Number', type: 'string' },
    { value: 'department', label: 'Department', type: 'string' },
    { value: 'title', label: 'Job Title', type: 'string' },
    { value: 'manager_id', label: 'Manager ID', type: 'number' },
    { value: 'office_location', label: 'Office Location', type: 'string' },
    { value: 'employee_id', label: 'Employee ID', type: 'string' },
    { value: 'hire_date', label: 'Hire Date', type: 'date' },
    { value: 'status', label: 'Employee Status', type: 'string' },
    { value: 'cost_center', label: 'Cost Center', type: 'string' },
    { value: 'division', label: 'Division', type: 'string' },
    { value: 'created_at', label: 'Created At', type: 'datetime' },
    { value: 'updated_at', label: 'Updated At', type: 'datetime' }
  ];

  // Default PingOne attribute mappings
  const defaultMappings = [
    { source: 'email', destination: 'email', transform: '', required: true },
    { source: 'first_name', destination: 'name.given', transform: '', required: true },
    { source: 'last_name', destination: 'name.family', transform: '', required: true },
    { source: 'username', destination: 'username', transform: '', required: true },
    { source: 'phone', destination: 'phoneNumbers[0].value', transform: 's/[^0-9]//g', required: false },
    { source: 'department', destination: 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:department', transform: '', required: false }
  ];

  // Fetch connections
  const fetchConnections = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/connections');
      const data = await response.json();
      
      let connectionsArray = [];
      if (Array.isArray(data)) {
        connectionsArray = data;
      } else if (data && Array.isArray(data.connections)) {
        connectionsArray = data.connections;
      }
      
      setConnections(connectionsArray);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      setConnections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh individual connection
  const refreshConnection = async (connectionId) => {
    setRefreshingConnections(prev => new Set(prev).add(connectionId));
    
    try {
      // Test the connection to update its status
      const response = await fetch('/api/connections/test-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId })
      });

      const result = await response.json();
      
      // Update the connection status based on test result
      const updateResponse = await fetch(`/api/connections/${connectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: result.success ? 'connected' : 'error',
          lastTested: new Date().toISOString()
        })
      });

      if (updateResponse.ok) {
        fetchConnections(); // Refresh the connections list
      }
    } catch (error) {
      console.error('Failed to refresh connection:', error);
    } finally {
      setRefreshingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  // Test connection
  const testConnection = async (connectionId) => {
    setTestResult({ testing: true, message: 'Testing connection...' });
    
    try {
      const response = await fetch('/api/connections/test-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId })
      });

      const result = await response.json();
      setTestResult(result);
      
      // Auto-refresh the connection after test
      if (result.success) {
        setTimeout(() => refreshConnection(connectionId), 1000);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Test failed: ' + error.message
      });
    }
  };

  // Handle edit
  const handleEdit = (connection) => {
    setSelectedConnection(connection);
    setEditForm({
      name: connection.name || '',
      description: connection.description || '',
      clientId: connection.clientId || '',
      clientSecret: '[SAVED]',
      environmentId: connection.environmentId || '',
      region: connection.region || 'NA',
      enableUserImport: connection.enableUserImport || false,
      enableGroupImport: connection.enableGroupImport || false,
      userImportUrl: connection.userImportUrl || '',
      groupImportUrl: connection.groupImportUrl || '',
      attributeMappings: connection.attributeMappings || defaultMappings,
      syncInterval: connection.syncInterval || 60
    });
    setShowEditModal(true);
  };

  // Handle save
  const handleSave = async () => {
    try {
      const updateData = { ...editForm };
      
      if (updateData.clientSecret === '[SAVED]') {
        delete updateData.clientSecret;
      }

      const response = await fetch(`/api/connections/${selectedConnection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchConnections();
      } else {
        const error = await response.json();
        console.error('Failed to update connection:', error);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  // Handle real PingOne preview using backend proxy
  const handlePreview = async (connection) => {
    setSelectedConnection(connection);
    setPreviewData({ loading: true });
    setShowPreviewModal(true);
    
    try {
      // Use backend proxy to avoid CORS issues
      const response = await fetch(`/api/connections/${connection.id}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        setPreviewData({
          loading: false,
          error: result.error || 'Failed to fetch user data',
          suggestion: result.suggestion || 'Please check your connection configuration.',
          details: result.details
        });
        return;
      }

      setPreviewData({
        loading: false,
        users: result.users,
        totalUsers: result.totalUsers,
        lastSync: result.lastSync,
        apiUrl: result.apiUrl,
        sampleSize: result.sampleSize
      });

    } catch (error) {
      console.error('Preview error:', error);
      setPreviewData({
        loading: false,
        error: `Network error: ${error.message}`,
        suggestion: 'Please check your internet connection and try again.'
      });
    }
  };

  // Update form field
  const updateFormField = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Update attribute mapping
  const updateAttributeMapping = (index, field, value) => {
    setEditForm(prev => ({
      ...prev,
      attributeMappings: prev.attributeMappings.map((mapping, i) => 
        i === index ? { ...mapping, [field]: value } : mapping
      )
    }));
  };

  // Add/Remove attribute mapping
  const addAttributeMapping = () => {
    setEditForm(prev => ({
      ...prev,
      attributeMappings: [
        ...prev.attributeMappings,
        { source: '', destination: '', transform: '', required: false }
      ]
    }));
  };

  const removeAttributeMapping = (index) => {
    setEditForm(prev => ({
      ...prev,
      attributeMappings: prev.attributeMappings.filter((_, i) => i !== index)
    }));
  };

  // Get status color and icon
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'connected':
        return {
          color: 'bg-green-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          icon: CheckCircle,
          label: 'Connected'
        };
      case 'error':
        return {
          color: 'bg-red-500',
          bgColor: 'bg-red-50', 
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          icon: XCircle,
          label: 'Error'
        };
      default:
        return {
          color: 'bg-yellow-500',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800', 
          borderColor: 'border-yellow-200',
          icon: AlertCircle,
          label: 'Created'
        };
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading connections...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Connection Management</h1>
          <p className="text-gray-600 mt-2">Manage identity source connections and synchronization</p>
        </div>
      </div>
      
      {/* Test Result */}
      {testResult && (
        <div className={`p-4 mb-6 rounded-lg border ${
          testResult.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : testResult.testing
            ? 'bg-blue-50 border-blue-200 text-blue-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="font-medium">{testResult.message}</div>
          {testResult.details && (
            <pre className="text-xs mt-2 overflow-auto max-h-40">
              {JSON.stringify(testResult.details, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Card-Style Connections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {connections.map(connection => {
          const statusDisplay = getStatusDisplay(connection.status);
          const StatusIcon = statusDisplay.icon;
          const isRefreshing = refreshingConnections.has(connection.id);

          return (
            <div key={connection.id} className={`bg-white rounded-xl border-2 ${statusDisplay.borderColor} p-6 hover:shadow-lg transition-all duration-200`}>
              {/* Card Header with Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 font-bold">P1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{connection.name}</h3>
                    <p className="text-sm text-gray-500">PingOne Identity Cloud</p>
                  </div>
                </div>

                {/* Status Badge with Individual Refresh */}
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center px-3 py-1.5 rounded-full ${statusDisplay.bgColor} ${statusDisplay.textColor}`}>
                    <StatusIcon className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">{statusDisplay.label}</span>
                  </div>
                  <button
                    onClick={() => refreshConnection(connection.id)}
                    disabled={isRefreshing}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Refresh connection status"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Connection Details */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <span className="text-gray-500">Environment:</span>
                  <span className="ml-2 font-mono">{connection.environmentId ? '...' : 'Not set'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Region:</span>
                  <span className="ml-2">{connection.region || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Last checked:</span>
                  <span className="ml-2">{connection.lastTested ? new Date(connection.lastTested).toLocaleString() : 'Never'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Auto Sync:</span>
                  <span className="ml-2">Disabled</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => testConnection(connection.id)}
                    className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Test
                  </button>

                  <button
                    onClick={() => handlePreview(connection)}
                    className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </button>

                  <button
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Import Now
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(connection)}
                    className="inline-flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button className="inline-flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal - (keeping the same comprehensive edit modal from before) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Edit PingOne Connection</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info with Description */}
              <div>
                <h4 className="font-medium mb-4">Connection Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Connection Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => updateFormField('name', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter connection name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => updateFormField('description', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      rows="2"
                      placeholder="Optional description for this connection"
                    />
                  </div>
                </div>
              </div>

              {/* Two-Row Credentials Layout */}
              <div>
                <h4 className="font-medium mb-4">PingOne Credentials</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Environment ID</label>
                      <input
                        type="text"
                        value={editForm.environmentId}
                        onChange={(e) => updateFormField('environmentId', e.target.value)}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        className="w-full px-3 py-2 border rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Region</label>
                      <select
                        value={editForm.region}
                        onChange={(e) => updateFormField('region', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="NA">North America</option>
                        <option value="EU">Europe</option>
                        <option value="APAC">Asia Pacific</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Client ID</label>
                      <input
                        type="text"
                        value={editForm.clientId}
                        onChange={(e) => updateFormField('clientId', e.target.value)}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        className="w-full px-3 py-2 border rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Client Secret</label>
                      <div className="relative">
                        <input
                          type={showSecrets.clientSecret ? 'text' : 'password'}
                          value={editForm.clientSecret}
                          onChange={(e) => updateFormField('clientSecret', e.target.value)}
                          placeholder="Enter new client secret"
                          className="w-full px-3 py-2 border rounded-md pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecrets(prev => ({ ...prev, clientSecret: !prev.clientSecret }))}
                          className="absolute right-3 top-2.5 text-gray-400"
                        >
                          {showSecrets.clientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Import Configuration */}
              <div>
                <h4 className="font-medium mb-4">Import Configuration</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enableUserImport"
                      checked={editForm.enableUserImport}
                      onChange={(e) => updateFormField('enableUserImport', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="enableUserImport" className="text-sm font-medium">Enable User Import</label>
                  </div>
                  
                  {editForm.enableUserImport && (
                    <div>
                      <label className="block text-sm font-medium mb-1">User Import API URL</label>
                      <input
                        type="url"
                        value={editForm.userImportUrl}
                        onChange={(e) => updateFormField('userImportUrl', e.target.value)}
                        placeholder="https://api.yourcompany.com/users"
                        className="w-full px-3 py-2 border rounded-md"
                      />
                      <p className="text-xs text-gray-500 mt-1">This URL will be used to fetch user data for preview and import</p>
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enableGroupImport"
                      checked={editForm.enableGroupImport}
                      onChange={(e) => updateFormField('enableGroupImport', e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="enableGroupImport" className="text-sm font-medium">Enable Group Import</label>
                  </div>
                  
                  {editForm.enableGroupImport && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Group Import API URL</label>
                      <input
                        type="url"
                        value={editForm.groupImportUrl}
                        onChange={(e) => updateFormField('groupImportUrl', e.target.value)}
                        placeholder="https://api.yourcompany.com/groups"
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Attribute Mapping */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Attribute Mapping</h4>
                  <button
                    onClick={addAttributeMapping}
                    className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Mapping
                  </button>
                </div>
                
                <div className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded text-sm font-medium text-gray-700 mb-2">
                  <div className="col-span-3 flex items-center">
                    <Database className="w-4 h-4 mr-1" />
                    Source Field
                  </div>
                  <div className="col-span-3 flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    PingOne Attribute
                  </div>
                  <div className="col-span-4">Regex Transform</div>
                  <div className="col-span-1 text-center">Required</div>
                  <div className="col-span-1 text-center">Actions</div>
                </div>
                
                <div className="space-y-2">
                  {editForm.attributeMappings?.map((mapping, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 border rounded hover:bg-gray-50">
                      <div className="col-span-3">
                        <select
                          value={mapping.source}
                          onChange={(e) => updateAttributeMapping(index, 'source', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          <option value="">Select source field...</option>
                          {userTableColumns.map(col => (
                            <option key={col.value} value={col.value}>
                              {col.label} ({col.type})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="PingOne SCIM attribute"
                          value={mapping.destination}
                          onChange={(e) => updateAttributeMapping(index, 'destination', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="s/pattern/replacement/g"
                          value={mapping.transform}
                          onChange={(e) => updateAttributeMapping(index, 'transform', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm font-mono"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <input
                          type="checkbox"
                          checked={mapping.required}
                          onChange={(e) => updateAttributeMapping(index, 'required', e.target.checked)}
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          onClick={() => removeAttributeMapping(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-between">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real Data Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Real User Data Preview</h3>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {previewData?.loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Fetching real user data from API...
                </div>
              ) : previewData?.error ? (
                <div className="text-center py-8">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Data</h3>
                  <p className="text-red-600 mb-4">{previewData.error}</p>
                  {previewData.suggestion && (
                    <p className="text-sm text-gray-600">{previewData.suggestion}</p>
                  )}
                </div>
              ) : (
                <div>
                  {/* API Info */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Data Source</h4>
                    <p className="text-sm text-blue-600 font-mono">{previewData?.apiUrl}</p>
                    <p className="text-xs text-blue-500 mt-1">Fetched: {new Date(previewData?.lastSync).toLocaleString()}</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{previewData?.totalUsers || 0}</div>
                      <div className="text-sm text-blue-600">Total Users</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{previewData?.users?.length || 0}</div>
                      <div className="text-sm text-green-600">Showing</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-600">Status</div>
                      <div className="text-sm text-green-600">Connected</div>
                    </div>
                  </div>

                  {/* User List */}
                  <div className="space-y-3">
                    <h4 className="font-medium">User Data (First 10 Records)</h4>
                    {previewData?.users?.map((user, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {Object.entries(user).slice(0, 8).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium text-gray-600">{key}:</span>
                              <span className="ml-1 text-gray-900">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal Placeholder */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Import Users</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center py-8">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Import functionality will be implemented here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}