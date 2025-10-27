'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Loader2, Sparkles } from 'lucide-react';

interface MatchButtonProps {
  userId: string;
  onMatchFound: (match: any) => void;
  disabled?: boolean;
}

export function MatchButton({ userId, onMatchFound, disabled }: MatchButtonProps) {
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFindMatch = async () => {
    setIsMatching(true);
    setError(null);

    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresPayment) {
          setError('Match limit reached! Upgrade to continue.');
        } else {
          setError(data.message || data.error || 'Failed to find match');
        }
        return;
      }

      onMatchFound(data);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Match error:', err);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleFindMatch}
        disabled={disabled || isMatching}
        size="lg"
        className="w-full"
      >
        {isMatching ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Finding your match...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Find a Match
          </>
        )}
      </Button>

      {error && (
        <div className="text-sm text-destructive text-center">
          {error}
        </div>
      )}
    </div>
  );
}

