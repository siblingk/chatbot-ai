'use server';

import { CoreMessage, CoreUserMessage, generateText } from 'ai';
import { cookies } from 'next/headers';

import { customModel } from '@/ai';

export async function saveModelId(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('model-id', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: CoreUserMessage;
}) {
  const { text: title } = await generateText({
    model: customModel('gpt-4o-mini'),
    system: `\n
    - Eres un experto en identificar marcas y modelos de carros
    - Tu tarea es extraer el nombre del carro (marca y modelo) del mensaje del usuario
    - Si el usuario menciona múltiples carros, usa solo el primero mencionado
    - Si no se menciona ningún carro específico, responde con "Nueva consulta"
    - Mantén el formato original del nombre del carro (mayúsculas/minúsculas)
    - No agregues texto adicional, solo el nombre del carro
    - Ejemplos:
      Input: "Tengo problemas con mi Toyota Corolla 2020"
      Output: Toyota Corolla 2020
      
      Input: "Mi BMW no arranca"
      Output: BMW
      
      Input: "¿Cuál es el mejor aceite para carros?"
      Output: Nueva consulta`,
    prompt: JSON.stringify(message),
  });

  return title;
}
