'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Car } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const vehicleSchema = z.object({
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  year: z
    .string()
    .min(4, 'Year must be 4 digits')
    .max(4, 'Year must be 4 digits')
    .regex(/^\d+$/, 'Year must be a number')
    .refine((val) => {
      const year = parseInt(val);
      const currentYear = new Date().getFullYear();
      return year >= 1900 && year <= currentYear + 1;
    }, 'Invalid year'),
});

type VehicleInfo = z.infer<typeof vehicleSchema>;

interface VehicleInfoFormProps {
  onSubmit: (data: VehicleInfo) => void;
}

export function VehicleInfoForm({ onSubmit }: VehicleInfoFormProps) {
  const form = useForm<VehicleInfo>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      brand: '',
      model: '',
      year: '',
    },
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 md:px-0">
      <div className="flex flex-col items-center justify-center space-y-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome to Siblingk AI
            </h1>
            <p className="text-muted-foreground">
              Let&apos;s get started by learning about your vehicle
            </p>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6"
          >
            <div className="grid gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Brand (e.g. Toyota)"
                        {...field}
                        className="h-12 bg-muted/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Model (e.g. Corolla)"
                        {...field}
                        className="h-12 bg-muted/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Year (e.g. 2020)"
                        {...field}
                        maxLength={4}
                        className="h-12 bg-muted/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" size="lg" className="w-full md:w-auto">
              Start Chat
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
