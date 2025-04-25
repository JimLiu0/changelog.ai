'use client';

import { useState } from 'react';

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

interface CreateChangelogProps {
  repoData: {
    owner: {
      login: string;
    };
    name: string;
  };
  selectedCommits: string[];
  commits: Commit[];
  onChangelogCreated: (title: string, content: string) => void;
  onError: (error: string) => void;
  onNextStep: () => void;
}

export default function CreateChangelog({
  repoData,
  selectedCommits,
  commits,
  onChangelogCreated,
  onError,
  onNextStep
}: CreateChangelogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleGenerateWithAI = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement AI generation
      // For now, just set placeholder content
      setTitle('Generated Changelog Title');
      setContent('Generated changelog content will appear here...');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to generate changelog');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    setIsLoading(true);
    try {
      // First create the changelog
      onChangelogCreated(title, content);
      // Then move to the next step
      onNextStep();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to publish changelog');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Create Changelog</h2>
        <button
          onClick={handleGenerateWithAI}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Generate with AI'}
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter changelog title..."
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter changelog content..."
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handlePublish}
            disabled={isLoading || !title || !content}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isLoading ? 'Publishing...' : 'Publish Changelog'}
          </button>
        </div>
      </div>
    </div>
  );
} 