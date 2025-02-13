import { NextRequest, NextResponse } from 'next/server';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

export async function POST(request: NextRequest) {
  try {
    const { query, vectors } = await request.json();

    if (!query || !vectors || !vectors.length) {
      return NextResponse.json(
        { error: 'Query and vectors are required' },
        { status: 400 }
      );
    }

    // Recrear los documentos
    const documents = vectors.map(
      (vector: any) =>
        new Document({
          pageContent: vector.text,
          metadata: vector.metadata,
        })
    );

    // Crear vector store
    const embeddings = new OpenAIEmbeddings();
    const vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      embeddings
    );

    // Realizar búsqueda
    const results = await vectorStore.similaritySearch(query, 4);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching PDF:', error);
    return NextResponse.json({ error: 'Error searching PDF' }, { status: 500 });
  }
}
