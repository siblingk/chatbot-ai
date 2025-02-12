import { motion } from 'framer-motion';
import { Car } from 'lucide-react';

interface OverviewProps {
  vehicleInfo?: {
    brand: string;
    model: string;
    year: string;
  };
}

export const Overview = ({ vehicleInfo }: OverviewProps) => {
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
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">
            Hi! I&apos;m your automotive expert assistant
          </h2>
          <p className="text-muted-foreground">
            {vehicleInfo ? (
              <>
                I see you have a {vehicleInfo.year} {vehicleInfo.brand}{' '}
                {vehicleInfo.model}. How can I assist you with your vehicle
                today?
              </>
            ) : (
              <>
                I notice you&apos;re looking for help with your vehicle. Tell me
                more about the issue you&apos;re experiencing, and I&apos;ll
                help you find a quick solution.
              </>
            )}
          </p>
          <p className="text-sm text-muted-foreground">I can help you with:</p>
          <ul className="mx-auto list-inside list-disc space-y-2 text-left text-muted-foreground">
            <li>Diagnosing vehicle problems</li>
            <li>Maintenance recommendations</li>
            <li>Finding the right repair shop</li>
            <li>Cost estimates for repairs</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};
