import { Document } from '@langchain/core/documents';

// Importación dinámica de PDF.js para evitar problemas de SSR
let pdfjsLib: any;
let storedVectors: any[] = [];
let isInitialized = false;

async function initializePdfLib() {
  if (typeof window === 'undefined') return;

  try {
    console.log('Inicializando PDF.js...');
    const pdf = await import('pdfjs-dist/build/pdf');
    pdfjsLib = pdf;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    isInitialized = true;
    console.log('PDF.js inicializado correctamente');
  } catch (error) {
    console.error('Error inicializando PDF.js:', error);
    throw error;
  }
}

export async function processPDF(file: File) {
  try {
    console.log('Iniciando procesamiento de PDF...');

    if (!isInitialized) {
      console.log('PDF.js no inicializado, inicializando...');
      await initializePdfLib();
    }

    if (!pdfjsLib) {
      throw new Error('PDF.js no pudo ser inicializado');
    }

    console.log('Convirtiendo archivo a ArrayBuffer...');
    const arrayBuffer = await file.arrayBuffer();

    console.log('Cargando PDF con PDF.js...');
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    console.log(`PDF cargado. Procesando ${pdf.numPages} páginas...`);
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Procesando página ${i}...`);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    console.log('Enviando texto al servidor para procesamiento...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('text', fullText);

    const response = await fetch('/api/process-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error en la respuesta del servidor:', errorData);
      throw new Error(errorData.error || 'Error processing PDF');
    }

    const { vectors } = await response.json();
    console.log('Vectores recibidos correctamente');
    storedVectors = vectors;

    return true;
  } catch (error) {
    console.error('Error detallado al procesar PDF:', error);
    throw error;
  }
}

export async function searchPDF(query: string): Promise<Document[]> {
  try {
    console.log('Iniciando búsqueda con query:', query);

    if (!storedVectors.length) {
      throw new Error('No PDF has been processed yet');
    }

    const response = await fetch('/api/search-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        vectors: storedVectors,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error en la respuesta de búsqueda:', errorData);
      throw new Error(errorData.error || 'Error searching PDF');
    }

    const { results } = await response.json();
    console.log('Resultados de búsqueda recibidos:', results.length);
    return results;
  } catch (error) {
    console.error('Error detallado en búsqueda:', error);
    throw error;
  }
}
