import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="fixed inset-0 bg-white z-[100] animate-in slide-in-from-right flex flex-col">
      <div className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-3 shrink-0">
        <button onClick={onBack}><ChevronLeft size={24} className="text-slate-600" /></button>
        <span className="font-bold text-slate-800 text-lg">隐私保护政策</span>
      </div>
      <div className="p-6 overflow-y-auto text-sm text-slate-600 leading-relaxed pb-20">
        <h3 className="font-bold text-xl text-slate-900 mb-6 text-center">爱贝通隐私保护指引</h3>
        
        <p className="mb-4">爱贝通（以下简称“我们”）非常重视您的隐私。本隐私政策旨在向您说明我们如何收集、使用、存储和分享您的个人信息。</p>

        <section className="mb-6">
          <h4 className="font-bold text-slate-800 mb-2">1. 我们收集的信息</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>账号信息：</strong>当您注册时，我们会收集您的用户名、密码、昵称、手机号码等信息。</li>
            <li><strong>简历资料：</strong>当您完善个人资料或使用简历匹配功能时，我们会收集您的工作经历、教育背景、技能特长等。</li>
            <li><strong>设备信息：</strong>为了保障账号安全，我们会收集您的设备型号、操作系统版本、唯一设备标识符等。</li>
            <li><strong>位置信息：</strong>当您使用“附近的工作”或发布带位置的动态时，经您授权，我们会收集您的地理位置信息。</li>
            <li><strong>摄像头/相册权限：</strong>当您使用扫一扫、上传头像或发布图片动态时，我们需要访问您的摄像头或相册。</li>
          </ul>
        </section>

        <section className="mb-6">
          <h4 className="font-bold text-slate-800 mb-2">2. 我们如何使用信息</h4>
          <p>我们收集的信息将用于以下用途：</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>提供职位推荐和简历匹配服务；</li>
            <li>提供即时通讯和社交互动功能；</li>
            <li>验证身份，防止欺诈和非法活动；</li>
            <li>改进我们的产品和服务体验。</li>
          </ul>
        </section>

        <section className="mb-6">
          <h4 className="font-bold text-slate-800 mb-2">3. 信息的共享与公开</h4>
          <p>3.1 <strong>招聘方可见：</strong>当您投递简历时，您的简历信息（除隐私设置隐藏的内容外）将展示给对应的招聘企业。</p>
          <p>3.2 <strong>社交可见：</strong>您的昵称、头像、公开的动态对其他用户可见。您可以通过“隐私设置”控制陌生人查看权限。</p>
          <p>3.3 <strong>法律要求：</strong>在法律法规规定或政府部门要求的情况下，我们可能会披露您的个人信息。</p>
        </section>

        <section className="mb-6">
          <h4 className="font-bold text-slate-800 mb-2">4. 数据存储与安全</h4>
          <p>4.1 您的个人信息将存储在安全的服务器上。我们采取加密技术、访问控制等措施保护您的数据安全。</p>
          <p>4.2 除非法律另有规定，我们仅在提供服务所需的期限内保留您的个人信息。</p>
        </section>

        <section className="mb-6">
          <h4 className="font-bold text-slate-800 mb-2">5. 您的权利</h4>
          <p>您可以随时访问、更正或删除您的个人信息。您也可以在设置中注销账号，注销后我们将删除或匿名化处理您的数据。</p>
        </section>

        <section className="mb-6">
          <h4 className="font-bold text-slate-800 mb-2">6. 未成年人保护</h4>
          <p>本平台主要面向求职人群。若您未满18周岁，请在监护人指导下使用本服务。</p>
        </section>

        <section className="mb-6">
          <h4 className="font-bold text-slate-800 mb-2">7. 联系我们</h4>
          <p>如您对本隐私政策有任何疑问，请通过App内的“意见反馈”或联系客服邮箱：privacy@aibeitong.mm 与我们联系。</p>
        </section>
        
        <div className="mt-8 text-center text-slate-400 text-xs">
           - 爱贝通法务部 -
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;