import { useUser, useAuth } from '@clerk/clerk-react'; // ✅ Added useAuth
import { useEffect, useState } from 'react';
import { buildApiUrl } from '../utils/api';

// Temporary component to debug the admin auth issue
export function DebugAdmin() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth(); // ✅ Added this line
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    if (!isLoaded || !user) return;

    const runTests = async () => {
      try {
        // Test 1: Get token - ✅ FIXED: use getToken() from useAuth
        const token = await getToken(); // ✅ Changed from user.getToken()
        console.log('🔑 Token obtained:', token?.substring(0, 20) + '...');

        // Test 2: Try to call admin endpoint
        const response = await fetch(buildApiUrl('/api/admin/stats'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const responseText = await response.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }

        setTestResults({
          tokenExists: !!token,
          tokenPreview: token?.substring(0, 30) + '...',
          userRole: user.publicMetadata?.role,
          responseStatus: response.status,
          responseOk: response.ok,
          responseData: responseData,
          headers: {
            authorization: token ? 'Token sent' : 'No token',
            contentType: 'application/json'
          }
        });

        console.log('📊 Test Results:', {
          status: response.status,
          ok: response.ok,
          data: responseData
        });

      } catch (error) {
        console.error('❌ Test error:', error);
        setTestResults({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    runTests();
  }, [isLoaded, user, getToken]); // ✅ Added getToken to dependency array

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Admin Authentication Debug</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-xl font-semibold mb-4">User Info</h2>
        <div className="space-y-2 font-mono text-sm">
          <div><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}</div>
          <div><strong>Role:</strong> {(user as any)?.publicMetadata?.role || 'none'}</div>
          <div><strong>Is Admin:</strong> {user?.publicMetadata?.role === 'admin' ? '✅ Yes' : '❌ No'}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">API Test Results</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify(testResults, null, 2)}
        </pre>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">📋 Checklist:</h3>
        <ul className="space-y-1 text-sm">
          <li>✅ User role is 'admin' in Clerk</li>
          <li>{testResults.tokenExists ? '✅' : '❌'} Token is being generated</li>
          <li>{testResults.responseStatus === 200 ? '✅' : '❌'} Backend accepts the request (Status: {testResults.responseStatus})</li>
          <li>Check backend terminal for debug logs</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold mb-2">🔧 Next Steps:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Check your backend terminal for the debug logs</li>
          <li>Verify CLERK_SECRET_KEY is in server/.env</li>
          <li>Make sure backend is restarted after adding the key</li>
          <li>If status is 401: Token validation failed</li>
          <li>If status is 403: Role check failed</li>
        </ol>
      </div>
    </div>
  );
}
