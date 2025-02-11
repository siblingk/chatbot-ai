import { CoreTool } from 'ai';
import { z } from 'zod';

export interface StreamTextResult<
  T extends Record<string, CoreTool<any, any>>,
> {
  stream: ReadableStream;
}

export interface CreateDocumentTool {
  description: string;
  parameters: z.ZodObject<{
    title: z.ZodString;
  }>;
  execute: (args: { title: string }) => Promise<{
    id: string;
    title: string;
    content: string;
  }>;
}

export interface UpdateDocumentTool {
  description: string;
  parameters: z.ZodObject<{
    id: z.ZodString;
    content: z.ZodString;
  }>;
  execute: (args: { id: string; content: string }) => Promise<{
    id: string;
    title: string;
    content: string;
  }>;
}

export interface RequestSuggestionsTool {
  description: string;
  parameters: z.ZodObject<{
    documentId: z.ZodString;
    originalText: z.ZodString;
    suggestedText: z.ZodString;
    description: z.ZodString;
  }>;
  execute: (args: {
    documentId: string;
    originalText: string;
    suggestedText: string;
    description: string;
  }) => Promise<{
    id: string;
    userId: string;
    documentId: string;
    documentCreatedAt: string;
    originalText: string;
    suggestedText: string;
    description?: string;
    isResolved: boolean;
  }>;
}

export interface ChatTools extends Record<string, CoreTool<any, any>> {
  createDocument: CreateDocumentTool;
  updateDocument: UpdateDocumentTool;
  requestSuggestions: RequestSuggestionsTool;
}
