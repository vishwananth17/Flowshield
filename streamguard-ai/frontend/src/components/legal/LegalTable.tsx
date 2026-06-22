import React, { ReactNode } from 'react';

interface LegalTableProps {
  headers: string[];
  rows: (string | ReactNode)[][];
}

export default function LegalTable({ headers, rows }: LegalTableProps) {
  return (
    <div className="overflow-x-auto w-full my-6 rounded-xl border border-[#1F2937] shadow-inner">
      <table className="w-full text-left border-collapse text-xs md:text-sm">
        <thead>
          <tr className="bg-[#0D1220] border-b border-[#1F2937]">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="py-3 px-4 text-white font-mono font-bold uppercase tracking-wider border-r border-[#1F2937] last:border-r-0"
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
              className="border-b border-[#1F2937] last:border-b-0 odd:bg-[#111827] even:bg-[#0F1623] hover:bg-slate-900/30 transition-colors"
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="py-3.5 px-4 text-[#9CA3AF] border-r border-[#1F2937] last:border-r-0 leading-relaxed font-sans"
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
