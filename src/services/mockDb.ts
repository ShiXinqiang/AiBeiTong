import { supabase } from './supabaseClient';
import { User, Post, Message, PostCategory, News, Comment, FavoriteItem, Job, FriendRequest } from '../types';
import { MOCK_JOBS } from '../constants';

// --- 配置常量 ---
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=";
const DEFAULT_BG = "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80";
const EMAIL_SUFFIX = "@myanmar.app"; // 用于将用户名转换为邮箱

// 模拟新闻数据（新闻暂时还走 Mock，因为通常是由后台管理员发布的）
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

class RealDB {
  
  // --- 辅助方法 ---
  
  // 将简单的用户名转换为邮箱，适配 Supabase Auth
  private toEmail(username: string): string {
    if (username.includes('@')) return username;
    return `${username}${EMAIL_SUFFIX}`;
  }

  // 将 Supabase 的 profile 格式转换为 App 的 User 格式
  private mapProfileToUser(profile: any): User {
    if (!profile) throw new Error("User profile not found");
    return {
      id: profile.id,
      username: profile.username || profile.email?.split('@')[0] || 'Unknown',
      name: profile.name || '用户',
      avatar: profile.avatar || `${DEFAULT_AVATAR}${profile.username}`,
      title: profile.title || '',
      bio: profile.bio || '',
      location: profile.location || '缅甸',
      phone: profile.phone,
      backgroundImage: profile.background_image || DEFAULT_BG,
      joinedAt: new Date(profile.created_at).getTime(),
      role: profile.role || 'user',
      // 以下字段在 Supabase 中通常存在关联表中，简化处理先给空数组，后续通过接口获取
      contacts: [],
      favorites: [],
      likedPosts: [], 
      pinnedChats: [],
      privacySettings: { allowStrangerView10: true, requireFriendVerify: true, visibleToSearch: true }
    };
  }

  // --- Auth & User Management ---

  async login(username: string, password: string): Promise<User> {
    const email = this.toEmail(username);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("登录失败");

    // 获取用户详细资料
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
        // 如果登录成功但没有 profile（极少情况），尝试创建一个
        console.warn("Profile missing, creating default...", profileError);
        const newProfile = {
            id: authData.user.id,
            username: username,
            name: username,
            avatar: `${DEFAULT_AVATAR}${username}`
        };
        await supabase.from('profiles').insert(newProfile);
        return this.mapProfileToUser(newProfile);
    }

    return this.mapProfileToUser(profile);
  }

  async register(username: string, password: string, name: string): Promise<User> {
    const email = this.toEmail(username);
    
    // 1. 注册 Auth 用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name }
      }
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("注册失败，请重试");

    // 2. 创建 Profile
    const newProfile = {
      id: authData.user.id,
      username: username,
      name: name,
      avatar: `${DEFAULT_AVATAR}${name}`,
      bio: '这个人很懒，什么都没写',
      location: '仰光 (Yangon)',
      role: 'user',
      created_at: new Date().toISOString()
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(newProfile);

    if (profileError) {
        // 如果 profile 创建失败（例如用户名重复），需要提示
        console.error("Profile creation error", profileError);
        // 这里不回滚 Auth，允许用户下次登录时补全 Profile
    }

    return this.mapProfileToUser(newProfile);
  }

  async getAllUsersPublic(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(50); // 限制数量防止数据过大
      
    if (error) {
        console.error("Get users error", error);
        return [];
    }
    return data.map(this.mapProfileToUser);
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    // 映射前端字段到数据库字段
    const updates: any = {};
    if (data.name) updates.name = data.name;
    if (data.title) updates.title = data.title;
    if (data.bio) updates.bio = data.bio;
    if (data.location) updates.location = data.location;
    if (data.phone) updates.phone = data.phone;
    if (data.backgroundImage) updates.background_image = data.backgroundImage;
    // Privacy settings 暂时略过，因为数据库需要 JSON 字段支持

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapProfileToUser(updatedProfile);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
    if (error || !data) return undefined;
    return this.mapProfileToUser(data);
  }

  // --- Posts & Comments ---

  async getAllPosts(): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (*)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
        console.error("Get posts error", error);
        return [];
    }

    // 并行获取每条帖子的评论（这里简化处理，实际应该用 Count 或者在详情页加载）
    // 为了兼容现有 UI，我们做一个简单转换
    return data.map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      content: p.content,
      image: p.image_url,
      category: p.category || 'text',
      likes: p.likes_count || 0,
      comments: p.comments_count || 0,
      timestamp: new Date(p.created_at).getTime(),
      user: p.profiles ? this.mapProfileToUser(p.profiles) : undefined,
      commentsList: [] // 列表页暂时不加载评论详情
    }));
  }

  async createPost(userId: string, content: string, category: PostCategory, image?: string): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content,
        category,
        image_url: image
      })
      .select('*, profiles:user_id (*)')
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      userId: data.user_id,
      content: data.content,
      image: data.image_url,
      category: data.category,
      likes: 0,
      comments: 0,
      timestamp: new Date(data.created_at).getTime(),
      user: data.profiles ? this.mapProfileToUser(data.profiles) : undefined,
      commentsList: []
    };
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId); // 确保只能删自己的
      
    if (error) throw new Error("删除失败");
  }

  async addComment(postId: string, userId: string, content: string, replyToId?: string, replyToName?: string): Promise<Post> {
    // 1. 插入评论
    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content
      });
    
    if (error) throw new Error(error.message);

    // 2. 更新帖子评论数 (RPC call 或者简单 update)
    // 这里简单起见，我们重新拉取整个帖子数据
    // 实际生产中应该用 Database Function 自动增加计数
    const posts = await this.getAllPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) throw new Error("Post not found");
    
    // 手动 +1 避免再次请求
    post.comments++;
    
    // 获取最新评论列表
    const { data: commentsData } = await supabase
        .from('comments')
        .select('*, profiles:user_id(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
        
    post.commentsList = commentsData?.map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        content: c.content,
        timestamp: new Date(c.created_at).getTime(),
        user: c.profiles ? this.mapProfileToUser(c.profiles) : undefined
    }));

    return post;
  }
  
  async deleteComment(postId: string, commentId: string, userId: string): Promise<Post> {
      await supabase.from('comments').delete().eq('id', commentId).eq('user_id', userId);
      // 重新获取 Post
      const posts = await this.getAllPosts();
      return posts.find(p => p.id === postId)!;
  }

  async toggleLike(userId: string, postId: string): Promise<User> {
    // 检查是否点赞过
    const { data } = await supabase
        .from('post_likes')
        .select('*')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .single();
        
    if (data) {
        // 取消点赞
        await supabase.from('post_likes').delete().eq('user_id', userId).eq('post_id', postId);
        // 减少计数
        // await supabase.rpc('decrement_likes', { row_id: postId });
    } else {
        // 点赞
        await supabase.from('post_likes').insert({ user_id: userId, post_id: postId });
        // 增加计数
        // await supabase.rpc('increment_likes', { row_id: postId });
    }
    
    // 返回用户对象（这里其实不需要返回最新的 User，前端逻辑可能需要调整，但为了兼容 mockDb 接口）
    const user = await this.getUserById(userId);
    return user!;
  }

  // --- Messages (Chat) ---

  async getMessagesBetween(u1: string, u2: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(from_id.eq.${u1},to_id.eq.${u2}),and(from_id.eq.${u2},to_id.eq.${u1})`)
      .order('created_at', { ascending: true });

    if (error) return [];

    return data.map((m: any) => ({
      id: m.id,
      fromId: m.from_id,
      toId: m.to_id,
      content: m.content,
      timestamp: new Date(m.created_at).getTime(),
      isRead: m.is_read || false,
      type: m.type || 'text'
    }));
  }

  async sendMessage(fromId: string, toId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        from_id: fromId,
        to_id: toId,
        content
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      fromId: data.from_id,
      toId: data.to_id,
      content: data.content,
      timestamp: new Date(data.created_at).getTime(),
      isRead: false,
      type: 'text'
    };
  }
  
  async deleteMessage(msgId: string): Promise<void> {
      await supabase.from('messages').delete().eq('id', msgId);
  }
  
  async recallMessage(msgId: string): Promise<void> {
      await supabase.from('messages').update({ type: 'recalled', content: '' }).eq('id', msgId);
  }

  // --- Friend System (Simplified) ---
  // 由于 Supabase Schema 中暂时没有专门的好友表，我们简化处理：
  // 所有人都可以聊天，"好友列表" 暂时显示最近联系人或全部用户
  
  async checkFriendStatus(userId1: string, userId2: string): Promise<'none' | 'pending' | 'friend'> {
    // 暂时默认未添加，允许添加
    return 'none'; 
  }
  
  async sendFriendRequest(fromId: string, toId: string): Promise<void> {
      // 模拟成功
      return Promise.resolve();
  }

  // --- Misc ---

  getNews(): News[] { return MOCK_NEWS; }
  
  // 搜索用户
  async searchUsers(query: string): Promise<User[]> {
      const { data } = await supabase.from('profiles').select('*').ilike('name', `%${query}%`);
      return (data || []).map(this.mapProfileToUser);
  }
  
  async getFavorites(userId: string): Promise<{posts: Post[], jobs: Job[]}> {
      return { posts: [], jobs: [] }; // 暂未实现
  }
}

export const db = new RealDB();