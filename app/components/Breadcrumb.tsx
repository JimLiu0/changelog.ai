'use client';

import { useState } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  FileDiff, 
  FileText, 
  CheckCircle,
  PlusCircle
} from 'lucide-react';

export type StepId = 'add-repo' | 'choose-branch' | 'choose-commits' | 'review-diff' | 'create-changelog' | 'published';

export type Step = {
  id: StepId;
  name: string;
  icon: React.ReactNode;
};

export const steps: Step[] = [
  { id: 'add-repo', name: 'Add a repo', icon: <PlusCircle className="w-5 h-5" /> },
  { id: 'choose-branch', name: 'Choose branch', icon: <GitBranch className="w-5 h-5" /> },
  { id: 'choose-commits', name: 'Choose commits', icon: <GitCommit className="w-5 h-5" /> },
  { id: 'review-diff', name: 'Review diff', icon: <FileDiff className="w-5 h-5" /> },
  { id: 'create-changelog', name: 'Create changelog', icon: <FileText className="w-5 h-5" /> },
  { id: 'published', name: 'Published', icon: <CheckCircle className="w-5 h-5" /> }
];

interface BreadcrumbProps {
  currentStep: StepId;
  onStepClick: (stepId: StepId) => void;
}

export default function Breadcrumb({ currentStep, onStepClick }: BreadcrumbProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center justify-center space-x-4 py-4">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          const isClickable = isCompleted || isCurrent;
          
          return (
            <li key={step.id} className="flex items-center">
              {index !== 0 && (
                <div className={`h-0.5 w-8 ${isCompleted ? 'bg-blue-600' : 'bg-gray-300'}`} />
              )}
              <div className="relative flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                    isCurrent
                      ? 'border-2 border-blue-600 bg-white'
                      : isCompleted
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'border-2 border-gray-300 bg-white cursor-not-allowed'
                  }`}
                  title={isClickable ? `Go to ${step.name}` : 'Not available yet'}
                >
                  <span
                    className={`${
                      isCurrent ? 'text-blue-600' : isCompleted ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {step.icon}
                  </span>
                </button>
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