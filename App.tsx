import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, useLocation } from 'react-router-dom';
import { 
  Search, MapPin, Briefcase, PlusCircle, User as UserIcon, Building2, Banknote, 
  Home, Sparkles, ChevronLeft, Send, Bell, Bookmark, Settings, Heart, 
  MessageCircle, Image as ImageIcon, Camera, LogOut, Edit3, Grid, MoreHorizontal,
  ChevronRight, Video, FileText, Shield, Lock, Info, Film, UserPlus, UserMinus, 
  Share2, ThumbsUp, Trash2, Globe, Hash, QrCode, Check, X, Pin, ScanLine, Scan, Eye, EyeOff, Smartphone
} from 'lucide-react';
import jsQR from 'jsqr';
import { Job, LOCATIONS, CATEGORIES, User, Post, Message, PostCategory, News, Comment, FriendRequest } from './types';
import { MOCK_JOBS } from './constants';
import JobCard from './components/JobCard';
import PostJobModal from './components/PostJobModal';
import ResumeMatcher from './components/ResumeMatcher';
import CreatePostView from './components/CreatePostView'; 
import ChatScreen from './components/ChatScreen'; 
import PostDetailView from './components/PostDetailView'; 
import SettingsScreen from './components/SettingsScreen';
import Toast from './components/Toast';
import { db } from './services/mockDb';

// --- Helpers ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// --- Auth Context & Helper ---
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('current_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Auth load error", e);
      localStorage.removeItem('current_user');
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    localStorage.setItem('current_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('current_user');
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const updated = await db.updateUser(user.id, data);
      localStorage.setItem('current_user', JSON.stringify(updated));
      setUser(updated);
    } catch (e: any) {
      throw e; 
    }
  };

  const sendFriendRequest = async (toId: string) => {
    if (!user) return;
    try {
      await db.sendFriendRequest(user.id, toId);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  const removeContact = async (contactId: string) => {
    if (!user) return;
    const confirmed = window.confirm("确定要删除该好友吗？此操作不可撤销。");
    if(confirmed) {
       const updated = await db.removeContact(user.id, contactId);
       setUser(updated);
    }
  }

  const toggleFavorite = async (itemId: string, type: 'post' | 'job') => {
    if(!user) return;
    const updated = await db.toggleFavorite(user.id, itemId, type);
    setUser(updated);
  }

  const toggleLike = async (postId: string) => {
    if(!user) return;
    const updated = await db.toggleLike(user.id, postId);
    setUser(updated);
  }

  const togglePin = async (targetId: string) => {
    if(!user) return;
    const updated = await db.togglePin(user.id, targetId);
    setUser(updated);
  }

  return { user, loading, login, logout, updateProfile, sendFriendRequest, removeContact, toggleFavorite, toggleLike, togglePin };
};

// --- Components ---

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const Avatar: React.FC<{ url: string, size?: string, className?: string }> = ({ url, size = "w-10 h-10", className="" }) => (
  <img src={url} alt="Avatar" className={`${size} rounded-full object-cover border border-slate-200 ${className}`} />
);

// --- Auth Screens ---

const LoginScreen: React.FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let user;
      if (isRegister) {
        user = await db.register(username, password, name);
      } else {
        user = await db.login(username, password);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-8">
      <div className="text-center mb-10">
        <div className="inline-block p-4 bg-emerald-100 rounded-2xl mb-4">
          <Briefcase size={40} className="text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">爱贝通 (AiBeiTong)</h1>
        <p className="text-slate-500 mt-2">连接人才，发现机遇</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg text-center">{error}</div>}
        
        {isRegister && (
           <input required type="text" placeholder="你的名字 (Display Name)" value={name} onChange={e => setName(e.target.value)} 
            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none" />
        )}
        <input required type="text" placeholder="账号 (Username)" value={username} onChange={e => setUsername(e.target.value)} 
          className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none" />
        <input required type="password" placeholder="密码 (Password)" value={password} onChange={e => setPassword(e.target.value)} 
          className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none" />

        <button disabled={loading} type="submit" className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30">
          {loading ? '处理中...' : (isRegister ? '立即注册' : '登录')}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button onClick={() => setIsRegister(!isRegister)} className="text-slate-500 font-medium">
          {isRegister ? '已有账号？去登录' : '没有账号？创建新账号'}
        </button>
      </div>
    </div>
  );
};

// --- Social Feed Component ---

const SocialPostCard: React.FC<{ post: Post, onUserClick: (id: string) => void, onPostClick: (post: Post) => void }> = ({ post, onUserClick, onPostClick }) => {
  return (
    <div className="bg-white p-4 mb-2 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3 mb-3">
        <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); post.user && onUserClick(post.user.id); }}>
            <Avatar url={post.user?.avatar || ''} />
        </div>
        <div className="flex-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); post.user && onUserClick(post.user.id); }}>
          <h4 className="font-bold text-slate-900 text-sm">{post.user?.name}</h4>
          <p className="text-xs text-slate-500">{post.user?.title}</p>
        </div>
        {post.category === 'job' && (
          <span className="ml-auto bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-bold">招聘</span>
        )}
        {post.category !== 'job' && (
           <div className="ml-auto text-xs text-slate-400">
             {new Date(post.timestamp).toLocaleDateString()}
          </div>
        )}
      </div>
      
      {/* Clickable Content Area */}
      <div onClick={() => onPostClick(post)} className="cursor-pointer">
        <div className="text-slate-800 text-sm mb-3 whitespace-pre-line leading-relaxed">
          {post.content}
        </div>

        {post.image && (
          <div className="mb-3 rounded-xl overflow-hidden border border-slate-100">
            <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-96" />
          </div>
        )}

        {post.video && (
          <div className="mb-3 rounded-xl overflow-hidden border border-slate-100 bg-black relative flex items-center justify-center h-48">
             <Film size={32} className="text-white opacity-50" />
             <span className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 rounded">模拟视频</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 text-slate-500 text-sm pt-2">
        <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
          <Heart size={18} /> {post.likes}
        </button>
        <button onClick={() => onPostClick(post)} className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
          <MessageCircle size={18} /> {post.comments}
        </button>
      </div>
    </div>
  );
};

// --- Job Detail View ---

const JobDetailView: React.FC<{ 
  job: Job, 
  onBack: () => void,
  isSaved: boolean,
  onToggleSave: () => void,
  onApply: () => void
}> = ({ job, onBack, isSaved, onToggleSave, onApply }) => {
  return (
    <div className="bg-white min-h-screen pb-20 flex flex-col animate-in slide-in-from-right duration-300 z-[60] fixed inset-0 overflow-y-auto">
      {/* Nav */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between z-50">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
          <ChevronLeft size={24} className="text-slate-800" />
        </button>
        <span className="font-bold text-slate-800">职位详情</span>
        <button 
          onClick={onToggleSave}
          className={`p-2 rounded-full transition-colors ${isSaved ? 'text-yellow-500' : 'text-slate-400 hover:bg-slate-100'}`}
        >
          <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="pt-4 pb-20">
        {/* Header */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-slate-900 leading-snug flex-1 mr-4">{job.title}</h1>
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl font-bold text-slate-500 shrink-0">
              {job.company.charAt(0)}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-slate-600 font-medium mb-6">
            <Building2 size={16} />
            {job.company}
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold flex items-center gap-1.5">
               <Banknote size={14} /> {job.salaryRange}
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-sm font-medium flex items-center gap-1.5">
               <MapPin size={14} /> {job.location.split(' ')[0]}
            </span>
          </div>
        </div>

        <div className="h-2 bg-slate-50" />

        {/* Description */}
        <div className="p-6 space-y-8">
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-3 border-l-4 border-emerald-500 pl-3">职位描述</h3>
            <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
              {job.description}
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-3 border-l-4 border-emerald-500 pl-3">任职要求</h3>
            <ul className="space-y-3">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 safe-bottom">
        <button 
          onClick={onApply}
          className="w-full bg-slate-900 text-white font-bold text-lg py-3.5 rounded-xl shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <Send size={20} />
          立即申请 (Apply)
        </button>
      </div>
    </div>
  );
};

// --- Scanner View ---
const ScannerView: React.FC<{ onClose: () => void, onDetected: (id: string) => void }> = ({ onClose, onDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationId: number;

    const startScan = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
             videoRef.current?.play();
             tick();
          };
        }
      } catch (err: any) {
        console.error("Camera access failed", err);
        setError("无法访问摄像头，请确保已授权 (Permission Denied)");
        setScanning(false);
      }
    };

    const tick = () => {
      if (!scanning) return;
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Using jsQR to decode
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
             // Found QR Code
             setScanning(false);
             try {
                const data = JSON.parse(code.data);
                if (data.userId) {
                   onDetected(data.userId);
                } else {
                   onDetected(code.data);
                }
             } catch (e) {
                onDetected(code.data);
             }
             return; 
          }
        }
      }
      animationId = requestAnimationFrame(tick);
    };

    startScan();

    return () => {
      setScanning(false);
      cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
  <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-in fade-in duration-300">
    <div className="h-14 flex items-center justify-between px-4 z-20 absolute w-full">
      <button onClick={onClose} className="p-2 bg-black/30 rounded-full text-white backdrop-blur-sm">
        <X size={24} />
      </button>
      <span className="text-white font-bold">扫一扫</span>
      <div className="w-10"></div>
    </div>
    
    <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
       {/* Camera View */}
       <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-80" playsInline muted></video>
       <canvas ref={canvasRef} className="hidden"></canvas>

       {/* Overlay */}
       <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          <div className="w-64 h-64 border-2 border-emerald-500 rounded-2xl relative box-border shadow-[0_0_0_100vmax_rgba(0,0,0,0.6)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
          </div>
          <p className="text-white/80 text-sm mt-8">{error ? error : "将二维码放入框内，自动扫描"}</p>
       </div>
    </div>
    
    <div className="h-24 bg-black flex items-center justify-center gap-4 text-white z-20">
       <button onClick={() => alert("相册选取功能暂未开放")} className="flex flex-col items-center gap-1 opacity-80 hover:opacity-100">
          <ImageIcon size={24} />
          <span className="text-xs">相册</span>
       </button>
    </div>
  </div>
)};

// --- QR Code View (My Profile) ---
const QRCodeView: React.FC<{ user: User, onClose: () => void }> = ({ user, onClose }) => {
  const qrData = JSON.stringify({ userId: user.id, name: user.name });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

  return (
  <div className="fixed inset-0 bg-slate-900/90 backdrop-blur z-[100] flex items-center justify-center p-8 animate-in zoom-in-95" onClick={onClose}>
     <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
           <Avatar url={user.avatar} size="w-12 h-12" />
           <div>
              <h3 className="font-bold text-slate-900">{user.name}</h3>
              <p className="text-slate-500 text-xs">{user.location}</p>
           </div>
        </div>
        <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center mb-4 overflow-hidden">
           <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain p-2" />
        </div>
        <p className="text-center text-slate-500 text-sm">扫一扫上面的二维码图案，加我好友</p>
     </div>
  </div>
)};

// --- My Profile Detail View (Edit) ---
const MyProfileDetailView: React.FC<{ 
  user: User, 
  onBack: () => void, 
  onUpdate: (u: Partial<User>) => Promise<void>,
  onError: (msg: string) => void
}> = ({ user, onBack, onUpdate, onError }) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [showQR, setShowQR] = useState(false);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files?.[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      onUpdate({ avatar: base64 });
    }
  };

  const handleBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files?.[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      onUpdate({ backgroundImage: base64 });
    }
  };

  const editField = async (field: string, currentVal: string) => {
    const newVal = window.prompt(`修改${field}`, currentVal);
    if(newVal && newVal !== currentVal) {
      if(field === '名字') await onUpdate({ name: newVal });
      if(field === '简介') await onUpdate({ bio: newVal });
      if(field === '职位') await onUpdate({ title: newVal });
      if(field === '账号') {
        try {
          await onUpdate({ username: newVal });
        } catch(e: any) {
          onError(e.message);
        }
      }
    }
  };

  const Item = ({ label, value, isImg, onClick }: any) => (
    <div onClick={onClick} className="flex justify-between items-center p-4 bg-white border-b border-slate-50 active:bg-slate-50 cursor-pointer">
      <span className="text-slate-900 font-medium">{label}</span>
      <div className="flex items-center gap-2">
         {isImg ? <Avatar url={value} className="rounded-lg" /> : <span className="text-slate-500 text-sm max-w-[200px] truncate">{value}</span>}
         <ChevronRight size={16} className="text-slate-300" />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-100 z-[90] animate-in slide-in-from-right flex flex-col">
       <div className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-3">
          <button onClick={onBack}><ChevronLeft size={24} className="text-slate-600" /></button>
          <span className="font-bold text-slate-800 text-lg">个人信息</span>
       </div>
       <div className="mt-2 flex-1 overflow-y-auto">
         <Item label="头像" value={user.avatar} isImg onClick={() => avatarInputRef.current?.click()} />
         <Item label="背景墙" value={user.backgroundImage || ''} isImg onClick={() => bgInputRef.current?.click()} />
         <Item label="名字" value={user.name} onClick={() => editField('名字', user.name)} />
         <Item label="账号" value={user.username} onClick={() => editField('账号', user.username)} />
         <Item label="二维码名片" value={<QrCode size={18} />} onClick={() => setShowQR(true)} />
         <Item label="我的简介" value={user.bio} onClick={() => editField('简介', user.bio)} />
         <Item label="我的职位" value={user.title} onClick={() => editField('职位', user.title)} />
         <Item label="更多" value="" />
       </div>
       <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={handleAvatar} />
       <input type="file" ref={bgInputRef} hidden accept="image/*" onChange={handleBg} />
       {showQR && <QRCodeView user={user} onClose={() => setShowQR(false)} />}
    </div>
  );
};


// --- Other User Profile View ---

const OtherUserProfile: React.FC<{ currentUser: User, targetUser: User, onBack: () => void, onChat: () => void }> = ({ currentUser, targetUser, onBack, onChat }) => {
  return (
    <div className="fixed inset-0 bg-slate-50 z-[80] overflow-y-auto animate-in slide-in-from-right duration-300">
       <div className="h-48 bg-slate-300 relative">
          {targetUser.backgroundImage && <img src={targetUser.backgroundImage} className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-black/10"></div>
          <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-black/20 rounded-full text-white backdrop-blur-sm z-10">
            <ChevronLeft size={24} />
          </button>
       </div>
       
       <div className="px-4 relative -mt-16 pb-24">
          <div className="flex justify-between items-end mb-4">
             <Avatar url={targetUser.avatar} size="w-32 h-32" className="border-4 border-white shadow-lg" />
             <div className="flex gap-2 mb-2">
               <button onClick={onChat} className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-2">
                 <MessageCircle size={18} /> 发消息
               </button>
             </div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900">{targetUser.name}</h2>
          <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
             <span className="font-medium">账号: {targetUser.username}</span>
          </div>
          <p className="text-emerald-600 font-medium mb-1 mt-2">{targetUser.title}</p>
          <div className="flex items-center gap-4 text-slate-500 text-sm mb-4">
             <span className="flex items-center gap-1"><MapPin size={14} /> {targetUser.location}</span>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
             <h3 className="font-bold text-slate-800 mb-2">简介</h3>
             <p className="text-slate-600 text-sm leading-relaxed">{targetUser.bio}</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center py-8">
             <p className="text-slate-400 text-sm">暂无公开动态</p>
          </div>
       </div>
    </div>
  );
};

// --- Long Press Menu for Chat List ---
const LongPressMenu: React.FC<{
  position: {x: number, y: number},
  onClose: () => void,
  onPin: () => void,
  isPinned: boolean,
  onDeleteChat: () => void,
  onDeleteFriend?: () => void,
  isFriend: boolean
}> = ({ position, onClose, onPin, isPinned, onDeleteChat, onDeleteFriend, isFriend }) => (
  <div className="fixed inset-0 z-[100] flex" onClick={onClose}>
    <div 
      className="bg-white rounded-lg shadow-xl border border-slate-100 w-40 overflow-hidden absolute animate-in fade-in zoom-in-95 duration-100"
      style={{ top: position.y, left: Math.min(position.x, window.innerWidth - 170) }}
    >
      <button onClick={onPin} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium flex items-center gap-2">
        <Pin size={16} className={isPinned ? 'fill-current text-emerald-500' : ''} /> {isPinned ? '取消置顶' : '置顶聊天'}
      </button>
      <button onClick={onDeleteChat} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium text-red-500 flex items-center gap-2">
        <Trash2 size={16} /> 删除聊天
      </button>
      {isFriend && onDeleteFriend && (
        <button onClick={onDeleteFriend} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium text-red-500 flex items-center gap-2 border-t border-slate-50">
          <UserMinus size={16} /> 删除好友
        </button>
      )}
    </div>
  </div>
);


// --- App Structure ---

const App: React.FC = () => {
  const { user, loading, login, logout, updateProfile, sendFriendRequest, removeContact, toggleFavorite, toggleLike, togglePin } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showMyProfileDetail, setShowMyProfileDetail] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  // Profile Sub-tab
  const [profileTab, setProfileTab] = useState<'posts' | 'favorites'>('posts');
  
  // Navigation State
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [chatTarget, setChatTarget] = useState<User | null>(null);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  
  // Feed Filters
  const [feedFilter, setFeedFilter] = useState<PostCategory>('all');

  // Data
  const [posts, setPosts] = useState<Post[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [favorites, setFavorites] = useState<{posts: Post[], jobs: Job[]} | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<User[]>([]);

  // Jobs
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number, targetUser: User | null } | null>(null);

  // Toast
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  // Init Data
  useEffect(() => {
    const load = async () => {
      const allPosts = await db.getAllPosts();
      setPosts(allPosts);
      
      // Conversations Sorted by Pin
      if (user) {
         const conversations = await db.getConversations(user.id);
         // Sort: Pinned first
         conversations.sort((a, b) => {
           const aPinned = (user.pinnedChats || []).includes(a.id);
           const bPinned = (user.pinnedChats || []).includes(b.id);
           return (aPinned === bPinned) ? 0 : aPinned ? -1 : 1;
         });
         setUsersList(conversations);
      }

      if (user && usersList.length === 0) {
        setNews(db.getNews());
      }
      
      // Load user specific data
      if (user) {
         setMyPosts(await db.getUserPosts(user.id));
         setFavorites(await db.getFavorites(user.id));
         setFriendRequests(await db.getPendingRequests(user.id));
      }
    };
    if (user) load();
    const interval = setInterval(() => { if(user) load() }, 5000); // Poll for friend requests
    return () => clearInterval(interval);
  }, [user, activeTab, profileTab, contextMenu]); // Reload when pin changes

  // Search
  useEffect(() => {
    const search = async () => {
      if (searchQuery.trim().length > 0) {
        const res = await db.searchUsers(searchQuery);
        setSearchResult(res);
      } else {
        setSearchResult([]);
      }
    };
    search();
  }, [searchQuery]);

  const handlePostCreated = async () => {
    const allPosts = await db.getAllPosts();
    setPosts(allPosts);
    setShowPostModal(false);
    showToast("发布成功！");
  };

  const handlePostClick = async (post: Post) => {
    const fullPost = await db.getPostById(post.id);
    if (fullPost) setViewingPost(fullPost);
  };

  // View Routing for User Click
  const handleUserClick = async (userId: string) => {
    if(!user) return;
    if (userId === user.id) {
      setActiveTab('profile');
      return;
    }
    const u = await db.getUserById(userId);
    if (u) setViewingUser(u);
  };

  const handleToggleFavorite = (id: string, type: 'post' | 'job') => {
    toggleFavorite(id, type);
    showToast("操作成功");
  }

  const handleAcceptRequest = async (reqId: string) => {
    await db.acceptFriendRequest(reqId);
    showToast("已添加好友");
    // Reload requests
    if(user) setFriendRequests(await db.getPendingRequests(user.id));
  };

  const handleContextMenu = (e: React.MouseEvent, targetUser: User) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetUser });
  };

  // Long press logic for mobile
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTouchStart = (e: React.TouchEvent, targetUser: User) => {
    const touch = e.touches[0];
    timerRef.current = setTimeout(() => {
      setContextMenu({ visible: true, x: touch.clientX, y: touch.clientY, targetUser });
    }, 800);
  };
  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // Handle Scan Detection
  const handleScanDetected = async (id: string) => {
    setShowScanner(false);
    // Simple basic check if it looks like a user ID
    if(id.startsWith('user_')) {
       handleUserClick(id);
    } else {
       showToast(`扫描结果: ${id}`);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin text-emerald-600">Loading...</div></div>;
  if (!user) return <LoginScreen onLogin={login} />;

  // --- Tab Views ---

  const renderHome = () => {
    const filteredPosts = posts.filter(p => feedFilter === 'all' || p.category === feedFilter);
    return (
    <div className="pb-24 pt-40 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white z-40 border-b border-slate-100 md:absolute md:w-full md:rounded-t-2xl">
         <div className="flex justify-between items-center px-4 h-14">
            <div className="flex items-center gap-1">
               <Briefcase size={24} className="text-emerald-600" />
               <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">爱贝通</h1>
            </div>
            <div className="flex items-center gap-2">
               <button onClick={() => setShowScanner(true)} className="relative p-2"><ScanLine size={24} className="text-slate-600" /></button>
               <button className="relative p-2"><Bell size={24} className="text-slate-600" /></button>
            </div>
         </div>
         <div className="px-4 pb-2">
            <div className="bg-slate-100 flex items-center rounded-xl px-3 py-2">
              <Search size={16} className="text-slate-400 mr-2" />
              <input 
                placeholder="搜索用户、职位..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-sm w-full" 
              />
            </div>
         </div>
         {/* Filter Tabs */}
         <div className="flex px-4 gap-4 overflow-x-auto no-scrollbar pb-3 text-sm font-medium border-b border-slate-50">
           {[
             {id: 'all', label: '推荐'},
             {id: 'text', label: '文本'},
             {id: 'image', label: '图片'},
             {id: 'video', label: '视频'},
             {id: 'job', label: '招聘'}
           ].map(f => (
             <button 
               key={f.id} 
               onClick={() => setFeedFilter(f.id as PostCategory)}
               className={`whitespace-nowrap pb-1 ${feedFilter === f.id ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500'}`}
             >
               {f.label}
             </button>
           ))}
         </div>
      </div>
      
      {/* Search Results */}
      {searchResult.length > 0 && (
        <div className="px-4 mb-4 mt-2">
           <h3 className="text-xs font-bold text-slate-400 mb-2">搜索结果</h3>
           {searchResult.map(u => (
             <div key={u.id} onClick={() => handleUserClick(u.id)} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 mb-2 cursor-pointer">
                <Avatar url={u.avatar} />
                <div className="flex-1">
                  <div className="font-bold text-sm">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.title}</div>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
             </div>
           ))}
        </div>
      )}

      {/* Feed */}
      <div className="space-y-2 mt-2">
         {filteredPosts.length > 0 ? filteredPosts.map(post => (
           <SocialPostCard key={post.id} post={post} onUserClick={handleUserClick} onPostClick={handlePostClick} />
         )) : (
           <div className="text-center py-10 text-slate-400 text-sm">暂无该分类内容</div>
         )}
      </div>
    </div>
  )};

  const renderMessages = () => (
    <div className="pt-16 px-4 pb-24 min-h-screen bg-white">
      <h2 className="text-2xl font-bold mb-6">消息</h2>
      
      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="mb-6">
           <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">新的朋友</div>
           <div className="space-y-2">
             {friendRequests.map(req => (
               <div key={req.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <Avatar url={req.fromUser?.avatar || ''} />
                  <div className="flex-1">
                     <div className="font-bold text-sm text-slate-900">{req.fromUser?.name}</div>
                     <div className="text-xs text-slate-500">请求添加你为好友</div>
                  </div>
                  <button 
                    onClick={() => handleAcceptRequest(req.id)}
                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                  >
                    接受
                  </button>
               </div>
             ))}
           </div>
        </div>
      )}

      <div className="space-y-4">
        {usersList.length === 0 ? (
          <div className="space-y-6">
             <div className="text-center text-slate-400 mt-4 text-sm">
               <p>暂无消息，去认识新朋友吧！</p>
             </div>
             
             {/* News Section for Empty Chat */}
             <div className="border-t border-slate-100 pt-6">
               <div className="flex items-center gap-2 mb-4">
                 <Globe className="text-emerald-600" size={20} />
                 <h3 className="font-bold text-slate-800">热门资讯</h3>
               </div>
               <div className="space-y-4">
                 {news.map(n => (
                   <div key={n.id} className="flex gap-4 items-start cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors">
                      <div className="flex-1">
                         <h4 className="font-bold text-slate-900 text-sm mb-1 leading-snug">{n.title}</h4>
                         <div className="flex gap-2 text-xs text-slate-400">
                            <span className="text-emerald-600 bg-emerald-50 px-1.5 rounded">{n.category}</span>
                            <span>{n.source}</span>
                         </div>
                      </div>
                      <img src={n.image} className="w-20 h-14 object-cover rounded-lg bg-slate-100" />
                   </div>
                 ))}
               </div>
             </div>
          </div>
        ) : (
          usersList.map(u => {
            const isPinned = (user.pinnedChats || []).includes(u.id);
            return (
            <div 
              key={u.id} 
              onClick={() => setChatTarget(u)} 
              onContextMenu={(e) => handleContextMenu(e, u)}
              onTouchStart={(e) => handleTouchStart(e, u)}
              onTouchEnd={handleTouchEnd}
              className={`flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border relative select-none ${isPinned ? 'bg-slate-50 border-emerald-100' : 'border-slate-50'}`}
            >
               <Avatar url={u.avatar} size="w-12 h-12" />
               <div className="flex-1">
                 <div className="flex justify-between">
                   <h4 className="font-bold text-slate-900">{u.name}</h4>
                   {isPinned && <Pin size={12} className="text-emerald-500 fill-current rotate-45" />}
                 </div>
                 <p className="text-xs text-slate-500 truncate">点击查看消息记录...</p>
               </div>
               <ChevronRight size={16} className="text-slate-300" />
            </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="min-h-screen bg-white pb-24">
       {/* Reverted Classic Header Style (View Only) */}
       <div className="h-48 bg-slate-300 relative group">
          {user.backgroundImage && <img src={user.backgroundImage} className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* Top Right Actions */}
          <div className="absolute top-4 right-4 flex gap-3">
             <button onClick={() => setShowSettings(true)} className="p-2 bg-black/30 text-white rounded-full backdrop-blur-sm hover:bg-black/40 transition-colors z-20">
               <Settings size={20} />
             </button>
          </div>
       </div>

       <div className="px-4 relative -mt-10">
          <div className="flex justify-between items-end">
             <Avatar url={user.avatar} size="w-24 h-24" className="border-4 border-white shadow-md bg-white" />
             <button onClick={() => setShowMyProfileDetail(true)} className="mb-2 px-6 py-1.5 border border-slate-300 rounded-full text-sm font-bold bg-white text-slate-700 shadow-sm active:bg-slate-50">
               编辑资料
             </button>
          </div>
          
          <div className="mt-3">
            <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-slate-500 text-xs mt-1">账号: {user.username}</p>
            <p className="text-emerald-600 font-medium text-sm mt-1">{user.title}</p>
            <p className="text-slate-600 text-sm leading-relaxed mt-3 mb-4">{user.bio}</p>
          </div>
          
          <div className="flex gap-4 text-sm text-slate-500 mb-6">
             <span className="flex items-center gap-1"><MapPin size={14} /> {user.location}</span>
          </div>
       </div>

       {/* Xiaohongshu Style Tabs - REMOVED LIKED */}
       <div className="sticky top-0 bg-white z-30 border-b border-slate-100 flex shadow-sm">
          <button 
            onClick={() => setProfileTab('posts')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${profileTab === 'posts' ? 'border-emerald-600 text-slate-900' : 'border-transparent text-slate-400'}`}
          >
            动态
          </button>
          <button 
            onClick={() => setProfileTab('favorites')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${profileTab === 'favorites' ? 'border-emerald-600 text-slate-900' : 'border-transparent text-slate-400'}`}
          >
            收藏
          </button>
       </div>

       {/* Tab Content */}
       <div className="bg-slate-50 min-h-[300px] p-2">
         {profileTab === 'posts' && (
           <div className="space-y-2">
             {myPosts.length === 0 ? <div className="text-center py-10 text-slate-400 text-sm">暂无动态</div> : 
               myPosts.map(p => <SocialPostCard key={p.id} post={p} onUserClick={handleUserClick} onPostClick={handlePostClick} />)
             }
           </div>
         )}
         {profileTab === 'favorites' && favorites && (
           <div className="space-y-2">
             {(favorites.posts.length === 0 && favorites.jobs.length === 0) ? <div className="text-center py-10 text-slate-400 text-sm">暂无收藏</div> : (
               <>
                {favorites.jobs.map(j => (
                  <div key={j.id} onClick={(e) => { e.stopPropagation(); setCurrentJob(j); }}>
                     <JobCard job={j} onClick={() => {}} />
                  </div>
                ))}
                {favorites.posts.map(p => <SocialPostCard key={p.id} post={p} onUserClick={handleUserClick} onPostClick={handlePostClick} />)}
               </>
             )}
           </div>
         )}
       </div>
    </div>
  );

  // Main Render
  return (
    <HashRouter>
      <ScrollToTop />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="h-full w-full mx-auto md:max-w-md md:h-[95vh] md:my-[2.5vh] md:border md:border-slate-200 md:shadow-2xl md:rounded-2xl bg-white relative overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto no-scrollbar relative bg-slate-50">
          
          {/* Overlays / Sub-Screens */}
          {chatTarget ? (
            <ChatScreen 
              currentUser={user} 
              targetUser={chatTarget} 
              onBack={() => setChatTarget(null)} 
              onUserClick={handleUserClick}
              onRemoveContact={removeContact}
            />
          ) : viewingPost ? (
            <PostDetailView 
              post={viewingPost} 
              currentUser={user} 
              onBack={() => setViewingPost(null)} 
              onUserClick={handleUserClick}
              isSaved={user.favorites?.some(f => f.id === viewingPost.id) || false}
              onToggleSave={() => handleToggleFavorite(viewingPost.id, 'post')}
              onAddContact={sendFriendRequest}
              isContact={(user.contacts || []).includes(viewingPost.userId)}
              friendStatus={user.contacts.includes(viewingPost.userId) ? 'friend' : 'none'}
            />
          ) : viewingUser ? (
            <OtherUserProfile 
              currentUser={user} 
              targetUser={viewingUser} 
              onBack={() => setViewingUser(null)} 
              onChat={() => {
                setChatTarget(viewingUser);
                setViewingUser(null);
              }} 
            />
          ) : showSettings ? (
            <SettingsScreen onBack={() => setShowSettings(false)} onLogout={logout} user={user} onUpdate={updateProfile} showToast={showToast} />
          ) : showMyProfileDetail ? (
             <MyProfileDetailView user={user} onBack={() => setShowMyProfileDetail(false)} onUpdate={updateProfile} onError={(msg) => showToast(msg, 'error')} />
          ) : currentJob ? (
            <JobDetailView 
              job={currentJob} 
              onBack={() => setCurrentJob(null)}
              isSaved={user.favorites?.some(f => f.id === currentJob.id) || false}
              onToggleSave={() => handleToggleFavorite(currentJob.id, 'job')}
              onApply={() => showToast("申请已发送！雇主将尽快联系您。")}
            />
          ) : (
             <>
               {activeTab === 'home' && renderHome()}
               {activeTab === 'jobs' && (
                 <div className="pt-20 pb-24 px-4 min-h-screen bg-slate-50">
                    <h2 className="text-xl font-bold mb-4">工作机会</h2>
                    {jobs.length === 0 ? <div className="text-center text-slate-400 py-10">暂无职位信息</div> : 
                      jobs.map(j => <JobCard key={j.id} job={j} onClick={setCurrentJob} />)
                    }
                 </div>
               )}
               {activeTab === 'messages' && renderMessages()}
               {activeTab === 'profile' && renderProfile()}
             </>
          )}
        </div>

        {/* Navigation */}
        {!chatTarget && !viewingUser && !viewingPost && !showSettings && !currentJob && !showMyProfileDetail && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe md:absolute md:w-full md:rounded-b-2xl">
             <div className="flex justify-around items-center px-2 py-2">
                <button onClick={() => setActiveTab('home')} className={`p-2 flex flex-col items-center ${activeTab === 'home' ? 'text-emerald-600' : 'text-slate-400'}`}>
                   <Home size={24} strokeWidth={activeTab==='home'?2.5:2} />
                </button>
                <button onClick={() => setActiveTab('jobs')} className={`p-2 flex flex-col items-center ${activeTab === 'jobs' ? 'text-emerald-600' : 'text-slate-400'}`}>
                   <Briefcase size={24} strokeWidth={activeTab==='jobs'?2.5:2} />
                </button>
                <button onClick={() => setShowPostModal(true)} className="p-3 bg-emerald-600 text-white rounded-full shadow-lg -mt-8 hover:scale-105 transition-transform active:scale-95">
                   <PlusCircle size={28} />
                </button>
                <button onClick={() => setActiveTab('messages')} className={`p-2 flex flex-col items-center ${activeTab === 'messages' ? 'text-emerald-600' : 'text-slate-400'}`}>
                   <MessageCircle size={24} strokeWidth={activeTab==='messages'?2.5:2} />
                </button>
                <button onClick={() => setActiveTab('profile')} className={`p-2 flex flex-col items-center ${activeTab === 'profile' ? 'text-emerald-600' : 'text-slate-400'}`}>
                   <UserIcon size={24} strokeWidth={activeTab==='profile'?2.5:2} />
                </button>
             </div>
          </div>
        )}

        {showPostModal && <CreatePostView currentUser={user} onClose={() => setShowPostModal(false)} onSuccess={handlePostCreated} />}
        {showScanner && <ScannerView onClose={() => setShowScanner(false)} onDetected={handleScanDetected} />}

        {contextMenu && (
          <LongPressMenu 
            position={{x: contextMenu.x, y: contextMenu.y}} 
            onClose={() => setContextMenu(null)}
            onPin={() => { togglePin(contextMenu.targetUser?.id || ''); setContextMenu(null); }}
            isPinned={(user.pinnedChats || []).includes(contextMenu.targetUser?.id || '')}
            onDeleteChat={() => { showToast('已删除聊天'); setContextMenu(null); }}
            onDeleteFriend={() => { if(contextMenu.targetUser) removeContact(contextMenu.targetUser.id); setContextMenu(null); }}
            isFriend={user.contacts.includes(contextMenu.targetUser?.id || '')}
          />
        )}
      </div>
    </HashRouter>
  );
};

export default App;