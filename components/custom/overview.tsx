import { motion } from 'framer-motion';
import { Car, FileText } from 'lucide-react';
import { PDFSearch } from './pdf-search';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="mx-auto max-w-3xl md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex max-w-xl flex-col gap-8 rounded-xl p-6 text-center leading-relaxed">
        <p className="flex flex-row items-center justify-center gap-4">
          <Car size={32} />
          <FileText size={32} />
        </p>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">
            ¡Hola! Soy tu asistente experto automotriz
          </h2>
          <p className="text-muted-foreground">
            Cuéntame más sobre el problema que estás experimentando y te ayudaré
            a encontrar una solución rápida.
          </p>
          <p className="text-sm text-muted-foreground">Te puedo ayudar con:</p>
          <ul className="mx-auto list-inside list-disc space-y-2 text-left text-muted-foreground">
            <li>Diagnóstico de problemas del vehículo</li>
            <li>Recomendaciones de mantenimiento</li>
            <li>Encontrar el taller adecuado</li>
            <li>Estimaciones de costos de reparación</li>
            <li>Búsqueda semántica en documentos PDF</li>
          </ul>
        </div>

        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">
            Búsqueda Semántica en PDFs
          </h3>
          <PDFSearch />
        </div>
      </div>
    </motion.div>
  );
};
