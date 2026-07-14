"use client";

import dynamic from 'next/dynamic';

const PipelineBoard = dynamic(() => import('../../../components/pipeline/PipelineBoard').then(m => m.PipelineBoard), { ssr: false });

export default function PipelinePage() {
  return <PipelineBoard />;
}
