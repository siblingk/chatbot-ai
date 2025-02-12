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
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';

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
    <div className="mx-auto w-full max-w-2xl px-4">
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <h1 className="text-2xl font-bold">Welcome to Siblingk AI</h1>
        <p className="text-muted-foreground mt-2">
          Your personal automotive expert assistant. Let&apos;s start by getting
          to know your vehicle.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-5 w-5" />
            <span>Vehicle Information</span>
          </CardTitle>
          <CardDescription>
            Please provide your vehicle details to get personalized assistance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Toyota" {...field} />
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
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Corolla" {...field} />
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
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 2020" {...field} maxLength={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit">Start Chat</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          Get expert advice on maintenance, repairs, and everything about your
          vehicle
        </p>
      </div>
    </div>
  );
}
