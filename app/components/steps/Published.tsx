'use client';

interface PublishedProps {
  title: string;
  content: string;
  onBack: () => void;
}

export default function Published({ title, content, onBack }: PublishedProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Changelog Published</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Start
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
          <div className="prose prose-invert max-w-none">
            {content.split('\n').map((line, i) => (
              <p key={i} className="text-gray-300">{line}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 