// odavl-studio/insight/cloud/components/dashboard-v2/CollaborationPanel.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePresence } from '@/hooks/usePresence';
import { useCursors } from '@/hooks/useCursors';
import { useComments } from '@/hooks/useComments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Bell } from 'lucide-react';

interface CollaborationPanelProps {
  dashboardId: string;
  userId: string;
}

export function CollaborationPanel({ dashboardId, userId }: CollaborationPanelProps) {
  const { users, updatePresence } = usePresence(dashboardId, userId);
  const { cursors } = useCursors(dashboardId, userId);
  const { comments, addComment, unreadCount } = useComments(dashboardId, userId);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed right-4 top-20 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 space-y-4"
    >
      {/* Active Users */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            Active Users ({users.length})
          </h3>
        </div>

        <div className="flex -space-x-2">
          <AnimatePresence>
            {users.map((user) => (
              <motion.div
                key={user.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Avatar className="border-2 border-white dark:border-gray-800">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                  <motion.div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.8, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                </Avatar>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comments
          </h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          <AnimatePresence>
            {comments.slice(0, 3).map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <p className="font-semibold">{comment.user}</p>
                <p className="text-gray-600 dark:text-gray-300">{comment.text}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <Button size="sm" variant="outline" className="w-full">
          <MessageSquare className="w-3 h-3 mr-2" />
          Add Comment
        </Button>
      </div>

      {/* Notifications */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </h3>
        </div>
        <Button size="sm" variant="ghost" className="w-full justify-start">
          View all notifications
        </Button>
      </div>

      {/* Live Cursors (rendered separately) */}
      <AnimatePresence>
        {cursors.map((cursor) => (
          <motion.div
            key={cursor.userId}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: cursor.x,
              y: cursor.y
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="pointer-events-none fixed z-50"
            style={{ left: 0, top: 0 }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={cursor.color}
              className="drop-shadow-lg"
            >
              <path d="M5.65 2.55L19.09 15.99L12.28 17.04L9.23 22.75L7.09 21.61L9.68 16.36L5.65 12.33V2.55Z" />
            </svg>
            <motion.div
              className="ml-6 -mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {cursor.userName}
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}