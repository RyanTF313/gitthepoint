import ArchitectureSummary from "@/app/components/architectureSummary";
import FileHighlights from "@/app/components/fileHighlights";
import ConversationalChat from "@/app/components/conversationalChat";
import Link from "next/link";

export const metadata = {
  title: "Repository Analysis",
  description: "View repository analysis results",
};

interface ResultsPageProps {
  params: Promise<{
    repoId: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function ResultsPage({
  params,
  searchParams,
}: ResultsPageProps) {
  const { repoId } = await params;
  const { token } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analysis Results
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Repository ID:{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">{repoId}</code>
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            ← Analyze Another
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ArchitectureSummary repoId={repoId} accessToken={token} />
            <FileHighlights repoId={repoId} accessToken={token} />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 h-96">
              <ConversationalChat repoId={repoId} accessToken={token} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
