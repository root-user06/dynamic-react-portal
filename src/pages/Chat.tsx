import { useEffect, useState } from 'react';
import UserList from '@/components/UserList';
import ChatWindow from '@/components/ChatWindow';
import UserProfile from '@/components/UserProfile';
import { useChatStore } from '@/lib/store';
import { updateUserStatus, logoutUser } from '@/lib/firebase';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, MessageCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import Loader from '@/components/ui/loader';

const Chat = () => {
  const { currentUser, selectedUser, setSelectedUser, logout } = useChatStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chats' | 'profile'>('chats');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("Current user in Chat page:", currentUser);
    console.log("Selected user in Chat page:", selectedUser);
  }, [currentUser, selectedUser]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    navigate('/');
    return null;
  }

  const handleLogout = async () => {
    try {
      if (currentUser) {
        await updateUserStatus({
          ...currentUser,
          isOnline: false,
          lastSeen: new Date().toISOString()
        });
      }
      
      await logoutUser();
      logout();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "There was an error logging out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTabChange = (tab: 'chats' | 'profile') => {
    setActiveTab(tab);
    if (tab === 'profile') {
      navigate('/chat/profile');
    } else {
      navigate('/chat');
    }
  };

  const renderBottomNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
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
      <div className="h-screen bg-white flex flex-col">
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
            <div className="p-4 flex justify-between items-center border-b border-gray-200">
              <h1 className="text-xl font-semibold">Profile</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-500"
              >
                <LogOut className="h-5 w-5 mr-1" />
                <span>Logout</span>
              </Button>
            </div>
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
    <div className="h-screen bg-white relative overflow-hidden">
      <div className="flex h-full">
        <div className="w-80 border-r border-gray-200">
          <UserList onChatSelect={setSelectedUser} />
        </div>
        <div className="flex-1 relative">
          <ChatWindow />
        </div>
        {selectedUser ? (
          <div className="w-80 border-l border-gray-200">
            <UserProfile user={selectedUser} />
          </div>
        ) : (
          <div className="w-80 border-l border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Your Profile</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#46C8B6]/10 flex items-center justify-center text-[#46C8B6] text-xl">
                  {currentUser.name && currentUser.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{currentUser.name}</h3>
                  <p className="text-sm text-gray-600">{currentUser.email || "No email added"}</p>
                </div>
              </div>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full mt-4 border-red-500 text-red-500 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
