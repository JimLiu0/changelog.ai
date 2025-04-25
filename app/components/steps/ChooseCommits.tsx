'use client';

import { useState, useEffect } from 'react';
import DiffView from '../DiffView';

interface RepoData {
  owner: {
    login: string;
  };
  name: string;
}

interface Tag {
  name: string;
  commit: {
    sha: string;
  };
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

interface CommitDetails {
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
  tags: Tag[];
  selectedCommits: string[];
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onCommitsSelected: (commits: string[]) => void;
  onError: (error: string) => void;
  onNextStep: () => void;
  onPageChange: (page: number) => void;
  currentPage: number;
  hasNextPage: boolean;
}

interface DiffFile {
  filename: string;
  patch: string;
}

interface DiffResponse {
  files: DiffFile[];
}

export default function ChooseCommits({
  repoData,
  selectedBranch,
  commits,
  tags = [],
  selectedCommits,
  searchText,
  onSearchTextChange,
  onCommitsSelected,
  onError,
  onNextStep,
  onPageChange,
  currentPage,
  hasNextPage,
}: ChooseCommitsProps) {
  const [loadingDiff, setLoadingDiff] = useState<string | null>(null);
  const [diffs, setDiffs] = useState<Record<string, DiffFile[]>>({});
  const [visibleDiffs, setVisibleDiffs] = useState<Set<string>>(new Set());
  const [selectedEndTag, setSelectedEndTag] = useState<string>('');
  const [selectedStartTag, setSelectedStartTag] = useState<string>('');
  const [loadingCommit, setLoadingCommit] = useState(false);
  const [fetchedDiffs, setFetchedDiffs] = useState<Set<string>>(new Set());
  const [allKnownCommits, setAllKnownCommits] = useState<Commit[]>([]);

  // Tag-only diff state
  const [tagOnlyStart, setTagOnlyStart] = useState<string>('');
  const [tagOnlyEnd, setTagOnlyEnd] = useState<string>('');

  const [selectionMode, setSelectionMode] = useState<'commits' | 'tags' | null>(null);

  const [showAllTagDiffs, setShowAllTagDiffs] = useState(false);

  // Update our known commits whenever we get new ones
  useEffect(() => {
    const newCommits = commits.filter(
      newCommit => !allKnownCommits.some(
        existingCommit => existingCommit.sha === newCommit.sha
      )
    );
    
    if (newCommits.length > 0) {
      setAllKnownCommits(prev => {
        const combined = [...prev, ...newCommits];
        // Sort by date to maintain chronological order
        return combined.sort((a, b) => 
          new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()
        );
      });
    }
  }, [commits]);

  const findNextOlderCommit = (sha: string): Commit | null => {
    const index = allKnownCommits.findIndex(c => c.sha === sha);
    if (index === -1 || index === allKnownCommits.length - 1) return null;
    return allKnownCommits[index + 1];
  };

  const getCommitInfo = (sha: string) => {
    const commit = allKnownCommits.find(c => c.sha === sha);
    if (!commit) return null;
    return {
      shortSha: sha.substring(0, 7),
      message: commit.commit.message,
      date: new Date(commit.commit.author.date).toLocaleDateString(),
    };
  };

  const handleCommitClick = (commit: Commit) => {
    if (selectionMode !== 'commits') {
      switchToCommitMode();
    }

    const commitIndex = allKnownCommits.findIndex(c => c.sha === commit.sha);
    const endCommitIndex = selectedCommits[0] ? allKnownCommits.findIndex(c => c.sha === selectedCommits[0]) : -1;

    if (selectedCommits.length === 0) {
      onCommitsSelected([commit.sha]);
    } else if (selectedCommits.length === 1) {
      if (commitIndex > endCommitIndex) {
        onCommitsSelected([selectedCommits[0], commit.sha]);
      }
    } else {
      onCommitsSelected([commit.sha]);
    }
  };

  const endCommit = selectedCommits[0] ? getCommitInfo(selectedCommits[0]) : null;
  const startCommit = selectedCommits[1] ? getCommitInfo(selectedCommits[1]) : null;

  const getRowClassName = (commit: Commit) => {
    const commitIndex = allKnownCommits.findIndex(c => c.sha === commit.sha);
    const endCommitIndex = selectedCommits[0] ? allKnownCommits.findIndex(c => c.sha === selectedCommits[0]) : -1;
    const startCommitIndex = selectedCommits[1] ? allKnownCommits.findIndex(c => c.sha === selectedCommits[1]) : -1;

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
    const commitIndex = allKnownCommits.findIndex(c => c.sha === commit.sha);
    const endCommitIndex = selectedCommits[0] ? allKnownCommits.findIndex(c => c.sha === selectedCommits[0]) : -1;
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

  const handleViewDiff = async (currentSha: string, index: number) => {
    const currentCommit = allKnownCommits.find(c => c.sha === currentSha);
    if (!currentCommit) return;

    const olderCommit = findNextOlderCommit(currentSha);
    if (!olderCommit) {
      // If we don't have the next commit in our cache, try to fetch it
      try {
        const res = await fetch(
          `https://api.github.com/repos/${repoData.owner.login}/${repoData.name}/commits?sha=${currentSha}&per_page=2&page=1`
        );
        if (!res.ok) throw new Error("Failed to fetch commits");
        const [_, nextCommit] = await res.json();
        if (nextCommit) {
          setAllKnownCommits(prev => {
            const newCommits = [...prev, nextCommit].sort((a, b) => 
              new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()
            );
            return newCommits;
          });
          await fetchAndShowDiff(currentSha, nextCommit.sha);
        } else {
          onError("No older commit found");
        }
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to fetch older commit");
      }
      return;
    }

    await fetchAndShowDiff(currentSha, olderCommit.sha);
  };

  const fetchAndShowDiff = async (currentSha: string, olderSha: string) => {
    const diffKey = `${olderSha}...${currentSha}`;
    
    // Toggle visibility if we already have the diff
    if (diffs[diffKey]) {
      setVisibleDiffs(prev => {
        const next = new Set(prev);
        if (next.has(diffKey)) {
          next.delete(diffKey);
        } else {
          next.add(diffKey);
        }
        return next;
      });
      return;
    }

    // Check if we've already fetched this diff before
    if (fetchedDiffs.has(diffKey)) {
      setVisibleDiffs(prev => new Set([...prev, diffKey]));
      return;
    }

    setLoadingDiff(currentSha);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repoData.owner.login}/${repoData.name}/compare/${olderSha}...${currentSha}`
      );
      if (!res.ok) throw new Error("Failed to fetch diff");
      const data: DiffResponse = await res.json();
      setDiffs(prev => ({
        ...prev,
        [diffKey]: data.files
      }));
      setFetchedDiffs(prev => new Set([...prev, diffKey]));
      setVisibleDiffs(prev => new Set([...prev, diffKey]));
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to load diff");
    } finally {
      setLoadingDiff(null);
    }
  };

  const getTagForCommit = (sha: string) => {
    if (!tags) return '';
    const matchingTag = tags.find(tag => tag.commit.sha === sha);
    return matchingTag?.name || '';
  };

  const fetchCommitDetails = async (sha: string): Promise<CommitDetails | null> => {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repoData.owner.login}/${repoData.name}/commits/${sha}`
      );
      if (!res.ok) throw new Error("Failed to fetch commit details");
      return await res.json();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to fetch commit details");
      return null;
    }
  };

  const handleEndTagSelect = async (tagName: string) => {
    if (!tagName) {
      setSelectedEndTag('');
      return;
    }
    
    setLoadingCommit(true);
    try {
      if (tagName === 'HEAD') {
        const headCommit = commits[0];
        if (headCommit) {
          onCommitsSelected([headCommit.sha]);
          setSelectedEndTag('HEAD');
        }
      } else {
        const tag = tags?.find(t => t.name === tagName);
        if (tag) {
          // Fetch commit details for the tag
          const commitDetails = await fetchCommitDetails(tag.commit.sha);
          if (commitDetails) {
            // Update commits array with the new commit details if it's not already there
            const commitIndex = commits.findIndex(c => c.sha === commitDetails.sha);
            if (commitIndex === -1) {
              const newCommits = [commitDetails, ...commits];
              // You'll need to add a function to update commits in the parent component
              // For now, we'll just select the commit
              onCommitsSelected([commitDetails.sha]);
            } else {
              onCommitsSelected([tag.commit.sha]);
            }
            setSelectedEndTag(tagName);
          }
        }
      }
    } finally {
      setLoadingCommit(false);
    }
  };

  const handleStartTagSelect = async (tagName: string) => {
    if (!tagName || !selectedCommits[0]) {
      setSelectedStartTag('');
      return;
    }
    
    setLoadingCommit(true);
    try {
      if (tagName === 'HEAD') {
        const headCommit = commits[0];
        if (headCommit) {
          onCommitsSelected([selectedCommits[0], headCommit.sha]);
          setSelectedStartTag('HEAD');
        }
      } else {
        const tag = tags?.find(t => t.name === tagName);
        if (tag) {
          // Fetch commit details for the tag
          const commitDetails = await fetchCommitDetails(tag.commit.sha);
          if (commitDetails) {
            const commitIndex = commits.findIndex(c => c.sha === commitDetails.sha);
            if (commitIndex === -1) {
              const newCommits = [...commits];
              // Find the right position to insert the commit
              const endCommitIndex = commits.findIndex(c => c.sha === selectedCommits[0]);
              if (endCommitIndex !== -1) {
                newCommits.splice(endCommitIndex + 1, 0, commitDetails);
                // You'll need to add a function to update commits in the parent component
                // For now, we'll just select the commit
                onCommitsSelected([selectedCommits[0], commitDetails.sha]);
              }
            } else {
              onCommitsSelected([selectedCommits[0], tag.commit.sha]);
            }
            setSelectedStartTag(tagName);
          }
        }
      }
    } finally {
      setLoadingCommit(false);
    }
  };

  // Reset tag selection when commits change
  useEffect(() => {
    if (!selectedCommits.length) {
      setSelectedEndTag('');
      setSelectedStartTag('');
    } else if (selectedCommits.length === 1) {
      setSelectedStartTag('');
      // Update end tag if it matches
      const matchingTag = tags?.find(t => t.commit.sha === selectedCommits[0]);
      setSelectedEndTag(matchingTag ? matchingTag.name : selectedCommits[0] === commits[0]?.sha ? 'HEAD' : '');
    } else if (selectedCommits.length === 2) {
      // Update start tag if it matches
      const matchingStartTag = tags?.find(t => t.commit.sha === selectedCommits[1]);
      setSelectedStartTag(matchingStartTag ? matchingStartTag.name : selectedCommits[1] === commits[0]?.sha ? 'HEAD' : '');
    }
  }, [selectedCommits, tags, commits]);

  // Clear other selection method when switching modes
  const switchToTagMode = () => {
    setSelectionMode('tags');
    onCommitsSelected([]); // Clear commit selection
  };

  const switchToCommitMode = () => {
    setSelectionMode('commits');
    setTagOnlyStart('');
    setTagOnlyEnd('');
    setVisibleDiffs(new Set()); // Clear any tag diffs
  };

  // Update tag selection handlers
  const handleTagStartChange = (value: string) => {
    if (value && selectionMode !== 'tags') switchToTagMode();
    setTagOnlyStart(value);
    // Hide all diffs when changing tag selection
    setShowAllTagDiffs(false);
    setVisibleDiffs(new Set());
  };

  const handleTagEndChange = (value: string) => {
    if (value && selectionMode !== 'tags') switchToTagMode();
    setTagOnlyEnd(value);
    // Hide all diffs when changing tag selection
    setShowAllTagDiffs(false);
    setVisibleDiffs(new Set());
  };

  const handleShowAllTagDiffs = () => {
    if (!tagOnlyStart || !tagOnlyEnd) return;
    const diffKey = `${tagOnlyStart}...${tagOnlyEnd}`;
    
    if (showAllTagDiffs) {
      // Hide all diffs
      setVisibleDiffs(new Set());
    } else {
      // Show all diffs
      setVisibleDiffs(new Set([diffKey]));
    }
    setShowAllTagDiffs(!showAllTagDiffs);
  };

  // Check if we have a diff to show
  const hasTagDiff = tagOnlyStart && tagOnlyEnd && diffs[`${tagOnlyStart}...${tagOnlyEnd}`];

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">Select Commits via Tags or Commit List</h2>
      
      {/* Selection Mode Notice */}
      {selectionMode && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg">
          <p className="flex items-center">
            <span className="mr-2">✨</span>
            Currently selecting via {selectionMode === 'tags' ? 'tags' : 'commit list'}.
            <button
              onClick={() => setSelectionMode(null)}
              className="ml-auto text-sm px-2 py-1 bg-blue-200 hover:bg-blue-300 rounded"
            >
              Clear Selection
            </button>
          </p>
        </div>
      )}

      {/* Tag Diff Box */}
      <div className={`bg-black p-4 rounded-lg border-2 ${selectionMode === 'tags' ? 'border-blue-500' : selectionMode === 'commits' ? 'border-gray-500 opacity-50' : 'border-gray-300'} mb-6`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Compare Tags</h3>
          {selectionMode === 'commits' && (
            <span className="text-sm text-gray-400">Disabled while selecting from commit list</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-white mb-1">Start Tag (Older)</label>
            <select
              value={tagOnlyStart}
              onChange={(e) => handleTagStartChange(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
              disabled={selectionMode === 'commits'}
            >
              <option value="">Select start tag</option>
              <option value="HEAD">HEAD ({selectedBranch})</option>
              {tags.map(tag => (
                <option key={tag.name} value={tag.name}>{tag.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-white mb-1">End Tag (Newer)</label>
            <select
              value={tagOnlyEnd}
              onChange={(e) => handleTagEndChange(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
              disabled={selectionMode === 'commits'}
            >
              <option value="">Select end tag</option>
              <option value="HEAD">HEAD ({selectedBranch})</option>
              {tags.map(tag => (
                <option key={tag.name} value={tag.name}>{tag.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              if (!tagOnlyStart || !tagOnlyEnd) return;
              const diffKey = `${tagOnlyStart}...${tagOnlyEnd}`;
              if (!diffs[diffKey]) {
                setLoadingDiff(diffKey);
                try {
                  const res = await fetch(`https://api.github.com/repos/${repoData.owner.login}/${repoData.name}/compare/${tagOnlyStart}...${tagOnlyEnd}`);
                  if (!res.ok) throw new Error('Failed to fetch diff between tags');
                  const data: DiffResponse = await res.json();
                  setDiffs(prev => ({ ...prev, [diffKey]: data.files }));
                  setVisibleDiffs(prev => new Set([...prev, diffKey]));
                  // Show the diff by default when first loading
                  setShowAllTagDiffs(true);
                } catch (err) {
                  onError(err instanceof Error ? err.message : 'Failed to fetch tag diff');
                } finally {
                  setLoadingDiff(null);
                }
              } else {
                setVisibleDiffs(prev => new Set([...prev, diffKey]));
                setShowAllTagDiffs(true);
              }
            }}
            className="flex-1 border px-4 py-2 rounded bg-blue-500 text-white disabled:opacity-50"
            disabled={!tagOnlyStart || !tagOnlyEnd || loadingDiff !== null || selectionMode === 'commits'}
          >
            {loadingDiff === `${tagOnlyStart}...${tagOnlyEnd}` ? 'Loading...' : 'Compare Tags'}
          </button>
          {hasTagDiff && (
            <button
              onClick={handleShowAllTagDiffs}
              className="border px-4 py-2 rounded bg-gray-700 text-white disabled:opacity-50"
              disabled={loadingDiff !== null || selectionMode === 'commits'}
            >
              {showAllTagDiffs ? 'Hide All' : 'Show All'}
            </button>
          )}
        </div>
        {(() => {
          const diffKey = `${tagOnlyStart}...${tagOnlyEnd}`;
          return visibleDiffs.has(diffKey) && diffs[diffKey] ? (
            <div className="mt-4 bg-gray-900 p-4 rounded">
              <DiffView files={diffs[diffKey]} isInline={true} showFilename={true} initiallyExpanded={true} />
            </div>
          ) : null;
        })()}
      </div>

      {/* Commit Selection Box */}
      <div className={`bg-black p-4 rounded-lg border-2 ${selectionMode === 'commits' ? 'border-blue-500' : selectionMode === 'tags' ? 'border-gray-500 opacity-50' : 'border-gray-300'} mb-6`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">Select from Commit List</h3>
          {selectionMode === 'tags' && (
            <span className="text-sm text-gray-400">Disabled while comparing tags</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2 text-white">End Commit (Most Recent)</h3>
            {endCommit ? (
              <div className="bg-gray-800 p-3 rounded border border-gray-600 relative">
                {loadingCommit && (
                  <div className="absolute inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
                <button
                  onClick={handleClearEndCommit}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                  disabled={loadingCommit}
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

      {/* Search and Pagination Controls */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search commit messages..."
            value={searchText}
            onChange={(e) => onSearchTextChange(e.target.value)}
            className="border px-2 py-1 rounded flex-grow"
          />
          <div className="flex gap-2 items-center">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {currentPage}</span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasNextPage}
              className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Date</th>
              <th className="p-2">Message</th>
              <th className="p-2">Author</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {commits
              .filter((commit) => {
                const messageMatch = commit.commit.message.toLowerCase().includes(searchText.toLowerCase());
                return (!searchText || messageMatch);
              })
              .map((commit, index) => {
                const diffKey = index < commits.length - 1 ? `${commits[index + 1].sha}...${commit.sha}` : '';
                const tag = getTagForCommit(commit.sha);
                return (
                  <>
                    <tr
                      key={commit.sha}
                      className={`border-b ${getRowClassName(commit)}`}
                      onClick={() => isCommitClickable(commit) && handleCommitClick(commit)}
                    >
                      <td className="p-2">{new Date(commit.commit.author.date).toLocaleDateString()}</td>
                      <td className="p-2">
                        {commit.commit.message.length > 50 ? commit.commit.message.substring(0, 50) + '...' : commit.commit.message}
                        {tag && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                            {tag}
                          </span>
                        )}
                      </td>
                      <td className="p-2">{commit.commit.author.name}</td>
                      <td className="p-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDiff(commit.sha, index);
                          }}
                          className="px-2 py-1 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                          disabled={loadingDiff === commit.sha}
                        >
                          {loadingDiff === commit.sha ? 'Loading...' : 
                            (() => {
                              const olderCommit = findNextOlderCommit(commit.sha);
                              if (!olderCommit) return 'View Diff';
                              const diffKey = `${olderCommit.sha}...${commit.sha}`;
                              return visibleDiffs.has(diffKey) ? 'Hide Diff' : 'View Diff';
                            })()
                          }
                        </button>
                      </td>
                    </tr>
                    {(() => {
                      const olderCommit = findNextOlderCommit(commit.sha);
                      if (!olderCommit) return null;
                      const diffKey = `${olderCommit.sha}...${commit.sha}`;
                      return visibleDiffs.has(diffKey) && diffs[diffKey] ? (
                        <tr>
                          <td colSpan={4} className="p-2 bg-gray-900">
                            <DiffView 
                              files={diffs[diffKey]} 
                              isInline={true}
                              showFilename={true}
                              initiallyExpanded={true}
                            />
                          </td>
                        </tr>
                      ) : null;
                    })()}
                  </>
                );
              })}
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