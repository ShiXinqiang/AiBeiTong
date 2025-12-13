export enum JobType {
  FULL_TIME = '全职',
  PART_TIME = '兼职',
  CONTRACT = '合同工',
  FREELANCE = '自由职业',
}

export interface FavoriteItem {
  id: string;
  type: 'post' | 'job';
  timestamp: number;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
  fromUser?: User; // Hydrated
}

export interface PrivacySettings {
  allowStrangerView10: boolean; // 允许陌生人查看10条动态
  requireFriendVerify: boolean; // 加好友需要验证
  visibleToSearch: boolean; // 允许被搜索到
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  avatar: string;
  title: string;
  bio: string;
  location: string;
  phone?: string; // Add phone number
  backgroundImage?: string;
  joinedAt: number;
  contacts: string[]; // List of user IDs added as friends
  favorites?: FavoriteItem[]; // List of favorite items
  likedPosts?: string[]; // List of post IDs liked by user
  pinnedChats?: string[]; // List of user IDs that are pinned in chat
  lastUsernameChange?: number; // Timestamp of last username change
  blockedUsers?: string[]; // List of blocked user IDs
  privacySettings?: PrivacySettings; // Privacy settings
}

export type PostCategory = 'text' | 'image' | 'video' | 'job' | 'all';

export interface Comment {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
  replyToId?: string; // ID of the comment being replied to
  replyToName?: string; // Name of the user being replied to
  user?: User;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  image?: string;
  video?: string;
  category: PostCategory;
  likes: number;
  comments: number;
  timestamp: number;
  user?: User;
  commentsList?: Comment[]; // For detail view
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  type?: 'text' | 'recalled'; // Message type
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  type: JobType;
  description: string;
  requirements: string[];
  tags: string[];
  postedAt: Date;
  contactEmail?: string;
  contactPhone?: string;
}

export interface News {
  id: string;
  title: string;
  source: string;
  image: string;
  timestamp: number;
  category: string;
}

export interface FilterState {
  keyword: string;
  location: string;
  type: string;
}

export const LOCATIONS = [
  "仰光 (Yangon)",
  "曼德勒 (Mandalay)",
  "内比都 (Naypyidaw)",
  "东枝 (Taunggyi)",
  "勃生 (Pathein)",
  "毛淡棉 (Mawlamyine)",
  "腊戌 (Lashio)",
];

export const CATEGORIES = [
  "翻译 (Translation)",
  "销售/市场 (Sales/Marketing)",
  "工厂/制造 (Factory/Manufacturing)",
  "IT/技术 (IT/Tech)",
  "行政/人事 (Admin/HR)",
  "财务/会计 (Finance)",
  "餐饮/服务 (Service)",
];