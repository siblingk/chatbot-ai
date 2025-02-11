'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { getAllPrompts } from '@/ai/prompts';
import type { Prompt } from '@/ai/prompts';

interface PromptSelectorProps {
  onSelect?: (prompt: Prompt) => void;
  className?: string;
}

export function PromptSelector({ onSelect, className }: PromptSelectorProps) {
  const [open, setOpen] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt>();

  useEffect(() => {
    const loadPrompts = async () => {
      const allPrompts = await getAllPrompts();
      setPrompts(allPrompts);
      // Seleccionar el primer prompt por defecto
      if (allPrompts.length > 0 && !selectedPrompt) {
        setSelectedPrompt(allPrompts[0]);
        onSelect?.(allPrompts[0]);
      }
    };
    loadPrompts();
  }, []);

  const handleSelect = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    onSelect?.(prompt);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          {selectedPrompt ? selectedPrompt.name : 'Seleccionar prompt...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar prompt..." />
          <CommandEmpty>No se encontraron prompts.</CommandEmpty>
          <CommandGroup>
            {prompts.map((prompt) => (
              <CommandItem
                key={prompt.id}
                onSelect={() => handleSelect(prompt)}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedPrompt?.id === prompt.id
                      ? 'opacity-100'
                      : 'opacity-0'
                  )}
                />
                {prompt.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
