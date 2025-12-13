import React, { useState } from 'react';
import { Sparkles, Loader2, FileText, CheckCircle2, Lightbulb } from 'lucide-react';
import { analyzeResumeAndMatch } from '../services/geminiService';

const ResumeMatcher: React.FC = () => {
  const [bio, setBio] = useState('');
  const [result, setResult] = useState<{ summary: string; suggestedRoles: string[]; advice: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!bio.trim()) return;
    setIsLoading(true);
    const data = await analyzeResumeAndMatch(bio);
    setResult(data);
    setIsLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white/20 rounded-lg">
          <Sparkles className="text-yellow-300" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold">AI 智能求职助手</h3>
          <p className="text-indigo-100 text-sm">不知道适合什么工作？输入您的简介，让 AI 帮您分析。</p>
        </div>
      </div>

      {!result ? (
        <div className="space-y-4">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="例如: 我叫Min，今年25岁，会说流利的中文和缅甸语，之前在仰光做过2年的销售，也会一些简单的电脑操作..."
            className="w-full h-32 bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !bio.trim()}
            className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : '开始分析 (Analyze)'}
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <h4 className="flex items-center gap-2 font-semibold mb-2 text-yellow-300">
              <FileText size={18} /> 简历摘要
            </h4>
            <p className="text-sm leading-relaxed opacity-90">{result.summary}</p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <h4 className="flex items-center gap-2 font-semibold mb-2 text-green-300">
              <CheckCircle2 size={18} /> 推荐职位
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.suggestedRoles.map((role, idx) => (
                <span key={idx} className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <h4 className="flex items-center gap-2 font-semibold mb-2 text-pink-300">
              <Lightbulb size={18} /> 职业建议
            </h4>
            <p className="text-sm leading-relaxed opacity-90">{result.advice}</p>
          </div>

          <button
            onClick={() => { setResult(null); setBio(''); }}
            className="w-full py-2 bg-transparent border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors text-sm"
          >
            重新分析
          </button>
        </div>
      )}
    </div>
  );
};

export default ResumeMatcher;