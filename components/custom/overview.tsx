import { motion } from 'framer-motion';
import { Car } from 'lucide-react';

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
        </p>
        <h2 className="text-2xl font-bold">Welcome to Siblingk!</h2>
        <p>
          Your virtual assistant to find the best auto repair shop for your
          vehicle. Using advanced AI technology, we help you:
        </p>
        <ul className="mx-auto list-inside list-disc space-y-2 text-left">
          <li>Diagnose your vehicle problems</li>
          <li>Find specialized repair shops</li>
          <li>Get service quotes</li>
          <li>Schedule appointments with repair shops</li>
        </ul>
      </div>
    </motion.div>
  );
};
