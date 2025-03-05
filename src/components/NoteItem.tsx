
import React from 'react';
import { Note, User } from '@/lib/types';
import { useChatStore } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash2 } from 'lucide-react';

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
      className="flex flex-col items-center cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 -translate-y-2 bg-white px-3 py-2 rounded-3xl shadow-sm border border-gray-200 text-xs max-w-[130px] truncate after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:w-3 after:h-3 after:rotate-45 after:bg-white after:border-r after:border-b after:border-gray-200 after:translate-y-1.5 after:-translate-x-1/2">
          {note.content.length > 30 
            ? `${note.content.substring(0, 30)}...` 
            : note.content}
        </div>
        <Avatar className="w-14 h-14 border border-gray-200">
          {creator?.photoURL ? (
            <img src={creator.photoURL} alt={creator.name} className="h-full w-full object-cover" />
          ) : (
            <AvatarFallback className="bg-gray-200 text-lg">
              {creator?.name[0] || '?'}
            </AvatarFallback>
          )}
        </Avatar>
        {creator?.isOnline && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
        )}
        
        {showDelete && isOwnNote && (
          <button 
            className="absolute -top-1 -right-1 p-1 bg-white rounded-full shadow border border-gray-200 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3 text-red-500" />
          </button>
        )}
      </div>
      <span className="text-xs mt-1 max-w-[60px] truncate">{creator?.name || 'User'}</span>
    </div>
  );
};

export default NoteItem;
