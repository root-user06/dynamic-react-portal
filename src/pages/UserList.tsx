
import { useState, useEffect } from 'react';
import { useChatStore } from '@/lib/store';
import { User, Note } from '@/lib/types';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import NoteModal from '@/components/NoteModal';
import NoteDetailModal from '@/components/NoteDetailModal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';

const UserList = () => {
  const { onlineUsers, currentUser, messages, notes, deleteNote } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const navigate = useNavigate();

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getLastMessage = (userId: string) => {
    return messages
      .filter(m => (m.senderId === userId && m.receiverId === currentUser?.id) || 
                   (m.senderId === currentUser?.id && m.receiverId === userId))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  const getUnreadCount = (userId: string): number => {
    return messages.filter(m => 
      m.senderId === userId && 
      m.receiverId === currentUser?.id && 
      !m.isRead
    ).length;
  };

  const handleUserClick = (user: User) => {
    if (user.id === currentUser?.id) return;
    navigate(`/chat/${user.id}`);
  };

  const handleOpenNoteModal = () => {
    setIsNoteModalOpen(true);
  };

  const handleCloseNoteModal = () => {
    setIsNoteModalOpen(false);
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
  };

  const handleCloseNoteDetail = () => {
    setSelectedNote(null);
  };
  
  const handleDeleteNote = (noteId: string) => {
    deleteNote(noteId);
    toast({
      title: "Note deleted",
      description: "Your note has been deleted successfully",
    });
  };

  const onlineUsersFiltered = onlineUsers.filter(user => 
    user.id !== currentUser?.id && 
    user.isOnline
  );
  
  // Get my notes
  const myNotes = notes
    .filter(note => note.creatorId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Get other users' notes
  const otherUsersNotes = notes
    .filter(note => note.creatorId !== currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredAndSortedUsers = onlineUsers
    .filter(user => 
      user.id !== currentUser?.id && 
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aLastMessage = getLastMessage(a.id);
      const bLastMessage = getLastMessage(b.id);
      
      if (!aLastMessage && !bLastMessage) return 0;
      if (!aLastMessage) return 1;
      if (!bLastMessage) return -1;
      
      return new Date(bLastMessage.timestamp).getTime() - new Date(aLastMessage.timestamp).getTime();
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#46C8B6]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border">
        <div className="flex items-center">
          <img 
            src="/Logo.svg" 
            alt="Logo" 
            className="w-8 h-8 mr-2"
          />
          <h2 className="text-xl font-semibold">Chats</h2>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full bg-gray-100 border-0"
          />
        </div>
      </div>

      {/* Stories and Online Users Horizontal Scroll */}
      <div className="p-4 overflow-x-auto whitespace-nowrap border-b border-gray-200">
        <div className="flex space-x-4">
          {/* Current user's profile with drop a thought */}
          {currentUser && (
            <div className="flex flex-col items-center cursor-pointer relative">
              {myNotes.length > 0 ? (
                <div 
                  className="absolute -top-14 transform -translate-y-1/2 max-w-[120px] z-10"
                  onClick={() => handleNoteClick(myNotes[0])}
                >
                  <div className="relative">
                    <div className="p-2 rounded-3xl border-2 border-black bg-white text-xs text-center">
                      {myNotes[0].content.length > 25 
                        ? `${myNotes[0].content.substring(0, 25)}...` 
                        : myNotes[0].content}
                    </div>
                    <div className="absolute -bottom-2 right-6 w-3 h-3 bg-white rounded-full border-2 border-black"></div>
                    <div className="absolute -bottom-4 right-3 w-2 h-2 bg-white rounded-full border-2 border-black"></div>
                  </div>
                </div>
              ) : null}
              
              <div className="relative mt-6">
                <Avatar className="w-16 h-16 border border-gray-200">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.name} className="h-full w-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-gray-200 text-lg">
                      {currentUser.name[0].toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div onClick={handleOpenNoteModal} className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                  <Plus className="w-4 h-4 text-[#0084ff]" />
                </div>
              </div>
              <div className="text-xs mt-1 max-w-[70px] truncate">Your story</div>
            </div>
          )}

          {/* Recent notes from other users */}
          {otherUsersNotes.map(note => {
            const noteCreator = onlineUsers.find(user => user.id === note.creatorId);
            if (!noteCreator) return null;
            
            return (
              <div
                key={note.id}
                className="flex flex-col items-center cursor-pointer relative"
                onClick={() => handleNoteClick(note)}
              >
                <div className="absolute -top-14 transform -translate-y-1/2 max-w-[120px] z-10">
                  <div className="relative">
                    <div className="p-2 rounded-3xl border-2 border-black bg-white text-xs text-center">
                      {note.content.length > 25 
                        ? `${note.content.substring(0, 25)}...` 
                        : note.content}
                    </div>
                    <div className="absolute -bottom-2 right-6 w-3 h-3 bg-white rounded-full border-2 border-black"></div>
                    <div className="absolute -bottom-4 right-3 w-2 h-2 bg-white rounded-full border-2 border-black"></div>
                  </div>
                </div>
                
                <div className="relative mt-6">
                  <Avatar className="w-16 h-16 border border-gray-200">
                    {noteCreator?.photoURL ? (
                      <img src={noteCreator.photoURL} alt={noteCreator.name} className="h-full w-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-gray-200 text-lg">
                        {noteCreator?.name[0].toUpperCase() || '?'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {noteCreator?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <span className="text-xs mt-1 max-w-[60px] truncate">{noteCreator?.name || 'User'}</span>
              </div>
            );
          })}

          {/* Online users without notes */}
          {onlineUsersFiltered
            .filter(user => !otherUsersNotes.some(note => note.creatorId === user.id))
            .map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserClick(user)}
                className="flex flex-col items-center cursor-pointer mt-6"
              >
                <div className="relative">
                  <Avatar className="w-16 h-16 border border-gray-200">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-gray-200 text-lg">
                        {user.name[0].toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <span className="text-xs mt-1 max-w-[60px] truncate">{user.name}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedUsers.map((user) => {
          const lastMessage = getLastMessage(user.id);
          const unreadCount = getUnreadCount(user.id);
          
          return (
            <div
              key={user.id}
              onClick={() => handleUserClick(user)}
              className="p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-gray-200">
                        {user.name[0].toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {user.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className={`font-medium truncate ${unreadCount > 0 ? 'text-black' : 'text-gray-900'}`}>
                      {user.name}
                    </p>
                    {lastMessage && (
                      <span className="text-xs text-gray-500">
                        {new Date(lastMessage.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </div>
                  {lastMessage && (
                    <p className={`text-sm truncate ${
                      unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-500'
                    }`}>
                      {lastMessage.senderId === currentUser?.id ? 'You: ' : ''}
                      {lastMessage.content}
                    </p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[#0084ff] text-white text-xs flex items-center justify-center">
                    {unreadCount}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <NoteModal isOpen={isNoteModalOpen} onClose={handleCloseNoteModal} />
      <NoteDetailModal 
        note={selectedNote} 
        isOpen={selectedNote !== null} 
        onClose={handleCloseNoteDetail}
        onDelete={() => selectedNote && handleDeleteNote(selectedNote.id)}
      />
    </div>
  );
};

export default UserList;
