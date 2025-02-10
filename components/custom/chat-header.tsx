'use client';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useWindowSize } from 'usehooks-ts';

import { SidebarToggle } from '@/components/custom/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { BetterTooltip } from '@/components/ui/tooltip';

import { PlusIcon } from './icons';
import { useSidebar } from '../ui/sidebar';

export function ChatHeader({ selectedModelId }: { selectedModelId: string }) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();
  const { setTheme } = useTheme();

  return (
    <header className="sticky top-0 flex items-center justify-between gap-2 bg-background px-2 py-1.5 md:px-2">
      <div className="flex flex-row gap-2">
        <SidebarToggle />
        {(!open || windowWidth < 768) && (
          <BetterTooltip content="Nueva Consulta">
            <Button
              variant="outline"
              className="order-2 ml-auto px-2 md:order-1 md:ml-0 md:h-fit md:px-2"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">Nueva Consulta</span>
            </Button>
          </BetterTooltip>
        )}
      </div>
    </header>
  );
}
