
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { useChatStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import { Note } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import { DialogDescription } from '@/components/ui/dialog';

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
      <DialogContent className="sm:max-w-md p-4 bg-white rounded-xl overflow-hidden max-h-[90vh] sm:h-auto">
        <DialogHeader className="mb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-center w-full">What's on your mind?</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4 h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="sr-only">Create a new note</DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center">
          {/* Thought bubble design for the note */}
          <div className="w-full max-w-sm mx-auto mb-4">
            <div className="relative">
              <div className="p-4 rounded-3xl border-2 border-black bg-white">
                <Textarea
                  value={noteContent}
                  onChange={handleNoteChange}
                  placeholder="Type your thought here..."
                  className="min-h-[120px] border-0 focus-visible:ring-0 text-base p-0 resize-none"
                  maxLength={maxCharCount}
                />
              </div>
              <div className="absolute -bottom-4 right-8 w-4 h-4 rounded-full border-2 border-black bg-white"></div>
              <div className="absolute -bottom-8 right-4 w-3 h-3 rounded-full border-2 border-black bg-white"></div>
            </div>
          </div>
          
          {/* Character count */}
          <div className="text-right text-xs text-gray-500 w-full max-w-sm mb-6">
            {noteContent.length}/{maxCharCount}
          </div>
          
          {/* User avatar preview */}
          {currentUser && (
            <div className="flex flex-col items-center my-4">
              <Avatar className="w-16 h-16 border border-gray-200">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.name} className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-gray-200 text-lg">
                    {currentUser.name[0].toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="text-xs text-gray-500 mt-2">
                Visible to friends for 24 hours
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-6">
          <Button 
            onClick={handleSaveNote}
            disabled={!noteContent.trim()}
            className="w-full bg-[#0084ff] hover:bg-[#0078e7] text-white"
          >
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NoteModal;
