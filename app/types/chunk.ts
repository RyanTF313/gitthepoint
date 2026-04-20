export type FileData = {
  path: string;
  content: string;
};

export type Chunk = {
  file: string;
  content: string;
  startLine: number;
  endLine: number;
  summaryHint: string
};