"use client";
import IngestForm from "./components/ingestForm";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-8"> Git The Point:</h1>
        <h3 className="text-center mb-8">Your New Favorite Code Repository Analyzer</h3>
        <IngestForm />
      </div>
    </div>
  );
}
