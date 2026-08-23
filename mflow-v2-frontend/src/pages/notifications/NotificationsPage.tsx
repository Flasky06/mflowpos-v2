import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import {
  Bell,
  CheckCircle2,
  Trash2,
  CheckCheck,
  ShieldAlert,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isAllowed = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'SHOP_ADMIN';

  const fetchNotifications = async () => {
    if (!isAllowed) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data?.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      addToast({ type: 'success', title: 'Marked as Read', message: 'Notification updated' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to update notification' });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })));
      addToast({ type: 'success', title: 'All Read', message: 'All notifications marked as read' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to mark notifications read' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      addToast({ type: 'info', title: 'Deleted', message: 'Notification removed' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to delete notification' });
    }
  };

  if (!isAllowed) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto mt-12 bg-white rounded-3xl border border-slate-200 shadow-md space-y-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          The System Notifications Desk is reserved for Business Owners and Shop Managers only.
        </p>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-end pb-4 border-b border-slate-200">
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" /> Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Notifications</h3>
          <p className="text-xs text-slate-500">You're all caught up! New announcements will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                !n.read
                  ? 'bg-indigo-50/40 border-indigo-200 shadow-sm'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  {!n.read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" title="Unread" />
                  )}
                  <h3 className={`text-sm font-bold ${!n.read ? 'text-indigo-950' : 'text-slate-900'}`}>
                    {n.title}
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 ml-auto sm:ml-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed pl-0 sm:pl-4">
                  {n.content}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                {!n.read && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-1.5 text-xs text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                    title="Mark as read"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Read</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-1.5 text-xs text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
