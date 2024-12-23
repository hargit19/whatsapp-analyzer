"use client";   

// src/components/ChatAnalyzer.tsx
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalysisResult, ChatMessage } from '../types/types';
import { parseChat } from '../utils/parser';

const findUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };
  
  const MessageContent = ({ content }: { content: string }) => {
    const [hoveredLink, setHoveredLink] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
    // Split content into parts (text and links)
    const parts = content.split(/(https?:\/\/[^\s]+)/g);
  
    const handleMouseMove = (e: React.MouseEvent, link: string) => {
      setHoveredLink(link);
      setTooltipPosition({
        x: e.clientX,
        y: e.clientY
      });
    };
  
    const handleMouseLeave = () => {
      setHoveredLink(null);
    };
  
    return (
      <div className="relative text-gray-300 whitespace-pre-wrap">
        {parts.map((part, index) => {
          const isLink = /^https?:\/\//.test(part);
          
          if (isLink) {
            return (
              <span
                key={index}
                className="text-cyan-400 cursor-pointer relative group"
                onMouseMove={(e) => handleMouseMove(e, part)}
                onMouseLeave={handleMouseLeave}
                onClick={() => window.open(part, '_blank')}
              >
                {part}
                {hoveredLink === part && (
                  <div 
                    className="fixed z-50 bg-gray-900 text-cyan-400 px-3 py-1.5 rounded-lg shadow-xl border border-cyan-500 text-sm font-medium transform -translate-x-1/2 -translate-y-full"
                    style={{
                      left: tooltipPosition.x,
                      top: tooltipPosition.y - 10
                    }}
                  >
                    Go to Link
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900 border-r border-b border-cyan-500"></div>
                  </div>
                )}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  const CategorySection = ({ title, messages }: { title: string; messages: ChatMessage[] }) => (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 transition-all duration-200 hover:shadow-2xl border border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-cyan-400 flex items-center justify-between">
        <span className="capitalize">{title.replace(/_/g, ' ')}</span>
        <span className="text-sm font-normal text-cyan-600 px-3 py-1 bg-cyan-950/50 rounded-full">
          {messages.length} items
        </span>
      </h3>
      <ul className="space-y-4">
        {messages.map((msg, idx) => (
          <li key={idx} className="text-sm border-l-2 border-gray-700 pl-4 py-2 hover:border-cyan-500 transition-colors">
            <div className="text-cyan-600 text-xs mb-2 font-mono">
              {msg.timestamp.toLocaleDateString()} {msg.timestamp.toLocaleTimeString()}
            </div>
            <MessageContent content={msg.content} />
          </li>
        ))}
      </ul>
    </div>
  );

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg shadow-lg">
        <p className="text-cyan-400">{label}</p>
        <p className="text-gray-300">Messages: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function ChatAnalyzer() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const content = await file.text();
      setAnalysis(parseChat(content));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const content = await e.dataTransfer.files[0].text();
      setAnalysis(parseChat(content));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-cyan-400 mb-6">WhatsApp Chat Analyzer</h1>
          <div 
            className={`flex justify-center items-center border-2 border-dashed rounded-xl p-10 transition-all duration-200 
              ${dragActive ? 'border-cyan-400 bg-cyan-950/20' : 'border-gray-700 hover:border-cyan-600'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <label className="flex flex-col items-center cursor-pointer space-y-4">
              <div className="w-16 h-16 bg-cyan-950 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
              </div>
              <div className="text-cyan-400 text-lg font-medium">Drop your chat file here</div>
              <div className="text-gray-500 text-sm">or click to select</div>
              <input type="file" className="hidden" accept=".txt" onChange={handleFileUpload} />
            </label>
          </div>
        </header>

        {analysis && (
          <div className="space-y-12">
            {/* Usage Pattern Chart */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
              <h2 className="text-xl font-semibold mb-6 text-cyan-400">Chat Activity Timeline</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analysis.timeAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#22d3ee" 
                      strokeWidth={2}
                      dot={{ fill: '#22d3ee', r: 4 }}
                      activeDot={{ r: 6, fill: '#06b6d4' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 p-6 rounded-xl shadow-lg text-center border border-gray-700 hover:border-cyan-900 transition-colors">
                <h3 className="font-semibold text-gray-400 mb-2">Total Messages</h3>
                <p className="text-4xl font-bold text-cyan-400">
                  {analysis.messages.length}
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl shadow-lg text-center border border-gray-700 hover:border-cyan-900 transition-colors">
                <h3 className="font-semibold text-gray-400 mb-2">Most Active Day</h3>
                <p className="text-4xl font-bold text-cyan-400">
                  {new Date(analysis.timeAnalysis.reduce((a, b) => a.count > b.count ? a : b).date).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl shadow-lg text-center border border-gray-700 hover:border-cyan-900 transition-colors">
                <h3 className="font-semibold text-gray-400 mb-2">Categories</h3>
                <p className="text-4xl font-bold text-cyan-400">
                  {Object.keys(analysis.categories).length}
                </p>
              </div>
            </div>

            {/* Content Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(analysis.categories).map(([category, messages]) => (
                <CategorySection 
                  key={category} 
                  title={category} 
                  messages={messages} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}