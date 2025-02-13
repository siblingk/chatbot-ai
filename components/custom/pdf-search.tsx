'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { processPDF, searchPDF } from '@/lib/pdf-loader';
import { Document } from '@langchain/core/documents';
import { Loader2 } from 'lucide-react';

export function PDFSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfProcessed, setIsPdfProcessed] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    setIsLoading(true);
    setError('');
    setResults([]);
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
      const searchResults = await searchPDF(query);
      setResults(searchResults);
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
          placeholder="Escribe tu pregunta sobre el PDF..."
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
          Buscar
        </Button>
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Resultados:</h3>
          {results.map((doc, index) => (
            <div key={index} className="p-4 border rounded-lg bg-background/50">
              <p className="whitespace-pre-wrap">{doc.pageContent}</p>
              {doc.metadata?.loc?.pageNumber && (
                <p className="text-sm text-muted-foreground mt-2">
                  Página: {doc.metadata.loc.pageNumber}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
