'use client';

import { useState, useEffect } from 'react';
import DiffView from '../DiffView';

interface Diff {
  files: Array<{
    filename: string;
    patch: string;
  }>;
}

interface ReviewDiffProps {
  repoData: {
    owner: {
      login: string;
    };
    name: string;
  };
  selectedCommits: string[];
  commits: Array<{
    sha: string;
  }>;
  onError: (error: string) => void;
}

export default function ReviewDiff({ repoData, selectedCommits, commits, onError }: ReviewDiffProps) {
  const [diff, setDiff] = useState<Diff | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDiff = async () => {
      if (selectedCommits.length !== 2) return;

      try {
        const baseSha = selectedCommits[1];
        const headSha = selectedCommits[0];
        const res = await fetch(
          `https://api.github.com/repos/${repoData.owner.login}/${repoData.name}/compare/${baseSha}...${headSha}`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch diff.");
        }
        const data = await res.json();
        setDiff(data);
      } catch (err) {
        if (err instanceof Error) {
          onError(err.message);
        } else {
          onError("An unknown error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiff();
  }, [repoData, selectedCommits, onError]);

  if (isLoading) {
    return (
      <div className="w-full">
        <h2 className="text-xl font-bold mb-4">Loading Changes...</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!diff) {
    return (
      <div className="w-full">
        <h2 className="text-xl font-bold mb-4">No Changes Found</h2>
        <p>There are no changes between the selected commits.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">Review Changes</h2>
      <DiffView files={diff.files} initiallyExpanded={true} />
    </div>
  );
} 