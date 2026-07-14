"use client";

import dynamic from 'next/dynamic';

const TaskList = dynamic(() => import('../../../components/tasks/TaskList').then(m => m.TaskList), { ssr: false });

export default function TasksPage() {
  return <TaskList />;
}
