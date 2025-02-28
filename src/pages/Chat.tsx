
import { useEffect, useState } from 'react';
import UserList from '@/components/UserList';
import ChatWindow from '@/components/ChatWindow';
import UserProfile from '@/components/UserProfile';
import { useChatStore } from '@/lib/store';
import { updateUserStatus } from '@/lib/firebase';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, MessageCircle } from 'lucide-react';

const Chat = () => {
  const { currentUser, selectedUser, setSelectedUser } = useChatStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chats' | 'profile'>('chats');
  const navigate = useNavigate();
  const location = useLocation();

  // Debug info
  useEffect(() => {
    console.log("Current user in Chat page:", currentUser);
    console.log("Selected user in Chat page:", selectedUser);
  }, [currentUser, selectedUser]);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    return <LoadingSkeleton />;
  }

  if (!currentUser) {
    navigate('/auth/login');
    return null;
  }

  const handleTabChange = (tab: 'chats' | 'profile') => {
    setActiveTab(tab);
    if (tab === 'profile') {
      navigate('/chat/profile');
    } else {
      navigate('/chat');
    }
  };

  const renderBottomNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white shadow-lg">
      <div className="flex items-center justify-around py-2">
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

  if (isMobile) {
    return (
      <div className="h-screen bg-[#FAFAFA] flex flex-col">
        {selectedUser ? (
          <ChatWindow 
            showBackButton={true} 
            onBack={() => {
              setSelectedUser(null);
              navigate('/chat');
            }} 
          />
        ) : location.pathname === '/chat/profile' ? (
          <div className="flex-1 overflow-hidden pb-16">
            <UserProfile 
              user={currentUser} 
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
        {!selectedUser && renderBottomNavigation()}
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#FAFAFA] relative overflow-hidden">
      <div className="flex h-full">
        <div className="w-80 border-r border-gray-200 bg-white">
          <UserList onChatSelect={setSelectedUser} />
        </div>
        <div className="flex-1 relative">
          <ChatWindow />
        </div>
        {selectedUser && (
          <div className="w-80 border-l border-gray-200 bg-white">
            <UserProfile user={selectedUser} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
