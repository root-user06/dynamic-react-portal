
import { useState, useEffect } from 'react';
import { useChatStore } from '@/lib/store';
import UserProfile from '@/components/UserProfile';
import Loader from '@/components/Loader';

const Profile = () => {
  const { currentUser } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="h-full overflow-auto">
      {currentUser && <UserProfile user={currentUser} showBackButton={false} />}
    </div>
  );
};

export default Profile;
