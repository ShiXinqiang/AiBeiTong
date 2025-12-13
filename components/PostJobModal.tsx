import { defineComponent, ref } from 'vue';
import { X as XIcon, Sparkles as SparklesIcon, Loader2 as Loader2Icon, ArrowLeft as ArrowLeftIcon } from 'lucide-vue-next';
import { JobType, LOCATIONS } from '../types';
import { generateJobDescription } from '../services/geminiService';

const X = XIcon as any;
const Sparkles = SparklesIcon as any;
const Loader2 = Loader2Icon as any;
const ArrowLeft = ArrowLeftIcon as any;

export default defineComponent({
  name: 'PostJobModal',
  emits: ['close', 'submit'],
  setup(_, { emit }) {
    // Vue 的 ref 代替 React 的 useState
    const title = ref('');
    const company = ref('');
    const location = ref(LOCATIONS[0]);
    const salaryRange = ref('');
    const type = ref<JobType>(JobType.FULL_TIME);
    const description = ref('');
    const keywords = ref('');
    const contactEmail = ref('');
    const contactPhone = ref('');
    const isGenerating = ref(false);

    const handleAIGenerate = async () => {
      if (!title.value || !keywords.value) {
        alert("请先填写职位名称和关键词");
        return;
      }
      isGenerating.value = true;
      const generatedDesc = await generateJobDescription(title.value, location.value, keywords.value);
      description.value = generatedDesc;
      isGenerating.value = false;
    };

    // Fixed error: Type '(e: Event) => void' is not assignable to type 'FormEventHandler<HTMLFormElement>'
    const handleSubmit = (e: any) => {
      e.preventDefault();
      const requirements = keywords.value.split(/[,，\s]+/).filter(k => k.length > 0);
      const tags = [type.value, ...requirements.slice(0, 2)];
      
      emit('submit', {
        title: title.value,
        company: company.value,
        location: location.value,
        salaryRange: salaryRange.value,
        type: type.value,
        description: description.value,
        requirements,
        tags,
        contactEmail: contactEmail.value,
        contactPhone: contactPhone.value
      });
      emit('close');
    };

    return () => (
      <div className="fixed inset-0 z-[100] bg-white md:bg-black/50 md:backdrop-blur-sm flex items-center justify-center md:p-4">
        <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:rounded-2xl md:max-w-2xl flex flex-col shadow-2xl">
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <button onClick={() => emit('close')} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors md:hidden">
              <ArrowLeft size={24} className="text-slate-800" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 flex-1 text-center md:text-left md:text-xl">
              发布职位 (Vue)
            </h2>
            <button onClick={() => emit('close')} className="hidden md:block p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} className="text-slate-500" />
            </button>
            <div className="w-10 md:hidden"></div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 md:p-6 custom-scrollbar">
            <form id="postJobForm" onSubmit={handleSubmit} className="space-y-6 pb-20 md:pb-0">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">基本信息</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">职位名称</label>
                  <input required type="text" v-model={title.value} placeholder="例如: 销售经理" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500/20 text-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">公司名称</label>
                  <input required type="text" v-model={company.value} placeholder="公司全称" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500/20 text-slate-900" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">地点</label>
                    <select v-model={location.value} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 appearance-none">
                      {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc.split(' ')[0]}</option>)}
                    </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
                     <select v-model={type.value} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 appearance-none">
                      {Object.values(JobType).map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                  </div>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">薪资范围</label>
                  <input type="text" v-model={salaryRange.value} placeholder="例如: 50万-80万 MMK" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500/20 text-slate-900" />
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                   <label className="block text-sm font-medium text-slate-700">AI 辅助描述</label>
                   <button type="button" onClick={handleAIGenerate} disabled={isGenerating.value} className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                     {isGenerating.value ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                     {isGenerating.value ? '生成中...' : 'AI 撰写'}
                   </button>
                 </div>
                 <input type="text" v-model={keywords.value} placeholder="输入关键词..." className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-purple-500/20 text-slate-900" />
                 <textarea required v-model={description.value} rows={6} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 resize-none text-sm" placeholder="职位详情..." />
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">联系方式</h3>
                <div className="grid grid-cols-1 gap-4">
                  <input type="email" v-model={contactEmail.value} placeholder="邮箱" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0" />
                   <input type="tel" v-model={contactPhone.value} placeholder="电话" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0" />
                </div>
              </div>
            </form>
          </div>

          <div className="p-4 border-t border-slate-100 bg-white md:rounded-b-2xl pb-8 md:pb-4">
            <button type="submit" form="postJobForm" className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-700 shadow-lg">
              发布职位
            </button>
          </div>
        </div>
      </div>
    );
  }
}) as any;