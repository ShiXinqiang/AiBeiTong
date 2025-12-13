import { User, Post, Message, PostCategory, News, Comment, FavoriteItem, Job, FriendRequest } from '../types';
import { MOCK_JOBS } from '../constants';

// --- PRODUCTION CONFIGURATION ---
// Initial Mock Data is EMPTY for deployment
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=";
const DEFAULT_BG = "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80";

const MOCK_USERS: User[] = []; // Starts empty
const MOCK_POSTS: Post[] = []; // Starts empty
const MOCK_NEWS: News[] = [
  {
    id: 'n1',
    title: '爱贝通(AiBeiTong) 正式上线公告',
    source: '官方团队',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=200&q=80',
    timestamp: Date.now(),
    category: '公告'
  }
];

// Helper to simulate DB delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockDB {
  private getSafe(key: string, defaultVal: any): any {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultVal;
      return JSON.parse(stored);
    } catch (e) {
      console.warn(`Failed to parse ${key}, resetting data.`);
      localStorage.removeItem(key);
      return defaultVal;
    }
  }

  // --- Backend Simulation Helpers ---
  private getUsers(): User[] { return this.getSafe('db_users', MOCK_USERS); }
  private saveUsers(users: User[]) { localStorage.setItem('db_users', JSON.stringify(users)); }
  private getPosts(): Post[] { return this.getSafe('db_posts', MOCK_POSTS); }
  private savePosts(posts: Post[]) { localStorage.setItem('db_posts', JSON.stringify(posts)); }
  private getMessages(): Message[] { return this.getSafe('db_messages', []); }
  private saveMessages(msgs: Message[]) { localStorage.setItem('db_messages', JSON.stringify(msgs)); }
  private getFriendRequestsDB(): FriendRequest[] { return this.getSafe('db_friend_requests', []); }
  private saveFriendRequestsDB(reqs: FriendRequest[]) { localStorage.setItem('db_friend_requests', JSON.stringify(reqs)); }

  // --- Auth & User Management ---

  async login(username: string, password: string): Promise<User> {
    await delay(500);
    const users = this.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) throw new Error("账号或密码错误");
    return user;
  }

  async register(username: string, password: string, name: string): Promise<User> {
    await delay(500);
    const users = this.getUsers();
    if (users.find(u => u.username === username)) {
      throw new Error("账号已被注册");
    }
    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      password,
      name,
      avatar: `${DEFAULT_AVATAR}${name}`,
      backgroundImage: DEFAULT_BG,
      title: '新用户',
      bio: '这个人很懒，什么都没写',
      location: '缅甸',
      joinedAt: Date.now(),
      contacts: [],
      favorites: [],
      likedPosts: [],
      pinnedChats: [],
      lastUsernameChange: 0,
      blockedUsers: [],
      privacySettings: {
        allowStrangerView10: true,
        requireFriendVerify: true,
        visibleToSearch: true
      }
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    await delay(300);
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error("用户不存在");
    
    // Username Change Limit Logic (30 Days)
    if (data.username && data.username !== users[idx].username) {
       const now = Date.now();
       const lastChange = users[idx].lastUsernameChange || 0;
       const daysPassed = (now - lastChange) / (1000 * 60 * 60 * 24);
       if (daysPassed < 30) {
         throw new Error(`账号修改过于频繁，请${Math.ceil(30 - daysPassed)}天后再试`);
       }
       data.lastUsernameChange = now;
    }

    // Merge deep objects like privacySettings
    if (data.privacySettings) {
        users[idx].privacySettings = { ...users[idx].privacySettings, ...data.privacySettings };
        delete data.privacySettings; // Remove to avoid double merge issue
    }

    users[idx] = { ...users[idx], ...data };
    this.saveUsers(users);
    this.updateSession(users[idx]);
    return users[idx];
  }

  // --- Friend System ---

  async sendFriendRequest(fromId: string, toId: string): Promise<void> {
    const users = this.getUsers();
    const target = users.find(u => u.id === toId);
    if (!target) throw new Error("用户不存在");
    if (target.contacts.includes(fromId)) throw new Error("已经是好友了");

    const requests = this.getFriendRequestsDB();
    const existing = requests.find(r => r.fromId === fromId && r.toId === toId && r.status === 'pending');
    if (existing) throw new Error("已发送申请，请等待通过");

    requests.push({
      id: `req_${Date.now()}`,
      fromId,
      toId,
      status: 'pending',
      timestamp: Date.now()
    });
    this.saveFriendRequestsDB(requests);
  }

  async getPendingRequests(userId: string): Promise<FriendRequest[]> {
    const requests = this.getFriendRequestsDB();
    const users = this.getUsers();
    return requests
      .filter(r => r.toId === userId && r.status === 'pending')
      .map(r => ({
        ...r,
        fromUser: users.find(u => u.id === r.fromId)
      }));
  }

  async acceptFriendRequest(requestId: string): Promise<User> {
    const requests = this.getFriendRequestsDB();
    const reqIdx = requests.findIndex(r => r.id === requestId);
    if (reqIdx === -1) throw new Error("申请不存在");

    const req = requests[reqIdx];
    req.status = 'accepted';
    this.saveFriendRequestsDB(requests);

    // Add contacts mutually
    const users = this.getUsers();
    const user1Idx = users.findIndex(u => u.id === req.fromId);
    const user2Idx = users.findIndex(u => u.id === req.toId);

    if (user1Idx > -1 && !users[user1Idx].contacts.includes(req.toId)) {
      users[user1Idx].contacts.push(req.toId);
    }
    if (user2Idx > -1 && !users[user2Idx].contacts.includes(req.fromId)) {
      users[user2Idx].contacts.push(req.fromId);
    }
    this.saveUsers(users);
    
    // If we are user2, update session
    const currentUser = this.getSessionUser();
    if (currentUser?.id === req.toId) this.updateSession(users[user2Idx]);

    return users[user2Idx];
  }

  async removeContact(userId: string, contactId: string): Promise<User> {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    
    if (users[idx].contacts) {
      users[idx].contacts = users[idx].contacts.filter(id => id !== contactId);
    }

    const cIdx = users.findIndex(u => u.id === contactId);
    if (cIdx > -1 && users[cIdx].contacts) {
       users[cIdx].contacts = users[cIdx].contacts.filter(id => id !== userId);
    }

    this.saveUsers(users);
    this.updateSession(users[idx]);
    return users[idx];
  }

  async checkFriendStatus(userId1: string, userId2: string): Promise<'none' | 'pending' | 'friend'> {
    const users = this.getUsers();
    const user1 = users.find(u => u.id === userId1);
    if (user1?.contacts.includes(userId2)) return 'friend';

    const requests = this.getFriendRequestsDB();
    const pending = requests.find(r => 
      (r.fromId === userId1 && r.toId === userId2 && r.status === 'pending') ||
      (r.fromId === userId2 && r.toId === userId1 && r.status === 'pending')
    );
    if (pending) return 'pending';
    return 'none';
  }

  // --- Interactions (Like, Favorite, Pin) ---

  async togglePin(userId: string, targetId: string): Promise<User> {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (!users[idx].pinnedChats) users[idx].pinnedChats = [];
    
    if (users[idx].pinnedChats!.includes(targetId)) {
      users[idx].pinnedChats = users[idx].pinnedChats!.filter(id => id !== targetId);
    } else {
      users[idx].pinnedChats!.unshift(targetId);
    }
    this.saveUsers(users);
    this.updateSession(users[idx]);
    return users[idx];
  }

  async toggleFavorite(userId: string, itemId: string, itemType: 'post' | 'job'): Promise<User> {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (!users[idx].favorites) users[idx].favorites = [];

    const existingIndex = users[idx].favorites!.findIndex(f => f.id === itemId);
    if (existingIndex > -1) {
      users[idx].favorites!.splice(existingIndex, 1); // Remove (Unfavorite)
    } else {
      users[idx].favorites!.push({ id: itemId, type: itemType, timestamp: Date.now() }); // Add
    }

    this.saveUsers(users);
    this.updateSession(users[idx]);
    return users[idx];
  }

  async toggleLike(userId: string, postId: string): Promise<User> {
    const users = this.getUsers();
    const userIdx = users.findIndex(u => u.id === userId);
    const posts = this.getPosts();
    const postIdx = posts.findIndex(p => p.id === postId);

    if (postIdx === -1) return users[userIdx];

    if (!users[userIdx].likedPosts) users[userIdx].likedPosts = [];
    const hasLiked = users[userIdx].likedPosts!.includes(postId);
    
    if (hasLiked) {
      users[userIdx].likedPosts = users[userIdx].likedPosts!.filter(id => id !== postId);
      posts[postIdx].likes = Math.max(0, posts[postIdx].likes - 1);
    } else {
      users[userIdx].likedPosts!.push(postId);
      posts[postIdx].likes++;
    }

    this.saveUsers(users);
    this.savePosts(posts);
    this.updateSession(users[userIdx]);
    return users[userIdx];
  }

  // --- Posts & Comments ---

  async getAllPosts(): Promise<Post[]> {
    await delay(300);
    const posts = this.getPosts();
    const users = this.getUsers();
    return posts.map(p => ({
      ...p,
      user: users.find(u => u.id === p.userId)
    })).sort((a, b) => b.timestamp - a.timestamp);
  }

  async getPostById(postId: string): Promise<Post | undefined> {
    await delay(200);
    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return undefined;
    return this.hydratePost(post);
  }

  async createPost(userId: string, content: string, category: PostCategory, image?: string): Promise<Post> {
    await delay(400);
    const posts = this.getPosts();
    const newPost: Post = {
      id: `post_${Date.now()}`,
      userId,
      content,
      image,
      category,
      likes: 0,
      comments: 0,
      timestamp: Date.now(),
      commentsList: []
    };
    posts.unshift(newPost);
    this.savePosts(posts);
    const user = await this.getUserById(userId);
    return { ...newPost, user };
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    await delay(200);
    const posts = this.getPosts();
    const idx = posts.findIndex(p => p.id === postId);
    if (idx === -1) return;
    if (posts[idx].userId !== userId) throw new Error("无权删除");
    
    posts.splice(idx, 1);
    this.savePosts(posts);
  }

  async addComment(postId: string, userId: string, content: string, replyToId?: string, replyToName?: string): Promise<Post> {
    await delay(200);
    const posts = this.getPosts();
    const idx = posts.findIndex(p => p.id === postId);
    if (idx === -1) throw new Error("帖子不存在");

    const newComment: Comment = {
      id: `c_${Date.now()}`,
      userId,
      content,
      timestamp: Date.now(),
      replyToId,
      replyToName
    };

    if (!posts[idx].commentsList) posts[idx].commentsList = [];
    posts[idx].commentsList!.push(newComment);
    posts[idx].comments++;
    this.savePosts(posts);
    
    return this.hydratePost(posts[idx]);
  }

  async deleteComment(postId: string, commentId: string, userId: string): Promise<Post> {
    await delay(200);
    const posts = this.getPosts();
    const pIdx = posts.findIndex(p => p.id === postId);
    if (pIdx === -1) throw new Error("帖子不存在");

    const cIdx = posts[pIdx].commentsList?.findIndex(c => c.id === commentId && c.userId === userId);
    if (cIdx === undefined || cIdx === -1) throw new Error("无法删除评论");

    posts[pIdx].commentsList!.splice(cIdx, 1);
    posts[pIdx].comments = Math.max(0, posts[pIdx].comments - 1);
    this.savePosts(posts);

    return this.hydratePost(posts[pIdx]);
  }

  // --- Messages ---

  async getConversations(currentUserId: string): Promise<User[]> {
    const msgs = this.getMessages();
    const users = this.getUsers();
    const relatedIds = new Set<string>();
    msgs.forEach(m => {
      if (m.fromId === currentUserId) relatedIds.add(m.toId);
      if (m.toId === currentUserId) relatedIds.add(m.fromId);
    });
    return Array.from(relatedIds)
      .map(id => users.find(u => u.id === id))
      .filter((u): u is User => !!u);
  }

  async getMessagesBetween(u1: string, u2: string): Promise<Message[]> {
    return this.getMessages()
      .filter(m => (m.fromId === u1 && m.toId === u2) || (m.fromId === u2 && m.toId === u1))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  async sendMessage(fromId: string, toId: string, content: string): Promise<Message> {
    const msgs = this.getMessages();
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      fromId,
      toId,
      content,
      timestamp: Date.now(),
      isRead: false,
      type: 'text'
    };
    msgs.push(newMsg);
    this.saveMessages(msgs);
    return newMsg;
  }

  async deleteMessage(msgId: string): Promise<void> {
    const msgs = this.getMessages().filter(m => m.id !== msgId);
    this.saveMessages(msgs);
  }

  async recallMessage(msgId: string): Promise<void> {
    const msgs = this.getMessages();
    const idx = msgs.findIndex(m => m.id === msgId);
    if (idx > -1) {
      msgs[idx].type = 'recalled';
      msgs[idx].content = '';
      this.saveMessages(msgs);
    }
  }

  // --- Helpers ---
  async getUserById(id: string): Promise<User | undefined> {
    return this.getUsers().find(u => u.id === id);
  }
  
  async searchUsers(query: string): Promise<User[]> {
    if (!query) return [];
    return this.getUsers().filter(u => u.name.toLowerCase().includes(query.toLowerCase()));
  }

  async getUserPosts(userId: string): Promise<Post[]> {
     const posts = await this.getAllPosts();
     return posts.filter(p => p.userId === userId);
  }

  async getFavorites(userId: string): Promise<{posts: Post[], jobs: Job[]}> {
     const user = await this.getUserById(userId);
     if (!user || !user.favorites) return { posts: [], jobs: [] };
     const allPosts = await this.getAllPosts();
     return {
        posts: user.favorites.filter(f => f.type === 'post').map(f => allPosts.find(p => p.id === f.id)).filter((p): p is Post => !!p),
        jobs: user.favorites.filter(f => f.type === 'job').map(f => MOCK_JOBS.find(j => j.id === f.id)).filter((j): j is Job => !!j)
     };
  }

  getNews(): News[] { return MOCK_NEWS; }

  private updateSession(user: User) {
    const currentStr = localStorage.getItem('current_user');
    if (currentStr) {
       const current = JSON.parse(currentStr);
       if (current.id === user.id) localStorage.setItem('current_user', JSON.stringify(user));
    }
  }

  private getSessionUser(): User | null {
    const s = localStorage.getItem('current_user');
    return s ? JSON.parse(s) : null;
  }

  private hydratePost(post: Post): Post {
     const users = this.getUsers();
     return {
       ...post,
       user: users.find(u => u.id === post.userId),
       commentsList: (post.commentsList || []).map(c => ({
         ...c,
         user: users.find(u => u.id === c.userId)
       }))
     };
  }
}

export const db = new MockDB();