"use client";
import { useState } from "react";
import { Source } from "../types";

type QuestionFormProps = {
  disabled: boolean;
  repoId: string;
  setAnswer: React.Dispatch<React.SetStateAction<string>>;
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
};

export default function QuestionForm({
  disabled = true,
  repoId,
  setAnswer,
  setSources,
}: QuestionFormProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId: repoId, question }),
      });

      if (!response.ok) throw new Error("Failed to submit");
      const data = await response.json();

      console.log({ data });
      setAnswer(data?.answer || "");
      setSources(data?.sources || "");

      setSuccess("Question submitted successfully");
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto p-4">
      <label htmlFor="question" className="block text-sm font-medium mb-2">
        Ask a question
      </label>
      <fieldset disabled={disabled}>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question here..."
          required
          className="w-full p-2 border border-gray-300 rounded-md mb-3"
          rows={4}
        />
        <button
          type="submit"
          disabled={disabled || loading}
          className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-md transition ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
        {error && (
          <p className="mt-2 text-red-600">Error when submitting: {error}</p>
        )}
        {success && (
          <p className="mt-2 text-green-600">
            <p className="text-green-600 text-sm mt-2">Question submitted!</p>
          </p>
        )}
      </fieldset>
    </form>
  );
}
