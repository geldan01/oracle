"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SkillContentProps {
  content: string;
}

export default function SkillContent({ content }: SkillContentProps) {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:tracking-tight prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-code:rounded prose-code:bg-stone-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-emerald-700 dark:prose-code:bg-stone-800 dark:prose-code:text-emerald-300 prose-pre:bg-stone-100 dark:prose-pre:bg-stone-900">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
