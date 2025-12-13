import React, { useState } from 'react';
import { 
  ChevronLeft, Shield, Lock, Bell, Info, FileText, ChevronRight 
} from 'lucide-react';
import { User } from '../types';
import UserAgreement from './legal/UserAgreement';
import PrivacyPolicy from './legal/PrivacyPolicy';

// --- Sub-components for Settings ---

const SecurityView: React.FC<{ onBack: () => void, user: User, onUpdate: (u: Partial<User>) => Promise<void>, showToast: (m: string, t?: 'success'|'error') => void }> = ({ onBack, user, onUpdate, showToast }) => {
  const handleChangePassword = async () => {
    const oldP = window.prompt("请输入旧密码");
    if (!oldP) return;
    if (oldP !== user.password) {
      showToast("旧密码错误", "error");
      return;
    }
    const newP = window.prompt("请输入新密码");
    if (newP && newP.length >= 3) {
      await onUpdate({ password: newP });
      showToast("密码修改成功");
    } else {
      showToast("密码无效，长度需大于3位", "error");
    }
  };

  const handleBindPhone = async () => {
    const phone = window.prompt("请输入手机号", user.phone || '');
    if (phone) {
       // Simulate verification
       const code = window.prompt("请输入模拟验证码 (任意输入4位)");
       if (code && code.length === 4) {
          await onUpdate({ phone });
          showToast("手机号绑定成功");
       } else {
          showToast("验证码错误", "error");
       }
    }
  }

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm("警告：注销账号将永久删除您的所有数据（简历、动态、聊天记录），且无法恢复！");
    if (confirm1) {
      const confirm2 = window.prompt("请在下方输入“确认注销”以继续");
      if (confirm2 === "确认注销") {
        showToast("账号已注销（模拟）");
        // In a real app, verify credential again and call API
        window.location.reload(); // Force logout/reset
      }
    }
  }

  return (
  <div className="fixed inset-0 bg-slate-50 z-[100] animate-in slide-in-from-right flex flex-col">
     <div className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-3">
        <button onClick={onBack}><ChevronLeft size={24} className="text-slate-600" /></button>
        <span className="font-bold text-slate-800 text-lg">账号与安全</span>
     </div>
     <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl p-4 flex justify-between items-center active:bg-slate-50 cursor-pointer" onClick={handleChangePassword}>
           <span>修改密码</span>
           <ChevronRight size={16} className="text-slate-400" />
        </div>
        <div className="bg-white rounded-xl p-4 flex justify-between items-center active:bg-slate-50 cursor-pointer" onClick={handleBindPhone}>
           <span>绑定手机号</span>
           <div className="flex items-center gap-2">
             <span className="text-xs text-slate-400">{user.phone || "未绑定"}</span>
             <ChevronRight size={16} className="text-slate-400" />
           </div>
        </div>
        <div className="bg-white rounded-xl p-4 flex justify-between items-center text-red-500 cursor-pointer" onClick={handleDeleteAccount}>
           <span>注销账号</span>
           <ChevronRight size={16} className="text-slate-400" />
        </div>
     </div>
  </div>
)};

const PrivacySettingsView: React.FC<{ onBack: () => void, user: User, onUpdate: (u: Partial<User>) => Promise<void> }> = ({ onBack, user, onUpdate }) => {
  // Use user's real settings or defaults
  const settings = user.privacySettings || { allowStrangerView10: true, requireFriendVerify: true, visibleToSearch: true };

  const toggle = (key: keyof typeof settings) => {
    onUpdate({
      privacySettings: { ...settings, [key]: !settings[key] }
    });
  };

  return (
  <div className="fixed inset-0 bg-slate-50 z-[100] animate-in slide-in-from-right flex flex-col">
     <div className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-3">
        <button onClick={onBack}><ChevronLeft size={24} className="text-slate-600" /></button>
        <span className="font-bold text-slate-800 text-lg">隐私设置</span>
     </div>
     <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl p-4 flex justify-between items-center">
           <div className="flex flex-col">
             <span className="text-slate-800">允许陌生人查看10条动态</span>
             <span className="text-xs text-slate-400 mt-1">关闭后，陌生人只能看到你的名字和头像</span>
           </div>
           <button onClick={() => toggle('allowStrangerView10')} className={`w-12 h-7 rounded-full relative transition-colors ${settings.allowStrangerView10 ? 'bg-emerald-500' : 'bg-slate-200'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-all ${settings.allowStrangerView10 ? 'left-6' : 'left-1'}`}></div>
           </button>
        </div>
        
        <div className="bg-white rounded-xl p-4 flex justify-between items-center">
           <span className="text-slate-800">加我为好友时需要验证</span>
           <button onClick={() => toggle('requireFriendVerify')} className={`w-12 h-7 rounded-full relative transition-colors ${settings.requireFriendVerify ? 'bg-emerald-500' : 'bg-slate-200'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-all ${settings.requireFriendVerify ? 'left-6' : 'left-1'}`}></div>
           </button>
        </div>

        <div className="bg-white rounded-xl p-4 flex justify-between items-center">
           <span className="text-slate-800">允许通过手机号搜索到我</span>
           <button onClick={() => toggle('visibleToSearch')} className={`w-12 h-7 rounded-full relative transition-colors ${settings.visibleToSearch ? 'bg-emerald-500' : 'bg-slate-200'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-all ${settings.visibleToSearch ? 'left-6' : 'left-1'}`}></div>
           </button>
        </div>
        
        <div className="bg-white rounded-xl p-4 flex justify-between items-center cursor-pointer">
           <span>通讯录黑名单</span>
           <ChevronRight size={16} className="text-slate-400" />
        </div>
     </div>
  </div>
)};

// --- Main Settings Screen ---

interface SettingsScreenProps {
  onBack: () => void;
  onLogout: () => void;
  user: User;
  onUpdate: (u: Partial<User>) => Promise<void>;
  showToast: (m: string, t?: 'success'|'error') => void;
}

type SubPage = 'none' | 'security' | 'privacy' | 'agreement' | 'policy';

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, onLogout, user, onUpdate, showToast }) => {
  const [activeSub, setActiveSub] = useState<SubPage>('none');

  const SettingItem = ({ icon: Icon, label, value, onClick }: any) => (
    <div onClick={onClick} className="flex items-center justify-between p-4 bg-white border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
           <Icon size={18} />
        </div>
        <span className="text-slate-800 font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-slate-400">
        <span className="text-xs">{value}</span>
        <ChevronRight size={16} />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-50 z-[90] flex flex-col animate-in slide-in-from-right duration-300">
       <div className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-3">
          <button onClick={onBack}><ChevronLeft size={24} className="text-slate-600" /></button>
          <span className="font-bold text-slate-800 text-lg">设置</span>
       </div>
       
       <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
             <SettingItem icon={Shield} label="账号与安全" onClick={() => setActiveSub('security')} />
             <SettingItem icon={Lock} label="隐私设置" onClick={() => setActiveSub('privacy')} />
             <SettingItem icon={Bell} label="新消息通知" />
          </div>

          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
             <SettingItem icon={Info} label="关于爱贝通" value="v2.1.0" />
             <SettingItem icon={FileText} label="用户服务协议" onClick={() => setActiveSub('agreement')} />
             <SettingItem icon={Shield} label="隐私保护政策" onClick={() => setActiveSub('policy')} />
          </div>

          <button onClick={onLogout} className="w-full bg-white text-red-500 font-bold py-4 rounded-xl shadow-sm border border-slate-100 mt-4 active:scale-[0.98] transition-transform">
             退出登录
          </button>
          
          <div className="text-center text-slate-400 text-xs mt-4">
             爱贝通 AiBeiTong for Myanmar
          </div>
       </div>
       
       {activeSub === 'security' && <SecurityView onBack={() => setActiveSub('none')} user={user} onUpdate={onUpdate} showToast={showToast} />}
       {activeSub === 'privacy' && <PrivacySettingsView onBack={() => setActiveSub('none')} user={user} onUpdate={onUpdate} />}
       {activeSub === 'agreement' && <UserAgreement onBack={() => setActiveSub('none')} />}
       {activeSub === 'policy' && <PrivacyPolicy onBack={() => setActiveSub('none')} />}
    </div>
  );
};

export default SettingsScreen;