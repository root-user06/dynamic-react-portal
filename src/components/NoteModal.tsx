
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { useChatStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import { Note } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose }) => {
  const [noteContent, setNoteContent] = useState('');
  const { currentUser, addNote } = useChatStore();

  const handleSaveNote = () => {
    if (noteContent.trim() && currentUser) {
      const newNote: Note = {
        id: uuidv4(),
        creatorId: currentUser.id,
        content: noteContent.trim(),
        createdAt: new Date().toISOString()
      };
      
      addNote(newNote);
      setNoteContent('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle>New note</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-4">
          <Textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[200px] border-0 focus-visible:ring-0 text-base p-0 resize-none"
          />
        </div>
        
        {noteContent.trim() && (
          <div className="p-4 flex items-center justify-center border-t border-gray-100">
            <div className="bg-gray-100 px-4 py-2 rounded-full text-sm inline-block">
              {noteContent.trim().substring(0, 20)}{noteContent.trim().length > 20 ? '...' : ''}
            </div>
          </div>
        )}
        
        {currentUser && (
          <div className="flex flex-col items-center py-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-gray-200 text-xl">
                {currentUser.name[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs text-gray-500 mt-2">
              Friends can see your note
            </div>
          </div>
        )}
        
        <DialogFooter className="px-4 py-3 border-t border-gray-100 flex justify-between">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="text-gray-500"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveNote}
            disabled={!noteContent.trim()}
            className="bg-[#46C8B6] hover:bg-[#3baa9b] text-[#ffffff]"
          >
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NoteModal;
