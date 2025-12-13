import React, { useState } from 'react';
import { X, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { Job, JobType, LOCATIONS } from '../types';
import { generateJobDescription } from '../services/geminiService';

interface PostJobModalProps {
  onClose: () => void;
  onSubmit: (jobData: Omit<Job, 'id' | 'postedAt'>) => void;
}

const PostJobModal: React.FC<PostJobModalProps> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [salaryRange, setSalaryRange] = useState('');
  const [type, setType] = useState<JobType>(JobType.FULL_TIME);
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAIGenerate = async () => {
    if (!title || !keywords) {
      alert("请先填写职位名称和关键词 (Please enter Job Title and Keywords)");
      return;
    }
    setIsGenerating(true);
    const generatedDesc = await generateJobDescription(title, location, keywords);
    setDescription(generatedDesc);
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requirements = keywords.split(/[,，\s]+/).filter(k => k.length > 0);
    const tags = [type, ...requirements.slice(0, 2)];
    
    onSubmit({
      title,
      company,
      location,
      salaryRange,
      type,
      description,
      requirements,
      tags,
      contactEmail,
      contactPhone
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white md:bg-black/50 md:backdrop-blur-sm flex items-center justify-center md:p-4">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:rounded-2xl md:max-w-2xl flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <button onClick={onClose} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors md:hidden">
            <ArrowLeft size={24} className="text-slate-800" />
          </button>
          <h2 className="text-lg font-bold text-slate-800 flex-1 text-center md:text-left md:text-xl">
            发布职位
          </h2>
          <button onClick={onClose} className="hidden md:block p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
          <div className="w-10 md:hidden"></div> {/* Spacer for center alignment */}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar">
          <form id="postJobForm" onSubmit={handleSubmit} className="space-y-6 pb-20 md:pb-0">
            
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">基本信息</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">职位名称</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如: 销售经理"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">公司名称</label>
                <input
                  required
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="公司全称"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">地点</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 appearance-none"
                  >
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc.split(' ')[0]}</option>)}
                  </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
                   <select
                    value={type}
                    onChange={(e) => setType(e.target.value as JobType)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 appearance-none"
                   >
                    {Object.values(JobType).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
              </div>

               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">薪资范围</label>
                <input
                  type="text"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="例如: 50万-80万 MMK"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* AI Section */}
            <div className="space-y-4">
               <div className="flex justify-between items-end">
                 <label className="block text-sm font-medium text-slate-700">AI 辅助描述</label>
                 <button
                   type="button"
                   onClick={handleAIGenerate}
                   disabled={isGenerating}
                   className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-purple-200 transition-colors"
                 >
                   {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                   {isGenerating ? '生成中...' : 'AI 撰写'}
                 </button>
               </div>
               
               <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="输入关键词 (例如: 中文流利, 3年经验)..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-purple-500/20 text-slate-900 placeholder:text-slate-400 transition-all"
               />

               <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400 transition-all resize-none text-sm leading-relaxed"
                placeholder="职位详情将显示在这里..."
              />
            </div>

            <hr className="border-slate-100" />

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">联系方式</h3>
              <div className="grid grid-cols-1 gap-4">
                <input
                   type="email"
                   value={contactEmail}
                   onChange={(e) => setContactEmail(e.target.value)}
                   placeholder="邮箱 (Email)"
                   className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400"
                 />
                 <input
                   type="tel"
                   value={contactPhone}
                   onChange={(e) => setContactPhone(e.target.value)}
                   placeholder="电话 (Phone)"
                   className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder:text-slate-400"
                 />
              </div>
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white md:rounded-b-2xl pb-8 md:pb-4">
          <button
            type="submit"
            form="postJobForm"
            className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-600/30"
          >
            发布职位
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostJobModal;