
import React from 'react';
import { Note, User } from '@/lib/types';
import { useChatStore } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash2, MessageSquare } from 'lucide-react';

interface NoteItemProps {
  note: Note;
  onClick?: () => void;
  showDelete?: boolean;
  onDelete?: () => void;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onClick, showDelete = false, onDelete }) => {
  const { onlineUsers, currentUser } = useChatStore();
  
  const creator = onlineUsers.find(user => user.id === note.creatorId);
  const isOwnNote = note.creatorId === currentUser?.id;
  
  // Calculate time remaining until expiration
  const timeRemaining = note.expiresAt ? 
    formatDistanceToNow(new Date(note.expiresAt), { addSuffix: false }) : 
    '24 hours';
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };
  
  return (
    <div 
      className="flex flex-col min-w-[120px] max-w-[180px] bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow relative"
      onClick={onClick}
    >
      <div className="relative p-3 border-b border-gray-200">
        <MessageSquare className="absolute -top-4 right-2 text-gray-200 h-8 w-8 transform rotate-12" />
        <div className="text-sm font-medium line-clamp-2">{note.content}</div>
      </div>
      <div className="p-2 flex items-center space-x-1">
        <Avatar className="h-6 w-6">
          {creator?.photoURL ? (
            <img src={creator.photoURL} alt={creator.name} className="h-full w-full object-cover" />
          ) : (
            <AvatarFallback className="bg-gray-200 text-xs">
              {creator?.name[0] || '?'}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="text-xs text-gray-500 truncate">
          {creator?.name || 'User'}
        </div>
      </div>
      <div className="px-2 pb-2 text-xs text-gray-400 flex justify-between items-center">
        <span>
          {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
        </span>
        <span className="text-[10px]">
          Expires: {timeRemaining}
        </span>
      </div>
      
      {showDelete && isOwnNote && (
        <button 
          className="absolute top-1 right-1 p-1 bg-white rounded-full opacity-70 hover:opacity-100 transition-opacity"
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
        </button>
      )}
    </div>
  );
};

export default NoteItem;
