'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestSavePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-profile-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Test Profile Save</h1>
      
      <Button onClick={testSave} disabled={loading} className="mb-4">
        {loading ? 'Testing...' : 'Test Save to Supabase'}
      </Button>

      {result && (
        <div className="mt-4 p-4 bg-secondary rounded-lg">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

