'use client';

import { useState, useEffect } from 'react';

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
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="mb-4">
          <strong>Files Changed:</strong> {diff.files.length}
        </p>
        {diff.files.map((file) => (
          <div key={file.filename} className="mb-6">
            <h3 className="font-semibold mb-2">{file.filename}</h3>
            {file.patch ? (
              <pre className="bg-gray-800 text-white p-4 rounded overflow-x-auto">
                {file.patch.split('\n').map((line, idx) => (
                  <div
                    key={idx}
                    className={`${
                      line.startsWith('+')
                        ? 'text-green-400'
                        : line.startsWith('-')
                        ? 'text-red-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {line}
                  </div>
                ))}
              </pre>
            ) : (
              <p className="text-gray-500">No changes in this file</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 