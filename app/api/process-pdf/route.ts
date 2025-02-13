import { NextRequest, NextResponse } from 'next/server';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';

export async function POST(request: NextRequest) {
  try {
    console.log('Recibiendo solicitud de procesamiento de PDF...');

    const formData = await request.formData();
    const text = formData.get('text') as string;

    if (!text) {
      console.error('No se proporcionó texto para procesar');
      return NextResponse.json(
        { error: 'No se proporcionó texto para procesar' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY no está configurada');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    console.log('Dividiendo texto en chunks...');
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.createDocuments([text]);
    console.log(`Texto dividido en ${docs.length} chunks`);

    console.log('Generando embeddings con OpenAI...');
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    console.log('Procesando documentos...');
    const vectors = await Promise.all(
      docs.map(async (doc) => {
        const embedding = await embeddings.embedQuery(doc.pageContent);
        return {
          text: doc.pageContent,
          metadata: doc.metadata,
          embedding,
        };
      })
    );

    console.log(
      `Embeddings generados exitosamente para ${vectors.length} chunks`
    );
    return NextResponse.json({ vectors });
  } catch (error) {
    console.error('Error detallado al procesar PDF:', error);
    return NextResponse.json(
      { error: 'Error al procesar el PDF: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
