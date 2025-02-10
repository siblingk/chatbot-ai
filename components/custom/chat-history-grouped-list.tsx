'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Chat } from '@/lib/supabase/types';

import { MoreHorizontalIcon, TrashIcon } from './icons';

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

// Memoized group header
const GroupHeader = memo(function GroupHeader({ title }: { title: string }) {
  return (
    <div className="mt-6 px-2 py-1 text-xs text-sidebar-foreground/50 first:mt-0">
      {title}
    </div>
  );
});

// Memoized chat item
const ChatItem = memo(function ChatItem({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) {
  return (
    <SidebarMenuItem className={isActive ? 'bg-sidebar-accent' : ''}>
      <Link
        href={`/chat/${chat.id}`}
        onClick={() => setOpenMobile(false)}
        className="flex w-full items-center justify-between"
      >
        <span className="truncate">{chat.title || 'Nueva conversación'}</span>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button className="rounded-md p-1 hover:bg-sidebar-accent">
              <MoreHorizontalIcon />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onDelete(chat.id)}>
              <TrashIcon />
              <span>Eliminar chat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Link>
    </SidebarMenuItem>
  );
});

// Group chats by date
function groupChatsByDate(chats: Chat[]): GroupedChats {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.created_at);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats
  );
}

export function GroupedChatList({
  chats,
  currentChatId,
  setOpenMobile,
}: {
  chats: Chat[];
  currentChatId: string;
  setOpenMobile: (open: boolean) => void;
}) {
  const router = useRouter();
  const groupedChats = groupChatsByDate(chats);

  const handleDelete = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat?id=${chatId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete chat');

      toast.success('Chat deleted successfully');

      if (chatId === currentChatId) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {groupedChats.today.length > 0 && (
            <>
              <GroupHeader title="Today" />
              {groupedChats.today.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === currentChatId}
                  onDelete={handleDelete}
                  setOpenMobile={setOpenMobile}
                />
              ))}
            </>
          )}

          {groupedChats.yesterday.length > 0 && (
            <>
              <GroupHeader title="Yesterday" />
              {groupedChats.yesterday.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === currentChatId}
                  onDelete={handleDelete}
                  setOpenMobile={setOpenMobile}
                />
              ))}
            </>
          )}

          {groupedChats.lastWeek.length > 0 && (
            <>
              <GroupHeader title="Last 7 days" />
              {groupedChats.lastWeek.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === currentChatId}
                  onDelete={handleDelete}
                  setOpenMobile={setOpenMobile}
                />
              ))}
            </>
          )}

          {groupedChats.lastMonth.length > 0 && (
            <>
              <GroupHeader title="Last 30 days" />
              {groupedChats.lastMonth.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === currentChatId}
                  onDelete={handleDelete}
                  setOpenMobile={setOpenMobile}
                />
              ))}
            </>
          )}

          {groupedChats.older.length > 0 && (
            <>
              <GroupHeader title="Older" />
              {groupedChats.older.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === currentChatId}
                  onDelete={handleDelete}
                  setOpenMobile={setOpenMobile}
                />
              ))}
            </>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
