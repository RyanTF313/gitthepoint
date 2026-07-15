export default function About() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold mb-6">About Git The Point</h1>
      <p className="text-lg text-gray-700 mb-4">
        Git The Point helps you understand public GitHub repositories with
        retrieval-augmented generation. It indexes source files, embeds them,
        and answers architecture and implementation questions grounded in the
        code.
      </p>
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">How it works</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          <li>Paste a public GitHub repository URL</li>
          <li>We download, filter, chunk, and embed supported source files</li>
          <li>Vectors are stored in ChromaDB for retrieval</li>
          <li>Ask questions or generate an architecture summary</li>
        </ol>
      </section>
    </div>
  );
}
