
import { useState, useEffect } from 'react';
import { useChatStore } from '@/lib/store';
import { User, Note } from '@/lib/types';
import { Search, PlusCircle, FileText, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import Loader from '@/components/Loader';
import NoteModal from '@/components/NoteModal';
import NoteItem from '@/components/NoteItem';
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
    // Fix: Updated the Loader component props to match what the component expects
    return <Loader variant="userList" />;
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
            className="pl-9 w-full bg-muted/50"
          />
        </div>
      </div>

      {/* Stories and Online Users Horizontal Scroll */}
      <div className="p-4 overflow-x-auto whitespace-nowrap border-b border-gray-200">
        <div className="flex space-x-4">
          {/* Current user's profile with drop a thought */}
          {currentUser && (
            <div className="flex flex-col items-center cursor-pointer">
              <div className="relative">
                {myNotes.length > 0 && (
                  <div 
                    className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-200 text-xs max-w-[120px] truncate"
                    onClick={() => handleNoteClick(myNotes[0])}
                  >
                    {myNotes[0].content.length > 60 
                      ? `${myNotes[0].content.substring(0, 60)}...` 
                      : myNotes[0].content}
                  </div>
                )}
                <Avatar className="w-14 h-14 border border-gray-200">
                  <AvatarFallback className="bg-gray-200 text-lg">
                    {currentUser.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div onClick={handleOpenNoteModal} className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                  <Plus className="w-4 h-4 text-[#46C8B6]" />
                </div>
              </div>
              <div className="text-xs mt-1 text-gray-500 max-w-[70px] truncate">Create story</div>
            </div>
          )}

          {/* Recent notes from other users */}
          {otherUsersNotes.slice(0, 10).map(note => {
            const noteCreator = onlineUsers.find(user => user.id === note.creatorId);
            return (
              <div
                key={note.id}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => handleNoteClick(note)}
              >
                {note.content.length > 0 && (
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-200 text-xs max-w-[120px] truncate">
                    {note.content.length > 60 
                      ? `${note.content.substring(0, 60)}...` 
                      : note.content}
                  </div>
                )}
                <div className="relative w-14 h-14 rounded-full overflow-hidden">
                  <Avatar className="w-14 h-14">
                    <AvatarFallback className="bg-gray-200 text-lg">
                      {noteCreator?.name[0].toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  {noteCreator?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <span className="text-xs mt-1 max-w-[60px] truncate">{noteCreator?.name || 'User'}</span>
              </div>
            );
          })}

          {/* Online users */}
          {onlineUsersFiltered.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user)}
              className="flex flex-col items-center cursor-pointer"
            >
              <div className="relative">
                <Avatar className="w-14 h-14">
                  <AvatarFallback className="bg-gray-200 text-lg">
                    {user.name[0].toUpperCase()}
                  </AvatarFallback>
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
                    <AvatarFallback className="bg-gray-200">
                      {user.name[0].toUpperCase()}
                    </AvatarFallback>
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
                  <div className="w-5 h-5 rounded-full bg-[#46C8B6] text-white text-xs flex items-center justify-center">
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

