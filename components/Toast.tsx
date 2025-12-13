import { defineComponent, onMounted, onUnmounted } from 'vue';
import { CheckCircle as CheckCircleIcon, AlertCircle as AlertCircleIcon, X as XIcon } from 'lucide-vue-next';

const CheckCircle = CheckCircleIcon as any;
const AlertCircle = AlertCircleIcon as any;
const X = XIcon as any;

export default defineComponent({
  name: 'Toast',
  props: {
    message: String,
    type: { type: String, default: 'success' }
  },
  emits: ['close'],
  setup(props, { emit }) {
    let timer: any;
    // 使用 Vue 的生命周期钩子
    onMounted(() => {
      timer = setTimeout(() => emit('close'), 3000);
    });
    onUnmounted(() => clearTimeout(timer));

    return () => (
      <div className="fixed top-4 left-4 right-4 z-[100] flex justify-center pointer-events-none">
        <div className={`
          pointer-events-auto shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-md animate-in slide-in-from-top-5 fade-in duration-300
          ${props.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'}
        `}>
          {props.type === 'success' ? <CheckCircle size={20} className="text-emerald-400" /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium flex-1">{props.message}</span>
          <button onClick={() => emit('close')}><X size={16} className="opacity-70" /></button>
        </div>
      </div>
    );
  }
}) as any;