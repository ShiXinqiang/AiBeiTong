import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Briefcase, Video, Settings } from 'lucide-react';
import { User, PostCategory } from '../types';
import { db } from '../services/mockDb';

interface CreatePostViewProps {
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePostView: React.FC<CreatePostViewProps> = ({ currentUser, onClose, onSuccess }) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('text'); // Default to generic
  const [image, setImage] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    // If user selected 'job', it's a job post, otherwise it's image or text based on attachment
    let finalCategory = category;
    if (category !== 'job') {
      finalCategory = image ? 'image' : 'text';
    }
    
    await db.createPost(currentUser.id, content, finalCategory, image);
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex justify-between items-center px-4 h-14 border-b border-slate-50">
        <button onClick={onClose} className="text-slate-600 text-base">取消</button>
        <span className="font-bold text-slate-800">发布内容</span>
        <button 
          onClick={handleSubmit} 
          disabled={loading || !content.trim()}
          className="bg-emerald-600 text-white px-5 py-1.5 rounded-full text-sm font-bold disabled:opacity-50 disabled:bg-slate-200"
        >
          发布
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 p-5 flex flex-col">
        {/* Text Area (Info Box) */}
        <textarea 
          autoFocus
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="分享你的新鲜事，或者发布招聘信息..."
          className="w-full flex-1 resize-none outline-none text-lg text-slate-800 placeholder:text-slate-400 bg-transparent leading-relaxed"
        />

        {/* Image Preview Area */}
        {image && (
          <div className="relative mt-4 rounded-xl overflow-hidden inline-block group w-full max-h-60 bg-slate-50 flex justify-center">
             <img src={image} className="h-full object-contain" />
             <button onClick={() => setImage(undefined)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full">
               <X size={16} /> 
             </button>
          </div>
        )}

        {/* Bottom Toolbar Area */}
        <div className="mt-4 pt-4 border-t border-slate-50">
          <div className="flex justify-between items-start">
            
            {/* Left: Type Selector */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-slate-400 font-bold ml-1">发布类型</span>
              <div className="flex gap-2 bg-slate-100 p-1 rounded-lg self-start">
                <button 
                  onClick={() => setCategory('text')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${category !== 'job' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  普通动态
                </button>
                <button 
                  onClick={() => setCategory('job')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${category === 'job' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-500'}`}
                >
                  招聘信息
                </button>
              </div>
            </div>

            {/* Right: Upload Image */}
            <div className="flex flex-col gap-2 items-center">
               <span className="text-xs text-slate-400 font-bold">图片</span>
               <button 
                 onClick={() => fileInputRef.current?.click()} 
                 className="w-12 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
               >
                 <ImageIcon size={24} />
               </button>
            </div>
          </div>
        </div>
      </div>
      
      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
    </div>
  );
};

export default CreatePostView;