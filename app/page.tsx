'use client'
import { useState } from "react";
import Breadcrumb from './components/Breadcrumb';
import AddRepo from './components/steps/AddRepo';
import ChangelogAction from './components/steps/ChangelogAction';
import ChooseCommits from './components/steps/ChooseCommits';
import ReviewDiff from './components/steps/ReviewDiff';
import CreateChangelog from './components/steps/CreateChangelog';

type Step = 'add-repo' | 'changelog-action' | 'choose-commits' | 'review-diff' | 'create-changelog' | 'published';

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

interface Diff {
  files: Array<{
    filename: string;
    patch: string;
  }>;
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [page, setPage] = useState(1);
  const [diffs, setDiffs] = useState<Record<string, Diff>>({});
  const [tags, setTags] = useState<any[]>([]);
  const [shownDiffs, setShownDiffs] = useState<Record<string, boolean>>({});
  const [searchText, setSearchText] = useState("");
  const [selectedCommits, setSelectedCommits] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>('add-repo');

  const handleRepoSelected = async (data: RepoData) => {
    setRepoData(data);
    setSelectedBranch(data.default_branch || "main");
    
    try {
      // Fetch branches
      const branchesRes = await fetch(`https://api.github.com/repos/${data.owner.login}/${data.name}/branches`);
      if (!branchesRes.ok) throw new Error("Failed to fetch branches.");
      const branchesData = await branchesRes.json();
      setBranches(branchesData);

      // Fetch tags
      const tagsRes = await fetch(`https://api.github.com/repos/${data.owner.login}/${data.name}/tags`);
      if (!tagsRes.ok) throw new Error("Failed to fetch tags.");
      const tagsData = await tagsRes.json();
      setTags(tagsData);

      // Fetch commits
      await fetchCommits(data.owner.login, data.name, data.default_branch || "main", 1);
      
      setCurrentStep('changelog-action');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  const fetchCommits = async (owner: string, repo: string, branch: string, pageNum: number) => {
    try {
      const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&per_page=20&page=${pageNum}`);
      if (!commitsRes.ok) throw new Error("Failed to fetch commits.");
      const commitsData = await commitsRes.json();
      setCommits(commitsData);
      setPage(pageNum);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  const handleBranchChange = async (branch: string) => {
    setSelectedBranch(branch);
    if (repoData) {
      await fetchCommits(repoData.owner.login, repoData.name, branch, 1);
    }
  };

  const handleCommitsSelected = (commits: string[]) => {
    setSelectedCommits(commits);
  };

  const handleNextStep = () => {
    if (selectedCommits.length === 2) {
      setCurrentStep('review-diff');
    }
  };

  const handleCreateChangelog = () => {
    // Handle changelog creation
    setCurrentStep('choose-commits');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'add-repo':
        return <AddRepo onRepoSelected={handleRepoSelected} onError={setError} />;
      
      case 'changelog-action':
        return repoData && (
          <ChangelogAction
            repoData={repoData}
            branches={branches}
            selectedBranch={selectedBranch}
            onBranchSelected={handleBranchChange}
            onError={setError}
            onNextStep={handleCreateChangelog}
          />
        );
      
      case 'choose-commits':
        return repoData && (
          <ChooseCommits
            repoData={repoData}
            selectedBranch={selectedBranch}
            commits={commits}
            selectedCommits={selectedCommits}
            searchText={searchText}
            onSearchTextChange={setSearchText}
            onCommitsSelected={handleCommitsSelected}
            onError={setError}
            onNextStep={handleNextStep}
          />
        );
      
      case 'review-diff':
        return repoData && selectedCommits.length === 2 && (
          <ReviewDiff
            repoData={repoData}
            selectedCommits={selectedCommits}
            commits={commits}
            onError={setError}
          />
        );
      
      case 'create-changelog':
        return repoData && selectedCommits.length === 2 && (
          <CreateChangelog
            repoData={repoData}
            selectedCommits={selectedCommits}
            commits={commits}
            onChangelogCreated={handleCreateChangelog}
            onError={setError}
          />
        );
      
      case 'published':
        return (
          <div className="w-full">
            <h2 className="text-xl font-bold mb-4">Changelog Published</h2>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800">Your changelog has been successfully published!</p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-4xl">
        <Breadcrumb currentStep={currentStep} />
        
        {error && (
          <div className="w-full bg-red-50 p-4 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {renderStep()}
      </main>
    </div>
  );
}
