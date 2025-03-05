
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, MessageSquare } from 'lucide-react';
import { useChatStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import { Note } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose }) => {
  const [noteContent, setNoteContent] = useState('');
  const { currentUser, addNote, notes } = useChatStore();
  const [hasExistingNote, setHasExistingNote] = useState(false);
  const maxCharCount = 70;
  
  useEffect(() => {
    if (currentUser) {
      const userNote = notes.find(note => note.creatorId === currentUser.id);
      setHasExistingNote(!!userNote);
    }
  }, [currentUser, notes, isOpen]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    if (content.length <= maxCharCount) {
      setNoteContent(content);
    }
  };

  const handleSaveNote = () => {
    if (noteContent.trim() && currentUser) {
      if (hasExistingNote) {
        toast({
          title: "Replacing existing note",
          description: "Your previous note will be replaced with this new one.",
          duration: 3000,
        });
      }
      
      const newNote: Note = {
        id: uuidv4(),
        creatorId: currentUser.id,
        content: noteContent.trim(),
        createdAt: new Date().toISOString(),
        expiresAt: '' // Will be set in the store/firebase
      };
      
      try {
        addNote(newNote);
        toast({
          title: "Note shared",
          description: "Your note will be visible to your friends for 24 hours",
          duration: 3000,
        });
        setNoteContent('');
        onClose();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create note",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 bg-white rounded-xl">
        <DialogHeader className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">New note</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="p-4 min-h-[200px] flex flex-col">
          <Textarea
            value={noteContent}
            onChange={handleNoteChange}
            placeholder="What's on your mind?"
            className="min-h-[150px] border-0 focus-visible:ring-0 text-base p-0 resize-none flex-grow"
            maxLength={maxCharCount}
          />
          
          <div className="text-right text-sm text-gray-500 mt-2">
            {noteContent.length}/{maxCharCount}
          </div>
        </div>
        
        {noteContent.trim() && (
          <div className="p-4 flex justify-center">
            <div className="relative max-w-[250px]">
              <MessageSquare className="absolute -top-6 right-4 text-gray-300 h-10 w-10 transform rotate-12" />
              <div className="bg-gray-100 px-4 py-3 rounded-2xl text-sm">
                {noteContent.trim()}
              </div>
            </div>
          </div>
        )}
        
        {currentUser && (
          <div className="flex flex-col items-center py-4">
            <Avatar className="w-16 h-16">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.name} className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="bg-gray-200 text-xl">
                  {currentUser.name[0].toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="text-xs text-gray-500 mt-2">
              Friends can see your note for 24 hours
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
            className="bg-[#46C8B6] hover:bg-[#3baa9b] text-white"
          >
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NoteModal;
