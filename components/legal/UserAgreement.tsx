import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const UserAgreement: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="fixed inset-0 bg-white z-[100] animate-in slide-in-from-right flex flex-col">
      <div className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-3 shrink-0">
        <button onClick={onBack}><ChevronLeft size={24} className="text-slate-600" /></button>
        <span className="font-bold text-slate-800 text-lg">用户服务协议</span>
      </div>
      <div className="p-6 overflow-y-auto text-sm text-slate-600 leading-relaxed pb-20">
        <h3 className="font-bold text-xl text-slate-900 mb-6 text-center">爱贝通(AiBeiTong)用户服务协议</h3>
        
        <p className="mb-4 text-xs text-slate-400 text-center">版本生效日期：2024年1月1日</p>

        <section className="mb-6">
          <h4 className="font-bold text-slate-800 mb-2">1. 导言</h4>
          <p>欢迎您使用爱贝通（AiBeiTong）软件及相关服务！本协议是您与爱贝通运营方之间关于您注册、登录、使用本软件及相关服务所订立的协议。请您在注册前务必认真阅读本协议，点击“同意”即表示您已充分理解并接受本协议的所有条款。</p>
        </section>

        <section className="mb-6">
          <h4 className="font-bold text-slate-800 mb-2">2. 服务内容</h4>
          <p>2.1 爱贝通主要提供缅甸本地及华人的求职招聘信息发布、职业社交、即时通讯及AI简历分析服务。</p>
          <p>2.2 平台有权根据业务发展需要，变更、中断或终止部分或全部服务。</p>
          <p>2.3 本平台提供的AI辅助功能（如职位描述生成、简历匹配）仅供参考，不代表对职位的最终承诺或简历的真实性背书。</p>
        </section>

        <section className="mb-6">
          <h4 className="font-bold text-slate-800 mb-2">3. 用户行为规范</h4>
          <p>3.1 用户必须保证注册信息的真实性，不得使用虚假身份或冒用他人身份。</p>
          <p>3.2 用户在使用本服务时，不得发布以下内容：</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>违反缅甸当地法律法规的信息；</li>
            <li>涉及赌博（博彩）、电信诈骗、毒品等违法犯罪信息；</li>
            <li>虚假招聘、虚假简历或误导性信息；</li>
            <li>侮辱、诽谤、骚扰他人的内容；</li>
            <li>侵犯他人知识产权或商业秘密的内容。</li>
          </ul>
          <p className="mt-2 text-red-500">3.3 对于发布违法违规信息的用户，平台有权不经通知直接采取删除内容、冻结账号、永久封禁等措施，并配合有关部门调查。</p>
        </section>

        <section className="mb-6">
          <h4 className="font-bold text-slate-800 mb-2">4. 招聘与求职责任</h4>
          <p>4.1 招聘方应确保发布的职位真实有效，且符合当地劳动法规，承诺不向求职者收取任何违规费用。</p>
          <p>4.2 求职者应确保简历信息真实，并在面试入职过程中注意个人人身与财产安全。</p>
          <p>4.3 平台作为信息发布场所，不对用户在线下交易、面试或入职过程中发生的纠纷承担法律责任。</p>
        </section>

        <section className="mb-6">
          <h4 className="font-bold text-slate-800 mb-2">5. 知识产权</h4>
          <p>5.1 用户在平台发布的内容（如动态、评论），授予平台在全球范围内免费的、非独家的使用权。</p>
          <p>5.2 爱贝通的Logo、界面设计、源码等知识产权归平台所有，未经许可不得擅自使用。</p>
        </section>

        <section className="mb-6">
          <h4 className="font-bold text-slate-800 mb-2">6. 免责声明</h4>
          <p>6.1 因不可抗力（如网络故障、服务器攻击、政策变动）导致的服务中断，平台不承担责任。</p>
          <p>6.2 平台不保证服务一定能满足用户的要求，也不保证服务不会中断，对服务的及时性、安全性、准确性也不作担保。</p>
        </section>

        <section className="mb-6">
          <h4 className="font-bold text-slate-800 mb-2">7. 协议修改</h4>
          <p>平台有权在必要时修改本协议条款。您可以在相关服务页面查阅最新版本的协议条款。本协议条款变更后，如果您继续使用本服务，即视为您已接受修改后的协议。</p>
        </section>
        
        <div className="mt-8 text-center text-slate-400 text-xs">
           - 爱贝通团队 -
        </div>
      </div>
    </div>
  );
};

export default UserAgreement;