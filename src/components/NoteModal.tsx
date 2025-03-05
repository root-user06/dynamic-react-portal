
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
      <DialogContent className="sm:max-w-md p-0 bg-white rounded-2xl overflow-hidden flex flex-col h-[80vh] sm:h-auto">
        <DialogHeader className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-medium">New note</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 p-4 flex flex-col justify-between overflow-auto">
          <Textarea
            value={noteContent}
            onChange={handleNoteChange}
            placeholder="What's on your mind?"
            className="min-h-[150px] border-0 focus-visible:ring-0 text-base p-0 resize-none flex-grow"
            maxLength={maxCharCount}
          />
          
          <div className="text-right text-xs text-gray-500 mt-1">
            {noteContent.length}/{maxCharCount}
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          {noteContent.trim() && (
            <div className="relative max-w-[250px] mb-4">
              <div className="bg-white px-4 py-2 rounded-3xl text-sm border border-gray-200 shadow-sm relative">
                {noteContent.trim()}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white border-r border-b border-gray-200"></div>
              </div>
            </div>
          )}
          
          {currentUser && (
            <div className="flex flex-col items-center">
              <Avatar className="w-20 h-20 border border-gray-200">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.name} className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-gray-200 text-xl">
                    {currentUser.name[0].toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="text-xs text-gray-500 mt-2">
                {noteContent.length}/{maxCharCount} characters
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Friends can see your note for 24 hours
              </div>
            </div>
          )}
        </div>
        
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
            className="bg-[#0084ff] hover:bg-[#0078e7] text-white"
          >
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NoteModal;
