export type EmbeddedChunk = {
    embedding: number[];
    file: string;
    content: string;
    startLine: number;
    endLine: number;
    summaryHint: string;
}