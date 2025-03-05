
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Trash2 } from 'lucide-react';
import { Note } from '@/lib/types';
import { useChatStore } from '@/lib/store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface NoteDetailModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

const NoteDetailModal: React.FC<NoteDetailModalProps> = ({ note, isOpen, onClose, onDelete }) => {
  const { onlineUsers, currentUser } = useChatStore();
  
  if (!note) return null;
  
  const creator = onlineUsers.find(user => user.id === note.creatorId);
  const isOwnNote = note.creatorId === currentUser?.id;
  
  // Calculate time remaining until expiration
  const timeRemaining = note.expiresAt ? 
    formatDistanceToNow(new Date(note.expiresAt), { addSuffix: false }) : 
    '24 hours';
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 bg-white rounded-xl">
        <DialogHeader className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Note</DialogTitle>
            <div className="flex items-center space-x-2">
              {isOwnNote && onDelete && (
                <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              {creator?.photoURL ? (
                <img src={creator.photoURL} alt={creator.name} className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="bg-gray-200">
                  {creator?.name[0] || '?'}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="font-medium">{creator?.name || 'User'}</div>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="p-4 bg-gray-50 rounded-2xl relative">
              <p className="whitespace-pre-wrap">{note.content}</p>
              <div className="absolute -bottom-2 left-4 w-3 h-3 rotate-45 bg-gray-50"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-center pt-3">
            <div className="text-xs text-gray-500">
              Expires in {timeRemaining}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NoteDetailModal;
