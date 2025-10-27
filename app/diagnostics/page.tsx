'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'running' | 'success' | 'error' | 'warning';
  message?: string;
  details?: any;
}

export default function DiagnosticsPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const runDiagnostics = async () => {
    setRunning(true);
    setTests([]);

    const results: TestResult[] = [];

    // Test 1: Environment Variables
    try {
      results.push({ name: 'Environment Variables', status: 'running' });
      setTests([...results]);

      const envResponse = await fetch('/api/test-env');
      const envData = await envResponse.json();

      const hasAllCreds = envData.credentials.NEXT_PUBLIC_SUPABASE_URL.present &&
                          envData.credentials.NEXT_PUBLIC_SUPABASE_ANON_KEY.present &&
                          envData.credentials.SUPABASE_SERVICE_ROLE_KEY.present;

      results[results.length - 1] = {
        name: 'Environment Variables',
        status: hasAllCreds ? 'success' : 'error',
        message: hasAllCreds
          ? 'All environment variables are set'
          : 'Missing required environment variables',
        details: envData
      };
      setTests([...results]);
    } catch (error) {
      results[results.length - 1] = {
        name: 'Environment Variables',
        status: 'error',
        message: 'Failed to check environment variables',
        details: error
      };
      setTests([...results]);
    }

    // Test 2: Database Connection
    try {
      results.push({ name: 'Database Connection', status: 'running' });
      setTests([...results]);

      const dbResponse = await fetch('/api/test-db');
      const dbData = await dbResponse.json();

      const allTestsPassed = dbData.success &&
                             dbData.tests?.selectProfiles?.success &&
                             dbData.tests?.insertProfile?.success;

      results[results.length - 1] = {
        name: 'Database Connection',
        status: allTestsPassed ? 'success' : 'error',
        message: allTestsPassed
          ? 'Database connection and operations working'
          : 'Database connection or operations failed',
        details: dbData
      };
      setTests([...results]);
    } catch (error) {
      results[results.length - 1] = {
        name: 'Database Connection',
        status: 'error',
        message: 'Failed to test database connection',
        details: error
      };
      setTests([...results]);
    }

    // Test 3: Profile API
    try {
      results.push({ name: 'Profile API Endpoint', status: 'running' });
      setTests([...results]);

      const profileResponse = await fetch('/api/profile?userId=test-user-diagnostic');
      const profileData = await profileResponse.json();

      results[results.length - 1] = {
        name: 'Profile API Endpoint',
        status: profileResponse.ok || profileResponse.status === 404 ? 'success' : 'error',
        message: profileResponse.ok || profileResponse.status === 404
          ? 'Profile API is responding correctly'
          : 'Profile API returned an error',
        details: profileData
      };
      setTests([...results]);
    } catch (error) {
      results[results.length - 1] = {
        name: 'Profile API Endpoint',
        status: 'error',
        message: 'Failed to reach profile API',
        details: error
      };
      setTests([...results]);
    }

    setRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const hasErrors = tests.some(t => t.status === 'error');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">System Diagnostics</CardTitle>
                <CardDescription>
                  Check the health of your MemberMixer deployment
                </CardDescription>
              </div>
              <Button
                onClick={runDiagnostics}
                disabled={running}
                variant="outline"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${running ? 'animate-spin' : ''}`} />
                Rerun Tests
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {tests.map((test, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{test.name}</h3>
                    {test.message && (
                      <p className="text-sm text-gray-700 mt-1">{test.message}</p>
                    )}
                    {test.details && test.status === 'error' && (
                      <details className="mt-2">
                        <summary className="text-sm cursor-pointer text-gray-600 hover:text-gray-900">
                          Show details
                        </summary>
                        <pre className="mt-2 p-3 bg-white rounded text-xs overflow-auto max-h-64">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                    {test.details && test.status === 'success' && test.name === 'Environment Variables' && (
                      <details className="mt-2">
                        <summary className="text-sm cursor-pointer text-gray-600 hover:text-gray-900">
                          View configuration
                        </summary>
                        <div className="mt-2 p-3 bg-white rounded text-xs space-y-2">
                          <div>
                            <strong>Environment:</strong> {test.details.environment}
                          </div>
                          <div>
                            <strong>Vercel:</strong> {test.details.vercel ? 'Yes' : 'No'}
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <strong>Credentials Status:</strong>
                            <ul className="ml-4 mt-1 space-y-1">
                              {Object.entries(test.details.credentials).map(([key, value]: [string, any]) => (
                                <li key={key} className="flex items-center gap-2">
                                  {value.present ? (
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <XCircle className="h-3 w-3 text-red-600" />
                                  )}
                                  <span className={value.present ? 'text-green-700' : 'text-red-700'}>
                                    {key} ({value.length} chars)
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {tests.length === 0 && !running && (
              <div className="text-center text-gray-500 py-8">
                Click "Rerun Tests" to start diagnostics
              </div>
            )}

            {hasErrors && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-900 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Issues Detected
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-red-800 space-y-2">
                  <p className="font-semibold">Common fixes:</p>
                  <ol className="list-decimal ml-5 space-y-1">
                    <li>
                      <strong>Missing SUPABASE_SERVICE_ROLE_KEY:</strong>
                      <ul className="list-disc ml-5 mt-1">
                        <li>Go to your Supabase project dashboard</li>
                        <li>Navigate to Settings → API</li>
                        <li>Copy the "service_role" key (not the anon key)</li>
                        <li>Add it to Vercel: Settings → Environment Variables</li>
                        <li>Redeploy your application</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Database not accessible:</strong>
                      <ul className="list-disc ml-5 mt-1">
                        <li>Check Supabase project is active and not paused</li>
                        <li>Verify database URL is correct</li>
                        <li>Ensure profiles table exists with correct schema</li>
                      </ul>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
