'use client';

import { useState, useEffect } from 'react';

interface RepoData {
  owner: {
    login: string;
  };
  name: string;
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

interface ChooseCommitsProps {
  repoData: RepoData;
  selectedBranch: string;
  commits: Commit[];
  selectedCommits: string[];
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onCommitsSelected: (commits: string[]) => void;
  onError: (error: string) => void;
  onNextStep: () => void;
}

export default function ChooseCommits({
  repoData,
  selectedBranch,
  commits,
  selectedCommits,
  searchText,
  onSearchTextChange,
  onCommitsSelected,
  onError,
  onNextStep,
}: ChooseCommitsProps) {
  const getCommitInfo = (sha: string) => {
    const commit = commits.find(c => c.sha === sha);
    if (!commit) return null;
    return {
      shortSha: sha.substring(0, 7),
      message: commit.commit.message,
      date: new Date(commit.commit.author.date).toLocaleDateString(),
    };
  };

  const handleCommitClick = (commit: Commit) => {
    const commitIndex = commits.findIndex(c => c.sha === commit.sha);
    const endCommitIndex = selectedCommits[0] ? commits.findIndex(c => c.sha === selectedCommits[0]) : -1;

    if (selectedCommits.length === 0) {
      // First commit selected - this will be the end commit
      onCommitsSelected([commit.sha]);
    } else if (selectedCommits.length === 1) {
      // Second commit selected - this will be the start commit
      if (commitIndex > endCommitIndex) {
        // Only allow selecting older commits (those that appear lower in the list)
        onCommitsSelected([selectedCommits[0], commit.sha]);
      }
    } else {
      // Reset selection and start over
      onCommitsSelected([commit.sha]);
    }
  };

  const endCommit = selectedCommits[0] ? getCommitInfo(selectedCommits[0]) : null;
  const startCommit = selectedCommits[1] ? getCommitInfo(selectedCommits[1]) : null;

  const getRowClassName = (commit: Commit) => {
    const commitIndex = commits.findIndex(c => c.sha === commit.sha);
    const endCommitIndex = selectedCommits[0] ? commits.findIndex(c => c.sha === selectedCommits[0]) : -1;
    const startCommitIndex = selectedCommits[1] ? commits.findIndex(c => c.sha === selectedCommits[1]) : -1;

    if (selectedCommits.includes(commit.sha)) {
      return 'bg-white text-black font-semibold';
    } else if (selectedCommits.length === 1) {
      // If we have selected the end commit, disable all commits above it (more recent)
      if (commitIndex <= endCommitIndex) {
        return 'bg-gray-100 text-gray-400 cursor-not-allowed';
      }
      return 'hover:bg-gray-100 cursor-pointer';
    } else if (selectedCommits.length === 2 && commitIndex > endCommitIndex && commitIndex < startCommitIndex) {
      return 'bg-blue-50 text-black';
    }
    return 'hover:bg-gray-100 cursor-pointer';
  };

  const isCommitClickable = (commit: Commit) => {
    if (selectedCommits.length === 0) return true;
    const commitIndex = commits.findIndex(c => c.sha === commit.sha);
    const endCommitIndex = selectedCommits[0] ? commits.findIndex(c => c.sha === selectedCommits[0]) : -1;
    // Allow clicking only on commits that appear AFTER (older than) the end commit
    return commitIndex > endCommitIndex;
  };

  const handleClearEndCommit = () => {
    onCommitsSelected([]);
  };

  const handleClearStartCommit = () => {
    if (selectedCommits.length === 2) {
      onCommitsSelected([selectedCommits[0]]);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">Select Commits</h2>
      
      {/* Commit Selection Box */}
      <div className="bg-black p-4 rounded-lg border-2 border-gray-300 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2 text-white">End Commit (Most Recent)</h3>
            {endCommit ? (
              <div className="bg-gray-800 p-3 rounded border border-gray-600 relative">
                <button
                  onClick={handleClearEndCommit}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <p className="text-sm text-gray-400">Hash: {endCommit.shortSha}</p>
                <p className="font-medium text-white">{endCommit.message}</p>
                <p className="text-sm text-gray-400">{endCommit.date}</p>
              </div>
            ) : (
              <div className="bg-gray-900 p-3 rounded border border-dashed border-gray-600 text-gray-400">
                Click on a commit to set the end point
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-white">Start Commit (Oldest)</h3>
            {startCommit ? (
              <div className="bg-gray-800 p-3 rounded border border-gray-600 relative">
                <button
                  onClick={handleClearStartCommit}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <p className="text-sm text-gray-400">Hash: {startCommit.shortSha}</p>
                <p className="font-medium text-white">{startCommit.message}</p>
                <p className="text-sm text-gray-400">{startCommit.date}</p>
              </div>
            ) : (
              <div className="bg-gray-900 p-3 rounded border border-dashed border-gray-600 text-gray-400">
                {endCommit ? 'Click on an older commit to set the start point' : 'Select end commit first'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search commit messages..."
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
          className="border px-2 py-1 rounded w-full"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Date</th>
              <th className="p-2">Message</th>
              <th className="p-2">Author</th>
            </tr>
          </thead>
          <tbody>
            {commits
              .filter((commit) => {
                const messageMatch = commit.commit.message.toLowerCase().includes(searchText.toLowerCase());
                return (!searchText || messageMatch);
              })
              .map((commit) => (
                <tr
                  key={commit.sha}
                  className={`border-b ${getRowClassName(commit)}`}
                  onClick={() => isCommitClickable(commit) && handleCommitClick(commit)}
                >
                  <td className="p-2">{new Date(commit.commit.author.date).toLocaleDateString()}</td>
                  <td className="p-2">{commit.commit.message.length > 50 ? commit.commit.message.substring(0, 50) + '...' : commit.commit.message}</td>
                  <td className="p-2">{commit.commit.author.name}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Continue Button */}
      <div className="mt-6">
        <button
          onClick={onNextStep}
          disabled={selectedCommits.length !== 2}
          className="w-full border px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Continue to Review Changes
        </button>
      </div>
    </div>
  );
} 