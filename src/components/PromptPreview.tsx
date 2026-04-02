import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface PromptPreviewProps {
  content: string;
}

export default function PromptPreview({ content }: PromptPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl shadow-sm overflow-hidden border border-slate-800">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <h3 className="text-sm font-medium text-slate-200">预览 & 复制</h3>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            copied 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
          }`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? '已复制' : '一键复制'}
        </button>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300 leading-relaxed">
          {content || <span className="text-slate-600 italic">预览将在此处显示...</span>}
        </pre>
      </div>
    </div>
  );
}
