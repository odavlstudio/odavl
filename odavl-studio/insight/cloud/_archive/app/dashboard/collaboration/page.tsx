/**
 * Collaboration Page
 * Comprehensive view of team collaboration features
 */

'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { usePresence } from '@/hooks/usePresence';
import { ActivityFeed } from '@/components/ActivityFeed';
import { Users, MessageCircle, Activity as ActivityIcon, Eye } from 'lucide-react';

export default function CollaborationPage() {
  const [token, setToken] = useState<string>('');
  const [projectId] = useState('demo-project-123'); // Would come from context
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);

  // Get token
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // WebSocket connection
  const { socket, state } = useSocket({
    token,
    autoConnect: !!token,
  });

  // User presence
  const { users, onlineCount, updatePresence } = usePresence({
    socket,
    projectId,
    autoJoin: true,
  });

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      if (!token || !projectId) return;
      
      try {
        const res = await fetch(
          `/api/comments?projectId=${projectId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments);
        }
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      } finally {
        setLoadingComments(false);
      }
    }

    fetchComments();
  }, [token, projectId]);

  // Listen for new comments
  useEffect(() => {
    if (!socket) return;

    const handleCommentCreated = (data: any) => {
      if (data.projectId === projectId) {
        setComments(prev => [{
          id: data.commentId,
          userId: data.userId,
          userName: data.userName,
          content: data.content,
          file: data.file,
          line: data.line,
          resolved: false,
          createdAt: data.timestamp,
        }, ...prev]);
      }
    };

    socket.on('comment:created', handleCommentCreated);

    return () => {
      socket.off('comment:created', handleCommentCreated);
    };
  }, [socket, projectId]);

  // Create comment
  async function handleCreateComment() {
    if (!newComment.trim() || !token) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          content: newComment,
        }),
      });

      if (res.ok) {
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  }

  const onlineUsers = Array.from(users.values()).filter(u => u.status === 'online');
  const unresolvedComments = comments.filter(c => !c.resolved);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Collaboration</h1>
          <p className="text-gray-600 mt-1">
            Real-time collaboration with your team
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${state.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="font-medium text-gray-900">
                  {state.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="h-4 w-px bg-gray-300" />
              
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span>{onlineCount} online</span>
              </div>
              
              <div className="h-4 w-px bg-gray-300" />
              
              <div className="flex items-center gap-2 text-gray-600">
                <MessageCircle className="w-4 h-4" />
                <span>{unresolvedComments.length} open discussions</span>
              </div>
            </div>

            <button
              onClick={() => updatePresence(state.connected ? 'away' : 'online')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Toggle Status
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Online Users */}
          <div className="lg:col-span-1 space-y-6">
            {/* Online Users */}
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Online Now</h2>
              </div>

              <div className="space-y-2">
                {onlineUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No one else online
                  </p>
                ) : (
                  onlineUsers.map((user) => (
                    <div key={user.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-medium">
                        {user.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {user.userName}
                        </p>
                        {user.currentPage && (
                          <p className="text-xs text-gray-500 truncate">
                            {user.currentPage}
                          </p>
                        )}
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Comments</span>
                  <span className="font-semibold">{comments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Unresolved</span>
                  <span className="font-semibold text-orange-600">{unresolvedComments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Team Members</span>
                  <span className="font-semibold">{users.size}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Comments */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Discussion</h2>
              </div>

              {/* New Comment Input */}
              <div className="mb-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment... (use @username to mention)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
                <button
                  onClick={handleCreateComment}
                  disabled={!newComment.trim()}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Post Comment
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {loadingComments ? (
                  <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No comments yet. Start the discussion!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-3 rounded-lg border ${
                        comment.resolved
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-white border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-medium text-sm text-gray-900">
                          {comment.userName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                      {comment.file && (
                        <p className="text-xs text-gray-500 mt-1">
                          📁 {comment.file}
                          {comment.line && ` (line ${comment.line})`}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Activity Feed */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <ActivityIcon className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Activity Feed</h2>
              </div>

              {token && (
                <ActivityFeed
                  projectId={projectId}
                  token={token}
                  limit={20}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
