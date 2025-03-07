
import { useEffect, useState } from 'react';
import ChatWindow from '@/components/ChatWindow';
import { useChatStore } from '@/lib/store';
import { updateUserStatus } from '@/lib/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '@/components/Loader';
import CallService from '@/lib/CallService';

const Chat = () => {
  const { currentUser, selectedUser, setSelectedUser } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();
  const [callService] = useState(() => CallService.getInstance());

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Set selected user based on URL param
  useEffect(() => {
    if (id && currentUser) {
      const user = useChatStore.getState().onlineUsers.find(u => u.id === id);
      if (user) {
        setSelectedUser(user);
      } else {
        navigate('/userlist');
      }
    } else if (!id && selectedUser) {
      setSelectedUser(null);
      navigate('/userlist');
    }
  }, [id, currentUser, setSelectedUser, navigate, selectedUser]);

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

  // Initialize call service
  useEffect(() => {
    // Initialize callService when component mounts
    if (currentUser) {
      callService.initialize().catch(err => 
        console.error("Error initializing call service:", err)
      );
    }
    
    // Clean up call service when component unmounts
    return () => {
      // We don't fully destroy the service since it's a singleton
      // and might be used by other components
      if (callService.getCurrentCall()) {
        callService.endCurrentCall();
      }
    };
  }, [currentUser, callService]);

  if (isLoading) {
    return <Loader />;
  }

  const handleViewProfile = () => {
    if (selectedUser) {
      navigate(`/profile/${selectedUser.id}`);
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <ChatWindow 
        showBackButton={true} 
        onBack={() => {
          setSelectedUser(null);
          navigate('/userlist');
        }}
        onViewProfile={handleViewProfile}
      />
    </div>
  );
};

export default Chat;
