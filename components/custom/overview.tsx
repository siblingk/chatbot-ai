import { motion } from 'framer-motion';
import { Car } from 'lucide-react';
import Link from 'next/link';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <Car size={32} />
        </p>
        <h2 className="text-2xl font-bold">¡Bienvenido a Siblingk!</h2>
        <p>
          Tu asistente virtual para encontrar el mejor taller mecánico para tu
          vehículo. Usando tecnología de IA avanzada, te ayudamos a:
        </p>
        <ul className="list-disc list-inside text-left space-y-2 mx-auto">
          <li>Diagnosticar problemas de tu vehículo</li>
          <li>Encontrar talleres especializados</li>
          <li>Obtener cotizaciones de servicios</li>
          <li>Agendar citas con talleres</li>
        </ul>
      </div>
    </motion.div>
  );
};
