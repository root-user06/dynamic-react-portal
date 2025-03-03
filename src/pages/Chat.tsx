
import { useEffect, useState } from 'react';
import UserList from '@/components/UserList';
import ChatWindow from '@/components/ChatWindow';
import UserProfile from '@/components/UserProfile';
import { useChatStore } from '@/lib/store';
import { updateUserStatus } from '@/lib/firebase';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, MessageCircle } from 'lucide-react';
import CallDialog from '@/components/CallDialog';
import CallController from '@/components/CallController';
import Loader from '@/components/Loader';

const Chat = () => {
  const { currentUser, selectedUser, setSelectedUser } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chats' | 'profile'>('chats');
  const [viewingProfile, setViewingProfile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Handle user status updates
  useEffect(() => {
    if (currentUser) {
      updateUserStatus({
        ...currentUser,
        isOnline: true,
        lastSeen: new Date().toISOString()
      });

      const handleBeforeUnload = () => {
        updateUserStatus({
          ...currentUser,
          isOnline: false,
          lastSeen: new Date().toISOString()
        });
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        handleBeforeUnload();
      };
    }
  }, [currentUser]);

  if (isLoading) {
    return <Loader />;
  }

  const handleTabChange = (tab: 'chats' | 'profile') => {
    setActiveTab(tab);
    setViewingProfile(tab === 'profile');
    if (tab === 'profile') {
      navigate('/chat/profile');
    } else {
      navigate('/chat');
    }
  };

  const handleViewProfile = () => {
    if (selectedUser) {
      setViewingProfile(true);
    }
  };

  const renderBottomNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
      <div className="flex items-center justify-around">
        <button
          onClick={() => handleTabChange('chats')}
          className={`flex flex-col items-center p-2 ${
            activeTab === 'chats' ? 'text-[#46C8B6]' : 'text-gray-600'
          }`}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="text-xs mt-1">Chats</span>
        </button>
        <button
          onClick={() => handleTabChange('profile')}
          className={`flex flex-col items-center p-2 ${
            activeTab === 'profile' ? 'text-[#46C8B6]' : 'text-gray-600'
          }`}
        >
          <User className="h-6 w-6" />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-white flex flex-col select-none">
      {/* Call Controller (invisible component) */}
      <CallController />
      
      {/* Call Dialog */}
      <CallDialog />
      
      {viewingProfile && selectedUser ? (
        <div className="flex-1 overflow-hidden pb-16">
          <UserProfile 
            user={selectedUser} 
            showBackButton={true}
            onBack={() => setViewingProfile(false)}
          />
        </div>
      ) : selectedUser ? (
        <ChatWindow 
          showBackButton={true} 
          onBack={() => {
            setSelectedUser(null);
            navigate('/chat');
          }}
          onViewProfile={handleViewProfile}
        />
      ) : location.pathname === '/chat/profile' ? (
        <div className="flex-1 overflow-hidden pb-16">
          <UserProfile 
            user={currentUser!} 
            showBackButton={true}
            onBack={() => navigate('/chat')}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden pb-16">
          <UserList onChatSelect={(user) => {
            setSelectedUser(user);
            navigate(`/chat/${user.id}`);
          }} />
        </div>
      )}
      {!selectedUser && !viewingProfile && renderBottomNavigation()}
    </div>
  );
};

export default Chat;

