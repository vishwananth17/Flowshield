import React, { useState, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  label: string;
  code: string;
  language: 'bash' | 'python' | 'javascript' | 'json' | 'go' | 'php' | 'typescript';
}

interface CodeBlockProps {
  code?: string;
  language?: 'bash' | 'python' | 'javascript' | 'json' | 'go' | 'php' | 'typescript';
  filename?: string;
  tabs?: Tab[];
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, language = 'javascript', filename, tabs, showLineNumbers = false }: CodeBlockProps) {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const isTabs = tabs && tabs.length > 0;
  const currentCode = isTabs ? tabs[activeTabIdx].code : (code || '');
  const currentLanguage = isTabs ? tabs[activeTabIdx].language : language;
  const currentLabel = isTabs ? tabs[activeTabIdx].label : (filename || currentLanguage);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple syntax highlighter
  const highlightCode = (str: string, lang: string) => {
    if (!str) return '';
    let result = str;

    // Very basic regex replacements for visualization
    const escapeHTML = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    result = escapeHTML(result);

    if (lang === 'json') {
      result = result.replace(/(&quot;.*?&quot;)\s*:/g, '<span class="token-property">$1</span>:');
      result = result.replace(/: \s*([0-9.]+)/g, ': <span class="token-number">$1</span>');
      result = result.replace(/: \s*(&quot;.*?&quot;)/g, ': <span class="token-string">$1</span>');
    } else if (lang === 'bash') {
      result = result.replace(/^(curl|npm|git|echo) /gm, '<span class="token-keyword">$1</span> ');
      result = result.replace(/ (-X|--request|--header|-H|-d|--data) /g, ' <span class="token-keyword">$1</span> ');
      result = result.replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, '<span class="token-string">$1</span>');
      result = result.replace(/(https?:\/\/[^\s"']+)/g, '<span class="token-url">$1</span>');
    } else {
      // Python / JS
      result = result.replace(/\b(import|from|const|let|var|function|def|async|await|return|if|else|for|while|try|catch|class)\b/g, '<span class="token-keyword">$1</span>');
      result = result.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)/g, '<span class="token-string">$1</span>');
      result = result.replace(/\b([0-9.]+)\b/g, '<span class="token-number">$1</span>');
      result = result.replace(/^(#.*|\/\/.*)$/gm, '<span class="token-comment">$1</span>');
    }

    return result;
  };

  return (
    <div className="rounded-xl overflow-hidden bg-[#0D1117] border border-[#30363D] shadow-[0_8px_32px_rgba(0,0,0,0.4)] my-6">
      {/* Title Bar */}
      <div className="h-10 bg-[#161B22] border-b border-[#30363D] px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Traffic Lights */}
          <div className="flex space-x-2 group">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E] flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-[#4d0000] text-[8px] font-bold pb-px leading-none">×</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-[#5c3e00] text-[8px] font-bold leading-none">−</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29] flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-[#004d00] text-[8px] font-bold leading-none">+</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher or Filename */}
        {isTabs ? (
          <div className="flex space-x-4 h-full pt-1">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTabIdx(idx)}
                className={`text-xs font-mono px-2 h-full border-b-2 transition-colors ${
                  idx === activeTabIdx
                    ? 'border-[#3B82F6] text-white'
                    : 'border-transparent text-[#8B949E] hover:text-[#c9d1d9]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-[#8B949E] font-mono text-xs hidden sm:block">{currentLabel}</div>
        )}

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all duration-200 ${
            copied ? 'text-[#10B981]' : 'text-[#8B949E] hover:text-[#F9FAFB] hover:bg-[#1F2937]'
          }`}
        >
          {copied ? <Check size={14} className="text-[#10B981]" /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Code Area */}
      <div className="p-5 overflow-x-auto custom-scrollbar bg-[#0D1117]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTabIdx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            <pre className="font-mono text-[13px] leading-[1.7] text-[#E6EDF3] m-0">
              <code dangerouslySetInnerHTML={{ __html: highlightCode(currentCode, currentLanguage) }} />
            </pre>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
