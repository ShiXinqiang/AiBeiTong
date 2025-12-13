import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MoreHorizontal, Search, Trash2, UserMinus, Send, Copy, Undo2, Languages } from 'lucide-react';
import { User, Message } from '../types';
import { db } from '../services/mockDb';

const Avatar: React.FC<{ url: string, size?: string, className?: string }> = ({ url, size = "w-10 h-10", className="" }) => (
  <img src={url} alt="Avatar" className={`${size} rounded-full object-cover border border-slate-200 ${className}`} />
);

interface ChatScreenProps { 
  currentUser: User; 
  targetUser: User; 
  onBack: () => void;
  onUserClick: (id: string) => void;
  onRemoveContact: (id: string) => void;
}

// Chat Settings Overlay
const ChatSettingsOverlay: React.FC<{ 
  targetUser: User, 
  onClose: () => void,
  onUserClick: (id: string) => void,
  onRemoveContact: (id: string) => void,
  isContact: boolean
}> = ({ targetUser, onClose, onUserClick, onRemoveContact, isContact }) => {
  return (
     <div className="fixed inset-0 z-[100] flex justify-end">
        <div className="absolute inset-0 bg-black/20" onClick={onClose}></div>
        <div className="bg-white w-3/4 max-w-xs h-full relative z-10 shadow-2xl animate-in slide-in-from-right flex flex-col">
           <div className="p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => onUserClick(targetUser.id)}>
                 <Avatar url={targetUser.avatar} size="w-16 h-16" />
                 <h3 className="font-bold text-lg">{targetUser.name}</h3>
              </div>
           </div>
           
           <div className="p-4 space-y-2 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                 <span className="text-slate-700 font-medium">查找聊天记录</span>
                 <Search size={18} className="text-slate-400" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                 <span className="text-slate-700 font-medium">消息免打扰</span>
                 <div className="w-10 h-6 bg-slate-200 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div></div>
              </div>
              
              <div className="h-px bg-slate-100 my-2" />
              
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer text-red-500">
                 <span className="font-medium">清空聊天记录</span>
                 <Trash2 size={18} />
              </div>
              
              {isContact && (
                <div onClick={() => { onRemoveContact(targetUser.id); onClose(); }} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer text-red-500">
                   <span className="font-medium">删除好友</span>
                   <UserMinus size={18} />
                </div>
              )}
           </div>
        </div>
     </div>
  );
};

// Message Context Menu
const MessageContextMenu: React.FC<{
  position: {x: number, y: number},
  onClose: () => void,
  onDelete: () => void,
  onRecall?: () => void,
  onCopy: () => void,
  onTranslate: () => void,
  isMine: boolean
}> = ({ position, onClose, onDelete, onRecall, onCopy, onTranslate, isMine }) => (
  <div className="fixed inset-0 z-[110] flex" onClick={onClose}>
    <div 
      className="bg-slate-800 text-white rounded-lg shadow-xl overflow-hidden absolute animate-in fade-in zoom-in-95 duration-100 flex items-center p-1 gap-1"
      style={{ top: position.y - 50, left: Math.max(10, Math.min(position.x - 100, window.innerWidth - 250)) }}
      onClick={e => e.stopPropagation()}
    >
       <button onClick={() => { onCopy(); onClose(); }} className="flex flex-col items-center gap-1 p-2 hover:bg-slate-700 rounded w-14">
          <Copy size={16} /> <span className="text-[10px]">复制</span>
       </button>
       {isMine && onRecall && (
         <button onClick={() => { onRecall(); onClose(); }} className="flex flex-col items-center gap-1 p-2 hover:bg-slate-700 rounded w-14">
            <Undo2 size={16} /> <span className="text-[10px]">撤回</span>
         </button>
       )}
       <button onClick={() => { onDelete(); onClose(); }} className="flex flex-col items-center gap-1 p-2 hover:bg-slate-700 rounded w-14">
          <Trash2 size={16} /> <span className="text-[10px]">删除</span>
       </button>
       <button onClick={() => { onTranslate(); onClose(); }} className="flex flex-col items-center gap-1 p-2 hover:bg-slate-700 rounded w-14">
          <Languages size={16} /> <span className="text-[10px]">翻译</span>
       </button>
    </div>
  </div>
);

const ChatScreen: React.FC<ChatScreenProps> = ({ currentUser, targetUser, onBack, onUserClick, onRemoveContact }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isContact, setIsContact] = useState(false);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friend'>('none');
  
  // Context Menu State
  const [msgMenu, setMsgMenu] = useState<{ visible: boolean, x: number, y: number, msg: Message | null } | null>(null);
  const [translatedMsgs, setTranslatedMsgs] = useState<Record<string, boolean>>({}); // Store translation state

  useEffect(() => {
    const check = async () => {
       const status = await db.checkFriendStatus(currentUser.id, targetUser.id);
       setFriendStatus(status);
       setIsContact(status === 'friend');
    };
    check();
  }, [currentUser, targetUser]);

  const refreshMsgs = async () => {
    const msgs = await db.getMessagesBetween(currentUser.id, targetUser.id);
    setMessages(msgs);
  };

  useEffect(() => {
    refreshMsgs();
    const interval = setInterval(refreshMsgs, 2000); 
    return () => clearInterval(interval);
  }, [currentUser.id, targetUser.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    await db.sendMessage(currentUser.id, targetUser.id, input);
    setInput('');
    refreshMsgs();
  };

  const handleSendRequest = async () => {
    try {
      await db.sendFriendRequest(currentUser.id, targetUser.id);
      setFriendStatus('pending');
      alert("好友申请已发送");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleMsgLongPress = (e: React.TouchEvent | React.MouseEvent, msg: Message) => {
    e.preventDefault();
    if (msg.type === 'recalled') return;
    
    // Simple coordinate extraction
    let x = 0, y = 0;
    if ('touches' in e) {
       x = e.touches[0].clientX;
       y = e.touches[0].clientY;
    } else {
       x = e.clientX;
       y = e.clientY;
    }
    setMsgMenu({ visible: true, x, y, msg });
  };

  // Actions
  const handleCopy = () => {
    if(msgMenu?.msg) navigator.clipboard.writeText(msgMenu.msg.content);
  };

  const handleDeleteMsg = async () => {
    if(msgMenu?.msg) {
      await db.deleteMessage(msgMenu.msg.id);
      refreshMsgs();
    }
  };

  const handleRecallMsg = async () => {
    if(msgMenu?.msg) {
       // Check 2 min limit (simulated)
       const now = Date.now();
       if (now - msgMenu.msg.timestamp > 2 * 60 * 1000) {
         alert("超过2分钟无法撤回");
         return;
       }
       await db.recallMessage(msgMenu.msg.id);
       refreshMsgs();
    }
  };

  const handleTranslate = () => {
    if(msgMenu?.msg) {
      setTranslatedMsgs(prev => ({...prev, [msgMenu.msg!.id]: !prev[msgMenu.msg!.id]}));
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[90] flex flex-col animate-in slide-in-from-right duration-300">
       <div className="h-14 border-b border-slate-100 flex items-center px-4 gap-3 bg-white justify-between relative z-20">
          <div className="flex items-center gap-3">
            <button onClick={onBack}><ChevronLeft size={24} className="text-slate-600" /></button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onUserClick(targetUser.id)}>
              <Avatar url={targetUser.avatar} size="w-8 h-8" />
              <span className="font-bold text-slate-800">{targetUser.name}</span>
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2"><MoreHorizontal size={24} className="text-slate-600" /></button>
       </div>

       {/* Banner only if NOT friend */}
       {!isContact && (
         <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center px-4 relative z-10">
            <span className="text-xs text-slate-500">对方不在你的好友列表中</span>
            <div className="flex gap-2">
               {friendStatus === 'pending' ? (
                 <button disabled className="bg-slate-200 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-lg">等待验证</button>
               ) : (
                 <button onClick={handleSendRequest} className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">添加好友</button>
               )}
            </div>
         </div>
       )}
       
       <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.map(m => {
            const isMe = m.fromId === currentUser.id;
            const isRecalled = m.type === 'recalled';
            
            if (isRecalled) {
              return (
                 <div key={m.id} className="flex justify-center py-2">
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                      {isMe ? '你撤回了一条消息' : `${targetUser.name} 撤回了一条消息`}
                    </span>
                 </div>
              );
            }

            return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
               {!isMe && <Avatar url={targetUser.avatar} size="w-8 h-8" className="mr-2 mt-1" />}
               <div 
                 className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm select-none relative group ${
                   isMe 
                   ? 'bg-emerald-600 text-white rounded-br-none' 
                   : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                 }`}
                 onContextMenu={(e) => handleMsgLongPress(e, m)}
               >
                 {m.content}
                 {translatedMsgs[m.id] && (
                   <div className={`mt-2 pt-2 border-t text-xs ${isMe ? 'border-emerald-500/50' : 'border-slate-100'}`}>
                      [翻译] <span className="opacity-90">{m.content} (Burmese/English Mock)</span>
                   </div>
                 )}
               </div>
               {isMe && <Avatar url={currentUser.avatar} size="w-8 h-8" className="ml-2 mt-1" />}
            </div>
            );
          })}
          <div ref={scrollRef} />
       </div>

       <div className="p-3 border-t border-slate-100 bg-white pb-safe flex gap-2">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="发消息..."
            className="flex-1 bg-slate-100 rounded-full px-4 py-2 outline-none"
          />
          <button onClick={send} className="p-2 bg-emerald-600 text-white rounded-full">
            <Send size={20} />
          </button>
       </div>

       {showSettings && (
         <ChatSettingsOverlay 
           targetUser={targetUser} 
           onClose={() => setShowSettings(false)} 
           onUserClick={onUserClick} 
           onRemoveContact={onRemoveContact}
           isContact={isContact}
         />
       )}

       {msgMenu && (
         <MessageContextMenu 
            position={{x: msgMenu.x, y: msgMenu.y}}
            onClose={() => setMsgMenu(null)}
            onCopy={handleCopy}
            onDelete={handleDeleteMsg}
            onTranslate={handleTranslate}
            onRecall={handleRecallMsg}
            isMine={msgMenu.msg?.fromId === currentUser.id}
         />
       )}
    </div>
  );
};

export default ChatScreen;