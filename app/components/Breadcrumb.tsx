'use client';

import { useState } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  FileDiff, 
  FileText, 
  CheckCircle2,
  PlusCircle
} from 'lucide-react';

export type Step = {
  id: string;
  name: string;
  icon: React.ReactNode;
};

export const steps: Step[] = [
  { id: 'add-repo', name: 'Add a repo', icon: <PlusCircle className="w-5 h-5" /> },
  { id: 'changelog-action', name: 'Changelog action', icon: <GitBranch className="w-5 h-5" /> },
  { id: 'choose-commits', name: 'Choose commits', icon: <GitCommit className="w-5 h-5" /> },
  { id: 'review-diff', name: 'Review diff', icon: <FileDiff className="w-5 h-5" /> },
  { id: 'create-changelog', name: 'Create changelog', icon: <FileText className="w-5 h-5" /> },
  { id: 'published', name: 'Published', icon: <CheckCircle2 className="w-5 h-5" /> },
];

interface BreadcrumbProps {
  currentStep: string;
}

export default function Breadcrumb({ currentStep }: BreadcrumbProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center justify-center space-x-4 py-4">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          
          return (
            <li key={step.id} className="flex items-center">
              {index !== 0 && (
                <div className="h-0.5 w-8 bg-gray-300" />
              )}
              <div className="relative flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    isCurrent
                      ? 'border-2 border-blue-600 bg-white'
                      : isCompleted
                      ? 'bg-blue-600'
                      : 'border-2 border-gray-300 bg-white'
                  }`}
                >
                  <span
                    className={`${
                      isCurrent ? 'text-blue-600' : isCompleted ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {step.icon}
                  </span>
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step.name}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
} 