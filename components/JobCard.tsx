import { defineComponent, PropType } from 'vue';
import { Job } from '../types';

export default defineComponent({
  name: 'JobCard',
  props: {
    job: {
      type: Object as PropType<Job>,
      required: true
    }
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () => {
      const { job } = props;
      const isNew = (new Date().getTime() - new Date(job.postedAt).getTime()) < 86400000 * 3;

      return (
        <div 
          className="bg-white rounded-xl p-4 mb-3 border border-slate-100 shadow-sm active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col gap-3"
          onClick={() => emit('click', job)}
        >
          <div className="flex justify-between items-start">
             <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-1">{job.title}</h3>
             <span className="text-emerald-600 font-bold text-sm whitespace-nowrap ml-2">{job.salaryRange.split(' ')[0]}</span>
          </div>

          <div className="flex items-center gap-2">
             <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-bold text-xs">
               {job.company.substring(0,2).toUpperCase()}
             </span>
             <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-700">{job.company}</span>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                   <span>{job.location.split(' ')[0]}</span>
                   <span>•</span>
                   <span>{job.type}</span>
                </div>
             </div>
          </div>

          <div className="flex gap-2 mt-1">
             {job.tags.slice(0, 3).map((tag, idx) => (
               <span key={idx} className="bg-slate-50 text-slate-500 px-2 py-1 rounded text-xs">
                 {tag}
               </span>
             ))}
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-slate-50">
             <div className="flex items-center gap-1.5">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${job.company}`} className="w-5 h-5 rounded-full" />
               <span className="text-xs text-slate-400">HR · 刚刚活跃</span>
             </div>
             <span className="text-xs text-slate-300">{isNew ? '最新' : new Date(job.postedAt).toLocaleDateString()}</span>
          </div>
        </div>
      );
    };
  }
}) as any;