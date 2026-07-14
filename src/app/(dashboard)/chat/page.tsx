"use client";

import dynamic from 'next/dynamic';

const ChatInbox = dynamic(() => import('../../../components/chat/ChatInbox').then(m => m.ChatInbox), { ssr: false });

export default function ChatPage() {
  return <ChatInbox />;
}
