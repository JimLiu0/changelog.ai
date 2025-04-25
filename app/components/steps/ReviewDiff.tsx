'use client';

import { useState, useEffect } from 'react';
import DiffView from '../DiffView';

interface Diff {
  files: Array<{
    filename: string;
    patch: string;
  }>;
}

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
}

interface Tag {
  name: string;
  commit: {
    sha: string;
  };
}

interface ReviewDiffProps {
  repoData: {
    owner: {
      login: string;
    };
    name: string;
  };
  selectedCommits: string[];
  commits: Commit[];
  tags: Tag[];
  selectedBranch: string;
  onError: (error: string) => void;
  onNextStep: () => void;
}

export default function ReviewDiff({ 
  repoData, 
  selectedCommits, 
  commits, 
  tags = [], 
  selectedBranch,
  onError, 
  onNextStep 
}: ReviewDiffProps) {
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

  const getTagForCommit = (sha: string) => {
    return tags.find(tag => tag.commit.sha === sha)?.name;
  };

  const isHeadCommit = (sha: string) => {
    return commits[0]?.sha === sha;
  };

  const getCommitDetails = (sha: string) => {
    return commits.find(commit => commit.sha === sha);
  };

  const startCommit = getCommitDetails(selectedCommits[1]);
  const endCommit = getCommitDetails(selectedCommits[0]);

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

      {/* Commit Information */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold text-white mb-2">Start Commit (Older)</h3>
          {startCommit && (
            <>
              <p className="text-sm text-gray-400">Hash: {startCommit.sha.substring(0, 7)}</p>
              <p className="text-white">{startCommit.commit.message}</p>
              <p className="text-sm text-gray-400">
                {new Date(startCommit.commit.author.date).toLocaleDateString()}
              </p>
              <div className="flex gap-2 mt-2">
                {getTagForCommit(startCommit.sha) && (
                  <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                    {getTagForCommit(startCommit.sha)}
                  </span>
                )}
                {isHeadCommit(startCommit.sha) && (
                  <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                    HEAD ({selectedBranch})
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold text-white mb-2">End Commit (Newer)</h3>
          {endCommit && (
            <>
              <p className="text-sm text-gray-400">Hash: {endCommit.sha.substring(0, 7)}</p>
              <p className="text-white">{endCommit.commit.message}</p>
              <p className="text-sm text-gray-400">
                {new Date(endCommit.commit.author.date).toLocaleDateString()}
              </p>
              <div className="flex gap-2 mt-2">
                {getTagForCommit(endCommit.sha) && (
                  <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                    {getTagForCommit(endCommit.sha)}
                  </span>
                )}
                {isHeadCommit(endCommit.sha) && (
                  <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                    HEAD ({selectedBranch})
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end mb-6">
        <button
          onClick={onNextStep}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Changelog
        </button>
      </div>

      {/* Diff View */}
      <div className="mb-6">
        <DiffView files={diff.files} initiallyExpanded={true} />
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={onNextStep}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Changelog
        </button>
      </div>
    </div>
  );
} 