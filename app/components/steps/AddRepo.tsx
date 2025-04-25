'use client';

import { useState } from 'react';

interface AddRepoProps {
  onRepoSelected: (repoData: any) => void;
  onError: (error: string) => void;
}

export default function AddRepo({ onRepoSelected, onError }: AddRepoProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    onError("");
    try {
      const regex = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)$/;
      const match = repoUrl.match(regex);
      if (!match) {
        onError("Please enter a valid public GitHub repo URL.");
        return;
      }
      const owner = match[1];
      const repo = match[2];
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (!res.ok) {
        throw new Error("Repository not found or not public.");
      }
      const data = await res.json();
      onRepoSelected(data);
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
      <h2 className="text-xl font-bold mb-4">Add a GitHub Repository</h2>
      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Enter GitHub repository URL (e.g., https://github.com/owner/repo)"
          className="border-2 border-gray-300 rounded-md p-2 w-full"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          disabled={isLoading}
        />
        <button 
          onClick={handleSubmit} 
          className="mt-2 border px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Submit'}
        </button>
      </div>
    </div>
  );
} 