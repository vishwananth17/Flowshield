import React, { ReactNode } from 'react';

interface LegalTableProps {
  headers: string[];
  rows: (string | ReactNode)[][];
}

export default function LegalTable({ headers, rows }: LegalTableProps) {
  return (
    <div className="overflow-x-auto w-full my-6 rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-inner">
      <table className="w-full text-left border-collapse text-xs md:text-sm">
        <thead>
          <tr className="bg-[var(--bg-inset)] border-b border-[var(--border-default)]">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="py-3 px-4 text-white font-mono font-bold uppercase tracking-wider border-r border-[var(--border-default)] last:border-r-0"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-b border-[var(--border-subtle)] last:border-b-0 odd:bg-[var(--bg-surface)] even:bg-[var(--bg-inset)] hover:bg-[var(--bg-highlight)] transition-colors"
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="py-3.5 px-4 text-[var(--text-secondary)] border-r border-[var(--border-default)] last:border-r-0 leading-relaxed"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
