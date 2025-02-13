import { NextRequest, NextResponse } from 'next/server';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from '@langchain/core/prompts';

const SYSTEM_TEMPLATE = `Eres un asistente experto que ayuda a responder preguntas basadas en el contexto proporcionado.
Usa solo la información del contexto proporcionado para responder las preguntas.
Si no puedes encontrar la respuesta en el contexto, indica que no puedes responder basado en la información disponible.
Si la pregunta no está relacionada con el contexto, indica que solo puedes responder preguntas relacionadas con el documento proporcionado.

Contexto:
{context}`;

const HUMAN_TEMPLATE = '{question}';

export async function POST(request: NextRequest) {
  try {
    const { query, vectors } = await request.json();

    if (!query || !vectors?.length) {
      return NextResponse.json(
        { error: 'Se requiere una pregunta y vectores' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    // Recrear documentos y obtener el contexto
    const documents = vectors.map(
      (vector: any) =>
        new Document({
          pageContent: vector.pageContent,
          metadata: vector.metadata,
        })
    );

    // Unir todo el texto de los documentos como contexto
    const context = documents.map((doc) => doc.pageContent).join('\n\n---\n\n');

    // Configurar el modelo
    const model = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.2,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Crear el prompt
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(SYSTEM_TEMPLATE),
      HumanMessagePromptTemplate.fromTemplate(HUMAN_TEMPLATE),
    ]);

    // Generar los mensajes
    const messages = await prompt.formatMessages({
      context,
      question: query,
    });

    // Obtener la respuesta
    const response = await model.invoke(messages);

    return NextResponse.json({ answer: response.content });
  } catch (error) {
    console.error('Error detallado al procesar la pregunta:', error);
    return NextResponse.json(
      {
        error: 'Error al procesar la pregunta: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
