'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { processPDF, searchPDF } from '@/lib/pdf-loader';
import { Document } from '@langchain/core/documents';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChatResponse {
  answer: string;
  sources?: Document[];
}

export function PDFSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfProcessed, setIsPdfProcessed] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    setIsLoading(true);
    setError('');
    setResponse(null);
    setIsPdfProcessed(false);

    try {
      const file = e.target.files[0];
      setCurrentFileName(file.name);
      await processPDF(file);
      setIsPdfProcessed(true);
    } catch (error) {
      console.error('Error uploading PDF:', error);
      setError('Error al procesar el PDF. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPdfProcessed || !query.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Primero obtenemos los documentos relevantes
      const searchResults = await searchPDF(query);

      // Luego enviamos la pregunta al endpoint de chat
      const chatResponse = await fetch('/api/chat-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          vectors: searchResults.map((doc) => ({
            pageContent: doc.pageContent,
            metadata: doc.metadata,
          })),
        }),
      });

      if (!chatResponse.ok) {
        const errorData = await chatResponse.json();
        throw new Error(errorData.error || 'Error al procesar la pregunta');
      }

      const data = await chatResponse.json();
      setResponse({
        answer: data.answer,
        sources: searchResults,
      });
    } catch (error) {
      console.error('Error searching PDF:', error);
      setError('Error al buscar en el PDF. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      <div className="space-y-2">
        <Input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          disabled={isLoading}
        />
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {currentFileName ? 'Procesando PDF...' : 'Cargando...'}
          </div>
        )}
        {isPdfProcessed && !isLoading && (
          <p className="text-sm text-green-600">
            PDF "{currentFileName}" procesado correctamente
          </p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <form onSubmit={handleSearch} className="space-y-2">
        <Input
          type="text"
          placeholder="Hazme una pregunta sobre el contenido del PDF..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!isPdfProcessed || isLoading}
        />
        <Button
          type="submit"
          disabled={!isPdfProcessed || !query.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Preguntar
        </Button>
      </form>

      {response && (
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-2">Respuesta:</h3>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{response.answer}</p>
            </div>
          </Card>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Fuentes relevantes:
            </h4>
            {response.sources?.map((doc, index) => (
              <Card
                key={index}
                className={cn(
                  'p-3 text-sm bg-muted/50',
                  'hover:bg-muted/70 transition-colors'
                )}
              >
                <p className="whitespace-pre-wrap">{doc.pageContent}</p>
                {doc.metadata?.loc?.pageNumber && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Página: {doc.metadata.loc.pageNumber}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
