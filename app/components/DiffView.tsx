'use client';

import { useState } from 'react';

interface DiffFile {
  filename: string;
  patch?: string;
}

interface DiffViewProps {
  files: DiffFile[];
  isInline?: boolean;
  showFilename?: boolean;
  initiallyExpanded?: boolean;
}

export default function DiffView({ 
  files, 
  isInline = false, 
  showFilename = true,
  initiallyExpanded = true 
}: DiffViewProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(
    initiallyExpanded ? new Set(files.map(f => f.filename)) : new Set()
  );

  const toggleFile = (filename: string) => {
    setExpandedFiles((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (expandedFiles.size === files.length) {
      setExpandedFiles(new Set());
    } else {
      setExpandedFiles(new Set(files.map(f => f.filename)));
    }
  };

  return (
    <div className={`${isInline ? '' : 'bg-black p-4 rounded-lg border border-gray-200'}`}>
      {!isInline && files.length > 1 && (
        <div className="flex justify-between items-center mb-4">
          <p>
            <strong>Files Changed:</strong> {files.length}
          </p>
          <button
            onClick={toggleAll}
            className="px-3 py-1 text-sm bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            {expandedFiles.size === files.length ? 'Hide All' : 'Show All'}
          </button>
        </div>
      )}
      {files.map((file) => (
        <div key={file.filename} className={`${isInline ? '' : 'mb-6'}`}>
          {showFilename && (
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">{file.filename}</h3>
              <button
                onClick={() => toggleFile(file.filename)}
                className="px-2 py-1 text-sm bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                {expandedFiles.has(file.filename) ? 'Hide' : 'Show'}
              </button>
            </div>
          )}
          {file.patch ? (
            expandedFiles.has(file.filename) ? (
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
            ) : null
          ) : (
            <p className="text-gray-500">No changes in this file</p>
          )}
        </div>
      ))}
    </div>
  );
} 