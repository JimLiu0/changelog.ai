'use client';

import { useState } from 'react';

interface RepoData {
  full_name: string;
  description: string;
  stargazers_count: number;
  owner: {
    login: string;
  };
  name: string;
  default_branch: string;
}

interface Branch {
  name: string;
}

interface ChangelogActionProps {
  repoData: RepoData;
  branches: Branch[];
  selectedBranch: string;
  onBranchSelected: (branch: string) => void;
  onError: (error: string) => void;
  onNextStep: () => void;
}

export default function ChangelogAction({
  repoData,
  branches,
  selectedBranch,
  onBranchSelected,
  onError,
  onNextStep,
}: ChangelogActionProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onBranchSelected(selectedBranch);
      onNextStep();
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

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">Repository Information</h2>
      <div className="bg-black-50 p-4 rounded-lg border-gray-300 border-2">
        <p><strong>Repository:</strong> {repoData.full_name}</p>
        <p><strong>Description:</strong> {repoData.description}</p>
        <p><strong>Stars:</strong> {repoData.stargazers_count}</p>
      </div>
      <div className="mt-4">
        <h3 className="font-bold mb-2">Select Branch:</h3>
        <select
          className="border-2 border-gray-300 rounded-md p-2 w-full"
          value={selectedBranch}
          onChange={(e) => onBranchSelected(e.target.value)}
        >
          {branches.map((branch) => (
            <option key={branch.name} value={branch.name}>
              {branch.name}
            </option>
          ))}
        </select>
        <button 
          onClick={handleSubmit} 
          className="mt-4 w-full border px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Create New Changelog'}
        </button>
      </div>
    </div>
  );
} 