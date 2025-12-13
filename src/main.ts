import { db } from '../services/mockDb';
import { MOCK_JOBS } from '../constants';
import { User, Job, Post, Message, LOCATIONS } from '../types';

// Declare global variables to avoid TS errors
declare global {
  interface Window {
    lucide: {
      createIcons: (options: any) => void;
      icons: any;
    };
    app: any;
  }
}

console.log("Main script executing...");

// --- 类型定义 ---
type ViewState = 'tab-home' | 'tab-jobs' | 'tab-messages' | 'tab-profile';
type ModalState = 'none' | 'post-detail' | 'job-detail' | 'chat' | 'edit-profile' | 'create-post' | 'settings';

class AppState {
  user: User | null = null;
  activeTab: ViewState = 'tab-home';
  modal: ModalState = 'none';
  
  posts: Post[] = [];
  jobs: Job[] = MOCK_JOBS;
  conversations: User[] = [];
  messages: Message[] = [];
  
  selectedPostId: string | null = null;
  selectedJobId: string | null = null;
  selectedChatUserId: string | null = null;

  constructor() {
    this.init();
  }

  async init() {
    try {
      const stored = localStorage.getItem('current_user');
      if (stored) {
        this.user = JSON.parse(stored);
      }
      
      // 关键：无论数据加载是否成功，先渲染 UI，防止白屏
      render();
      
      // 异步加载数据
      await this.loadInitialData();
    } catch (e) {
      console.error("Init failed", e);
      // 即使出错也尝试渲染
      render();
    }
  }

  async loadInitialData() {
    if (!this.user) return;
    
    try {
        const [posts, allUsers] = await Promise.all([
            db.getAllPosts().catch(() => []),
            db.getAllUsersPublic().catch(() => [])
        ]);
        
        this.posts = posts;
        this.conversations = allUsers.filter((u: User) => u.id !== this.user?.id);
        render(); 
    } catch (e) {
        console.error("Data load error:", e);
    }
  }

  // --- Actions ---

  setUser(user: User | null) {
    this.user = user;
    if (user) {
        localStorage.setItem('current_user', JSON.stringify(user));
        this.loadInitialData();
    } else {
        localStorage.removeItem('current_user');
    }
    render();
  }

  setTab(tab: ViewState) {
    this.activeTab = tab;
    this.modal = 'none';
    render();
  }

  // Post Actions
  async toggleLike(postId: string) {
    if (!this.user) return;
    try {
        await db.toggleLike(this.user.id, postId);
        // Optimistic update
        const pIndex = this.posts.findIndex(p => p.id === postId);
        if (pIndex > -1) {
             const hasLiked = this.user.likedPosts?.includes(postId);
             if (hasLiked) {
                 this.user.likedPosts = this.user.likedPosts?.filter(id => id !== postId);
                 this.posts[pIndex].likes = Math.max(0, this.posts[pIndex].likes - 1);
             } else {
                 this.user.likedPosts = [...(this.user.likedPosts || []), postId];
                 this.posts[pIndex].likes++;
             }
        }
        render();
    } catch (e) { console.error(e); }
  }

  openPostDetail(postId: string) {
    this.selectedPostId = postId;
    this.modal = 'post-detail';
    render();
  }

  async submitComment(content: string) {
    if (!this.user || !this.selectedPostId) return;
    await db.addComment(this.selectedPostId, this.user.id, content);
    this.posts = await db.getAllPosts();
    render();
  }

  // Job Actions
  openJobDetail(jobId: string) {
    this.selectedJobId = jobId;
    this.modal = 'job-detail';
    render();
  }

  // Chat Actions
  async openChat(userId: string) {
    this.selectedChatUserId = userId;
    if (this.user) {
        this.messages = await db.getMessagesBetween(this.user.id, userId);
    }
    this.modal = 'chat';
    render();
  }

  async sendMessage(content: string) {
    if (!this.user || !this.selectedChatUserId) return;
    this.messages.push({
        id: 'temp_' + Date.now(), fromId: this.user.id, toId: this.selectedChatUserId, content, timestamp: Date.now(), isRead: false, type: 'text'
    });
    render();

    await db.sendMessage(this.user.id, this.selectedChatUserId, content);
    this.messages = await db.getMessagesBetween(this.user.id, this.selectedChatUserId);
    render();
  }

  // Profile Actions
  openEditProfile() {
    this.modal = 'edit-profile';
    render();
  }

  async saveProfile(updatedData: Partial<User>) {
    if (!this.user) return;
    const newUser = await db.updateUser(this.user.id, updatedData);
    this.user = newUser;
    localStorage.setItem('current_user', JSON.stringify(newUser));
    this.modal = 'none';
    render();
  }

  closeModal() {
    this.modal = 'none';
    this.selectedPostId = null;
    this.selectedJobId = null;
    this.selectedChatUserId = null;
    render();
  }
}

const state = new AppState();
const app = document.getElementById('app')!;

// --- Helper Components ---

function Avatar(url: string, size = 'w-10 h-10') {
    return `<img src="${url}" class="${size} rounded-full object-cover border border-slate-200 bg-slate-100" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=Error'"/>`;
}

function BackHeader(title: string, closeAction = 'window.app.closeModal()') {
    return `
    <div class="h-14 border-b border-slate-100 flex items-center px-4 bg-white sticky top-0 z-50">
        <button onclick="${closeAction}" class="p-2 -ml-2 text-slate-600 active:bg-slate-100 rounded-full">
            <i data-lucide="chevron-left" class="w-6 h-6"></i>
        </button>
        <h2 class="text-lg font-bold text-slate-800 ml-2 flex-1">${title}</h2>
    </div>`;
}

// --- Views ---

function LoginView() {
  return `
    <div class="min-h-screen bg-white flex flex-col justify-center px-8">
      <div class="text-center mb-10">
        <div class="inline-block p-4 bg-emerald-100 rounded-2xl mb-4">
          <i data-lucide="briefcase" class="text-emerald-600 w-10 h-10"></i>
        </div>
        <h1 class="text-3xl font-bold text-slate-900">爱贝通</h1>
        <p class="text-slate-500 mt-2">连接缅甸华人与本地机遇</p>
      </div>
      <form onsubmit="window.app.handleLogin(event)" class="space-y-4">
        <input id="username" type="text" value="admin" placeholder="账号 (admin)" class="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 transition-colors" required />
        <input id="password" type="password" value="password" placeholder="密码 (password)" class="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 transition-colors" required />
        <button type="submit" class="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-200">登录 / 注册</button>
      </form>
    </div>
  `;
}

function NavBar() {
  const btn = (tab: ViewState, icon: string, label: string) => {
    const active = state.activeTab === tab;
    return `
      <button onclick="window.app.setTab('${tab}')" class="flex-1 flex flex-col items-center justify-center py-2 active:scale-90 transition-transform ${active ? 'text-emerald-600' : 'text-slate-400'}">
        <i data-lucide="${icon}" class="${active ? 'fill-emerald-100' : ''} w-6 h-6 mb-0.5"></i>
        <span class="text-[10px] font-medium">${label}</span>
      </button>
    `;
  };

  return `
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe z-40 md:absolute">
       <div class="flex items-center h-14">
          ${btn('tab-home', 'home', '首页')}
          ${btn('tab-jobs', 'briefcase', '职位')}
          <div class="relative -top-5">
            <button onclick="alert('发布功能开发中')" class="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200 active:scale-90 transition-transform">
                <i data-lucide="plus" class="w-6 h-6"></i>
            </button>
          </div>
          ${btn('tab-messages', 'message-circle', '消息')}
          ${btn('tab-profile', 'user', '我的')}
       </div>
    </div>
  `;
}

function HomeView() {
    const postsHtml = state.posts.map(post => {
        const isLiked = state.user?.likedPosts?.includes(post.id);
        return `
        <div class="bg-white p-4 mb-2 border-b border-slate-100 active:bg-slate-50 transition-colors" onclick="window.app.openPostDetail('${post.id}')">
            <div class="flex items-center gap-3 mb-3">
                ${Avatar(post.user?.avatar || '')}
                <div class="flex-1">
                    <h4 class="font-bold text-slate-900 text-sm">${post.user?.name}</h4>
                    <p class="text-xs text-slate-400">${new Date(post.timestamp).toLocaleString()}</p>
                </div>
                ${post.category === 'job' ? '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded font-bold">招聘</span>' : ''}
            </div>
            <p class="text-slate-800 text-sm mb-3 whitespace-pre-line leading-relaxed">${post.content}</p>
            ${post.image ? `<div class="mb-3 rounded-xl overflow-hidden"><img src="${post.image}" class="w-full object-cover max-h-60" /></div>` : ''}
            
            <div class="flex items-center justify-between mt-2">
                <div class="flex gap-6">
                    <button onclick="event.stopPropagation(); window.app.toggleLike('${post.id}')" class="flex items-center gap-1.5 ${isLiked ? 'text-red-500' : 'text-slate-500'} active:scale-110 transition-transform">
                        <i data-lucide="heart" class="w-5 h-5 ${isLiked ? 'fill-current' : ''}"></i>
                        <span class="text-xs font-bold">${post.likes}</span>
                    </button>
                    <button class="flex items-center gap-1.5 text-slate-500">
                        <i data-lucide="message-circle" class="w-5 h-5"></i>
                        <span class="text-xs font-bold">${post.comments}</span>
                    </button>
                </div>
                <button class="text-slate-400"><i data-lucide="share-2" class="w-5 h-5"></i></button>
            </div>
        </div>
        `;
    }).join('');

    return `
        <div class="h-full overflow-y-auto bg-slate-50 pb-20">
             <div class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
                <h1 class="text-xl font-extrabold text-emerald-600 tracking-tight">爱贝通</h1>
                <i data-lucide="bell" class="text-slate-600 w-6 h-6"></i>
             </div>
             ${postsHtml}
        </div>
    `;
}

function JobsView() {
    return `
        <div class="h-full overflow-y-auto bg-slate-50 pb-20 p-4">
             <div class="sticky top-0 bg-slate-50 z-10 pb-4">
                <h1 class="text-2xl font-bold text-slate-900 mb-4">工作机会</h1>
                <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    ${['全部', '仰光', '曼德勒', '翻译', '销售', '工厂'].map(t => 
                        `<button class="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-sm whitespace-nowrap text-slate-600 active:bg-emerald-50 active:border-emerald-200 active:text-emerald-700">${t}</button>`
                    ).join('')}
                </div>
             </div>
             <div class="space-y-3">
                ${state.jobs.map(job => `
                    <div onclick="window.app.openJobDetail('${job.id}')" class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm active:scale-[0.99] transition-transform">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold text-slate-800 text-lg line-clamp-1">${job.title}</h3>
                            <span class="text-emerald-600 font-bold text-sm whitespace-nowrap">${job.salaryRange.split(' ')[0]}</span>
                        </div>
                        <p class="text-sm text-slate-600 mb-2">${job.company} · ${job.location.split(' ')[0]}</p>
                        <div class="flex gap-2 mb-3">
                            ${job.tags.slice(0,3).map(tag => `<span class="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded">${tag}</span>`).join('')}
                        </div>
                        <div class="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-50 pt-3">
                            ${Avatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${job.company}`, 'w-5 h-5')}
                            <span>HR · 刚刚活跃</span>
                        </div>
                    </div>
                `).join('')}
             </div>
        </div>
    `;
}

function MessagesView() {
    return `
        <div class="h-full overflow-y-auto bg-white pb-20">
             <div class="px-4 h-14 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h1 class="text-xl font-bold text-slate-900">消息</h1>
                <button><i data-lucide="user-plus" class="w-6 h-6 text-slate-600"></i></button>
             </div>
             <div class="divide-y divide-slate-50">
                ${state.conversations.map(u => `
                    <div onclick="window.app.openChat('${u.id}')" class="p-4 flex items-center gap-3 active:bg-slate-50">
                        ${Avatar(u.avatar, 'w-12 h-12')}
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-baseline mb-1">
                                <h3 class="font-bold text-slate-900 truncate">${u.name}</h3>
                                <span class="text-xs text-slate-400">12:30</span>
                            </div>
                            <p class="text-sm text-slate-500 truncate">点击开始聊天...</p>
                        </div>
                    </div>
                `).join('')}
                ${state.conversations.length === 0 ? '<div class="p-10 text-center text-slate-400">暂无消息联系人</div>' : ''}
             </div>
        </div>
    `;
}

function ProfileView() {
    const u = state.user!;
    return `
        <div class="h-full overflow-y-auto bg-slate-50 pb-20">
             <div class="bg-white pb-6 pt-safe">
                 <div class="flex justify-end px-4 py-2">
                    <button onclick="window.app.openEditProfile()" class="p-2 text-slate-600"><i data-lucide="settings" class="w-6 h-6"></i></button>
                 </div>
                 <div class="px-6 flex flex-col items-center">
                     <div class="relative mb-4">
                        ${Avatar(u.avatar, 'w-24 h-24')}
                        <button onclick="window.app.openEditProfile()" class="absolute bottom-0 right-0 bg-emerald-600 text-white p-1.5 rounded-full border-2 border-white">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                     </div>
                     <h2 class="text-2xl font-bold text-slate-900 mb-1">${u.name}</h2>
                     <p class="text-slate-500 text-sm mb-4">${u.title || '暂无职位'} @ ${u.location || '缅甸'}</p>
                     
                     <div class="flex w-full justify-around border-t border-b border-slate-100 py-4 mb-4">
                        <div class="text-center">
                            <div class="font-bold text-lg text-slate-900">12</div>
                            <div class="text-xs text-slate-400">动态</div>
                        </div>
                        <div class="text-center">
                            <div class="font-bold text-lg text-slate-900">145</div>
                            <div class="text-xs text-slate-400">关注</div>
                        </div>
                        <div class="text-center">
                            <div class="font-bold text-lg text-slate-900">892</div>
                            <div class="text-xs text-slate-400">粉丝</div>
                        </div>
                     </div>
                     
                     <div class="w-full px-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl mb-4 text-center">
                        "${u.bio || '这个人很懒，什么都没写'}"
                     </div>
                     
                     <button onclick="window.app.openEditProfile()" class="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm mb-2">编辑资料</button>
                 </div>
             </div>
             
             <div class="mt-2 bg-white p-4">
                <h3 class="font-bold text-slate-900 mb-4">我的动态</h3>
                <p class="text-center text-slate-400 text-sm py-4">暂无更多动态</p>
             </div>
        </div>
    `;
}

function PostDetailModal() {
    const post = state.posts.find(p => p.id === state.selectedPostId);
    if (!post) return '';
    const commentsHtml = (post.commentsList || []).map(c => `
        <div class="flex gap-3 mb-4">
            ${Avatar(c.user?.avatar || '', 'w-8 h-8')}
            <div class="flex-1 bg-slate-50 p-3 rounded-r-xl rounded-bl-xl">
                <div class="flex justify-between items-baseline mb-1">
                    <span class="font-bold text-sm text-slate-700">${c.user?.name}</span>
                    <span class="text-[10px] text-slate-400">${new Date(c.timestamp).toLocaleDateString()}</span>
                </div>
                <p class="text-sm text-slate-800">${c.content}</p>
            </div>
        </div>
    `).join('');

    return `
    <div class="fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-right duration-200">
        ${BackHeader('动态详情')}
        <div class="flex-1 overflow-y-auto p-4 bg-white">
            <div class="flex items-center gap-3 mb-4">
                ${Avatar(post.user?.avatar || '')}
                <div>
                    <h4 class="font-bold text-slate-900">${post.user?.name}</h4>
                    <p class="text-xs text-slate-400">${new Date(post.timestamp).toLocaleString()}</p>
                </div>
            </div>
            <p class="text-lg text-slate-800 mb-4 leading-relaxed">${post.content}</p>
            ${post.image ? `<img src="${post.image}" class="w-full rounded-xl mb-6" />` : ''}
            
            <div class="border-t border-slate-100 pt-6">
                <h3 class="font-bold text-slate-800 mb-4">评论 (${post.comments})</h3>
                <div class="mb-20">
                    ${commentsHtml.length ? commentsHtml : '<p class="text-slate-400 text-center py-4">暂无评论</p>'}
                </div>
            </div>
        </div>
        <div class="border-t border-slate-100 p-3 bg-white pb-safe flex gap-2">
            <input id="commentInput" type="text" placeholder="写评论..." class="flex-1 bg-slate-100 rounded-full px-4 py-2 outline-none text-sm">
            <button onclick="window.app.submitComment()" class="text-emerald-600 font-bold px-3">发送</button>
        </div>
    </div>
    `;
}

function JobDetailModal() {
    const job = state.jobs.find(j => j.id === state.selectedJobId);
    if (!job) return '';
    return `
    <div class="fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-right duration-200">
        ${BackHeader('职位详情')}
        <div class="flex-1 overflow-y-auto p-5 pb-24">
            <h1 class="text-2xl font-bold text-slate-900 mb-2">${job.title}</h1>
            <p class="text-emerald-600 font-bold text-lg mb-4">${job.salaryRange}</p>
            
            <div class="flex items-center gap-3 p-4 bg-slate-50 rounded-xl mb-6">
                ${Avatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${job.company}`)}
                <div>
                    <div class="font-bold text-slate-900">${job.company}</div>
                    <div class="text-xs text-slate-500">${job.location} · ${job.type}</div>
                </div>
            </div>
            
            <div class="space-y-6">
                <section>
                    <h3 class="font-bold text-slate-900 mb-2">职位描述</h3>
                    <div class="text-slate-600 text-sm leading-relaxed whitespace-pre-line">${job.description}</div>
                </section>
                <section>
                    <h3 class="font-bold text-slate-900 mb-2">任职要求</h3>
                    <ul class="list-disc pl-5 text-slate-600 text-sm space-y-1">
                        ${job.requirements.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </section>
            </div>
        </div>
        <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 pb-safe md:absolute">
            <button onclick="alert('投递成功！')" class="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-700">立即投递</button>
        </div>
    </div>
    `;
}

function ChatModal() {
    const targetUser = state.conversations.find(u => u.id === state.selectedChatUserId) || state.conversations[0];
    if (!targetUser) return '';
    
    const msgsHtml = state.messages.map(m => {
        const isMe = m.fromId === state.user?.id;
        return `
            <div class="flex ${isMe ? 'justify-end' : 'justify-start'} mb-4">
                <div class="max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'}">
                    ${m.content}
                </div>
            </div>
        `;
    }).join('');

    return `
    <div class="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-in slide-in-from-right duration-200">
        <div class="h-14 bg-white border-b border-slate-100 flex items-center px-4 justify-between">
            <div class="flex items-center gap-2">
                <button onclick="window.app.closeModal()"><i data-lucide="chevron-left" class="w-6 h-6 text-slate-600"></i></button>
                <span class="font-bold text-slate-900 ml-2">${targetUser.name}</span>
            </div>
            <button><i data-lucide="more-horizontal" class="w-6 h-6 text-slate-400"></i></button>
        </div>
        <div class="flex-1 overflow-y-auto p-4" id="chatContainer">
            ${msgsHtml.length ? msgsHtml : '<p class="text-center text-slate-300 text-xs mt-4">开始聊天吧</p>'}
        </div>
        <div class="bg-white p-3 pb-safe border-t border-slate-100 flex gap-2">
            <input id="chatInput" type="text" class="flex-1 bg-slate-100 rounded-full px-4 py-2 outline-none" placeholder="发送消息...">
            <button onclick="window.app.sendChatMessage()" class="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white"><i data-lucide="send" class="w-5 h-5 ml-0.5"></i></button>
        </div>
    </div>
    `;
}

function EditProfileModal() {
    const u = state.user!;
    return `
    <div class="fixed inset-0 z-[70] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
        <div class="h-14 flex items-center justify-between px-4 border-b border-slate-100">
            <button onclick="window.app.closeModal()" class="text-slate-500">取消</button>
            <h2 class="font-bold text-slate-900">编辑资料</h2>
            <button onclick="window.app.submitProfileEdit()" class="text-emerald-600 font-bold">保存</button>
        </div>
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <div class="flex justify-center mb-6">
                <div class="relative">
                    ${Avatar(u.avatar, 'w-24 h-24')}
                    <div class="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center text-white text-xs font-bold">更换</div>
                </div>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1 uppercase">姓名</label>
                    <input id="editName" type="text" value="${u.name}" class="w-full border-b border-slate-200 py-2 text-slate-900 font-medium outline-none focus:border-emerald-500">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1 uppercase">职位头衔</label>
                    <input id="editTitle" type="text" value="${u.title}" class="w-full border-b border-slate-200 py-2 text-slate-900 outline-none focus:border-emerald-500">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1 uppercase">个人简介</label>
                    <textarea id="editBio" rows="3" class="w-full border-b border-slate-200 py-2 text-slate-900 outline-none focus:border-emerald-500 resize-none">${u.bio}</textarea>
                </div>
                
                <div class="pt-4 border-t border-slate-100 mt-6">
                    <h3 class="font-bold text-slate-900 mb-4">更多信息 (完善资料)</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase">手机号</label>
                            <input id="editPhone" type="tel" value="${u.phone || ''}" placeholder="未绑定" class="w-full bg-slate-50 rounded-lg px-4 py-3 outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase">常驻地点</label>
                            <select id="editLocation" class="w-full bg-slate-50 rounded-lg px-4 py-3 outline-none">
                                ${LOCATIONS.map(l => `<option value="${l}" ${u.location === l ? 'selected' : ''}>${l.split(' ')[0]}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase">背景图 URL</label>
                            <input id="editBg" type="text" value="${u.backgroundImage || ''}" placeholder="图片链接" class="w-full bg-slate-50 rounded-lg px-4 py-3 outline-none text-xs">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

// --- Render Loop ---

async function render() {
    if (!state.user) {
        app.innerHTML = LoginView();
    } else {
        let content = '';
        switch(state.activeTab) {
            case 'tab-home': content = HomeView(); break;
            case 'tab-jobs': content = JobsView(); break;
            case 'tab-messages': content = MessagesView(); break;
            case 'tab-profile': content = ProfileView(); break;
        }

        content += NavBar();

        if (state.modal === 'post-detail') content += PostDetailModal();
        if (state.modal === 'job-detail') content += JobDetailModal();
        if (state.modal === 'chat') content += ChatModal();
        if (state.modal === 'edit-profile') content += EditProfileModal();

        app.innerHTML = content;
        
        // Scroll Chat
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // Use Global Lucide
    try {
        if (window.lucide) {
             window.lucide.createIcons({ icons: window.lucide.icons });
        }
    } catch(e) { console.error("Icon render error", e); }
}

// --- Window Binding ---
window.app = {
    handleLogin: async (e: Event) => {
        e.preventDefault();
        const uVal = (document.getElementById('username') as HTMLInputElement).value;
        const pVal = (document.getElementById('password') as HTMLInputElement).value;
        try {
            const user = await db.login(uVal, pVal);
            state.setUser(user);
        } catch {
            // Demo auto register
            try {
                const user = await db.register(uVal, pVal, uVal);
                state.setUser(user);
            } catch(err: any) { alert(err.message); }
        }
    },
    setTab: (t: ViewState) => state.setTab(t),
    toggleLike: (id: string) => state.toggleLike(id),
    openPostDetail: (id: string) => state.openPostDetail(id),
    openJobDetail: (id: string) => state.openJobDetail(id),
    openChat: (id: string) => state.openChat(id),
    openEditProfile: () => state.openEditProfile(),
    closeModal: () => state.closeModal(),
    
    // Form Submissions
    submitComment: () => {
        const val = (document.getElementById('commentInput') as HTMLInputElement).value;
        if(val) state.submitComment(val);
    },
    sendChatMessage: () => {
        const val = (document.getElementById('chatInput') as HTMLInputElement).value;
        if(val) state.sendMessage(val);
    },
    submitProfileEdit: () => {
        state.saveProfile({
            name: (document.getElementById('editName') as HTMLInputElement).value,
            title: (document.getElementById('editTitle') as HTMLInputElement).value,
            bio: (document.getElementById('editBio') as HTMLTextAreaElement).value,
            phone: (document.getElementById('editPhone') as HTMLInputElement).value,
            location: (document.getElementById('editLocation') as HTMLSelectElement).value,
            backgroundImage: (document.getElementById('editBg') as HTMLInputElement).value,
        });
    }
};

// Fallback protection: If render fails or hangs, retry
setTimeout(() => {
    const app = document.getElementById('app');
    if (app && app.innerHTML === '') {
       console.warn("Forcing render due to timeout");
       render();
    }
}, 2000);

// Initial Render
try {
  render();
} catch(e: any) {
  app.innerHTML = `<div class="p-4 text-red-500">Startup Error: ${e.message}</div>`;
}