import React, { useState } from 'react';
import { ChevronLeft, MoreHorizontal, Share2, MessageCircle, ThumbsUp, Bookmark, Trash2, X } from 'lucide-react';
import { Post, User, Comment } from '../types';
import { db } from '../services/mockDb';

const Avatar: React.FC<{ url: string, size?: string, className?: string }> = ({ url, size = "w-10 h-10", className="" }) => (
  <img src={url} alt="Avatar" className={`${size} rounded-full object-cover border border-slate-200 ${className}`} />
);

interface PostDetailViewProps { 
  post: Post; 
  currentUser: User; 
  onBack: () => void; 
  onUserClick: (id: string) => void;
  isSaved: boolean;
  onToggleSave: () => void;
  onAddContact: (id: string) => void;
  isContact: boolean;
  friendStatus: 'none' | 'pending' | 'friend';
}

const PostDetailView: React.FC<PostDetailViewProps> = ({ post, currentUser, onBack, onUserClick, isSaved, onToggleSave, onAddContact, isContact, friendStatus }) => {
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<Comment[]>(post.commentsList || []);
  const [replyTo, setReplyTo] = useState<{id: string, name: string} | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

  const handleComment = async () => {
    if (!commentInput.trim()) return;
    
    // If reply, maybe prepend name or structure it. For MVP, we pass it to DB.
    const updatedPost = await db.addComment(post.id, currentUser.id, commentInput, replyTo?.id, replyTo?.name);
    setComments(updatedPost.commentsList || []);
    setCommentInput('');
    setReplyTo(null);
  };

  const handleDeletePost = async () => {
    if(window.confirm("确定要删除这条动态吗？")) {
       await db.deletePost(post.id, currentUser.id);
       onBack();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if(window.confirm("确定要删除这条评论吗？")) {
       const updatedPost = await db.deleteComment(post.id, commentId, currentUser.id);
       setComments(updatedPost.commentsList || []);
       setSelectedCommentId(null);
    }
  };

  const isMe = post.userId === currentUser.id;

  return (
    <div className="fixed inset-0 bg-white z-[80] flex flex-col animate-in slide-in-from-right duration-300">
       <div className="h-14 border-b border-slate-100 flex items-center justify-between px-4 bg-white sticky top-0 z-10">
          <button onClick={onBack}><ChevronLeft size={24} className="text-slate-600" /></button>
          <span className="font-bold text-slate-800">动态详情</span>
          <div className="relative">
             <button onClick={() => setShowMoreMenu(!showMoreMenu)}><MoreHorizontal size={24} className="text-slate-600" /></button>
             {showMoreMenu && (
               <div className="absolute right-0 top-full mt-2 bg-white shadow-xl border border-slate-100 rounded-xl overflow-hidden w-32 z-20">
                  {isMe && (
                    <button onClick={handleDeletePost} className="w-full text-left px-4 py-3 text-red-500 font-bold text-sm hover:bg-slate-50 flex items-center gap-2">
                      <Trash2 size={16} /> 删除
                    </button>
                  )}
                  <button className="w-full text-left px-4 py-3 text-slate-700 font-bold text-sm hover:bg-slate-50">举报</button>
               </div>
             )}
          </div>
       </div>

       <div className="flex-1 overflow-y-auto bg-slate-50" onClick={() => { setShowMoreMenu(false); setSelectedCommentId(null); }}>
          {/* Main Post Content */}
          <div className="bg-white p-4 mb-2">
             <div className="flex items-center gap-3 mb-4">
               <div onClick={() => post.user && onUserClick(post.user.id)}>
                 <Avatar url={post.user?.avatar || ''} size="w-10 h-10" />
               </div>
               <div className="flex-1">
                 <h4 className="font-bold text-slate-900">{post.user?.name}</h4>
                 <div className="flex items-center gap-2 text-xs text-slate-500">
                   <span>{new Date(post.timestamp).toLocaleString()}</span>
                   {post.category === 'job' && <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded">招聘</span>}
                 </div>
               </div>
               {/* Add Friend Button logic */}
               {!isMe && (
                 <>
                   {friendStatus === 'friend' && (
                     <button className="px-4 py-1.5 border border-slate-200 text-slate-400 rounded-full text-xs font-bold bg-slate-50">
                       已是好友
                     </button>
                   )}
                   {friendStatus === 'pending' && (
                     <button disabled className="px-4 py-1.5 bg-slate-100 text-slate-400 rounded-full text-xs font-bold">
                       申请已发送
                     </button>
                   )}
                   {friendStatus === 'none' && (
                     <button onClick={() => onAddContact(post.userId)} className="px-4 py-1.5 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-sm">
                       + 添加好友
                     </button>
                   )}
                 </>
               )}
             </div>

             <div className="text-slate-800 text-base mb-4 whitespace-pre-line leading-relaxed">
               {post.content}
             </div>

             {post.image && (
               <div className="mb-4 rounded-xl overflow-hidden">
                 <img src={post.image} className="w-full h-auto" />
               </div>
             )}

             <div className="flex justify-between items-center pt-4 border-t border-slate-50 text-slate-500">
                <div className="flex gap-6">
                   <button className="flex items-center gap-1"><Share2 size={20} /> 转发</button>
                   <button className="flex items-center gap-1"><MessageCircle size={20} /> {comments.length}</button>
                   <button className="flex items-center gap-1"><ThumbsUp size={20} /> {post.likes}</button>
                </div>
                <button onClick={onToggleSave} className={`${isSaved ? 'text-yellow-500' : ''}`}>
                   <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
                </button>
             </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white p-4 min-h-[50vh]">
             <h3 className="font-bold text-slate-800 mb-4">全部评论 ({comments.length})</h3>
             {comments.length === 0 ? (
               <div className="text-center py-8 text-slate-400 text-sm">暂无评论，快来抢沙发~</div>
             ) : (
               <div className="space-y-4">
                 {comments.map(c => (
                   <div key={c.id} className="flex gap-3 relative" onClick={(e) => { e.stopPropagation(); setSelectedCommentId(selectedCommentId === c.id ? null : c.id); }}>
                      <div onClick={() => c.user && onUserClick(c.user.id)} className="cursor-pointer">
                         <Avatar url={c.user?.avatar || ''} size="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between items-baseline">
                            <span 
                               className="text-sm font-bold text-slate-700 cursor-pointer hover:underline"
                               onClick={() => c.user && onUserClick(c.user.id)}
                            >
                                {c.user?.name}
                            </span>
                            <span className="text-xs text-slate-400">{new Date(c.timestamp).toLocaleDateString()}</span>
                         </div>
                         <p className="text-slate-800 text-sm mt-1">
                           {c.replyToName && <span className="text-emerald-600 mr-1">回复 @{c.replyToName}:</span>}
                           {c.content}
                         </p>
                      </div>

                      {/* Comment Menu Popover */}
                      {selectedCommentId === c.id && (
                        <div className="absolute top-8 right-0 bg-slate-800 text-white rounded-lg shadow-xl z-20 flex overflow-hidden animate-in fade-in zoom-in-95">
                           <button onClick={(e) => { e.stopPropagation(); setReplyTo({id: c.userId, name: c.user?.name || ''}); setSelectedCommentId(null); }} className="px-3 py-1.5 text-xs hover:bg-slate-700">回复</button>
                           {c.userId === currentUser.id && (
                             <button onClick={(e) => { e.stopPropagation(); handleDeleteComment(c.id); }} className="px-3 py-1.5 text-xs hover:bg-slate-700 text-red-300">删除</button>
                           )}
                        </div>
                      )}
                   </div>
                 ))}
               </div>
             )}
          </div>
       </div>

       {/* Comment Input */}
       <div className="bg-white border-t border-slate-100 p-3 pb-safe flex flex-col gap-2">
          {replyTo && (
            <div className="flex justify-between items-center bg-slate-50 px-3 py-1 rounded text-xs text-slate-500">
               <span>回复 @{replyTo.name}</span>
               <button onClick={() => setReplyTo(null)}><X size={14} /></button>
            </div>
          )}
          <div className="flex gap-3 items-center">
            <input 
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder={replyTo ? `回复 ${replyTo.name}...` : "写评论..."}
              className="flex-1 bg-slate-100 rounded-full px-4 py-2 outline-none text-sm"
            />
            <button onClick={handleComment} className="text-emerald-600 font-bold text-sm px-2">发送</button>
          </div>
       </div>
    </div>
  );
};

export default PostDetailView;