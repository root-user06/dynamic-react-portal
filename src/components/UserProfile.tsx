import { User } from '@/lib/types';
import { Button } from './ui/button';
import { ChevronLeft, LogOut } from 'lucide-react';
import { Input } from './ui/input';
import { useState } from 'react';
import { useChatStore } from '@/lib/store';
import { updateUserStatus, logoutUser } from '@/lib/firebase';
import { toast } from './ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface UserProfileProps {
  user: User;
  showBackButton?: boolean;
  onBack?: () => void;
}

const UserProfile = ({ user, showBackButton, onBack }: UserProfileProps) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const { setCurrentUser, currentUser } = useChatStore();
  const isOwnProfile = currentUser?.id === user.id;

  const handleSave = async () => {
    try {
      const updatedUser = {
        ...user,
        name: name.trim()
      };

      await updateUserStatus(updatedUser);
      setCurrentUser(updatedUser);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    try {
      if (currentUser) {
        // Set user status to offline before logout
        const offlineUser = {
          ...currentUser,
          isOnline: false,
          lastSeen: new Date().toISOString()
        };
        await updateUserStatus(offlineUser);
      }
      
      await logoutUser();
      // Clear user from store
      setCurrentUser(null);
      // Clear cookies and session storage
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      sessionStorage.clear();
      // Redirect to landing page
      navigate('/', { replace: true });
      toast({
        title: "Success",
        description: "Logged out successfully!",
        className: "bg-green-50 border-green-200"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full bg-white">
      {showBackButton && (
        <div className="p-4 border-b border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden -ml-2"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>
      )}
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-3xl">
            {user.name[0].toUpperCase()}
          </div>
          <div className="text-center space-y-1">
            {isOwnProfile && isEditing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-center"
                placeholder="Enter your name"
              />
            ) : (
              <h2 className="text-xl font-semibold">{user.name}</h2>
            )}
            <p className="text-gray-500">
              {user.isOnline ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>

        {isOwnProfile && (
          <div className="space-y-4">
            {isEditing ? (
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setName(user.name);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            ) : (
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}

            {/* Logout Button */}
            <Button 
              className="w-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2" 
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>

            {/* Future authentication fields - only shown on own profile */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Email</label>
                <Input
                  type="email"
                  placeholder="Email will be added with authentication"
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Password</label>
                <Input
                  type="password"
                  placeholder="Password will be added with authentication"
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <Button className="w-full" disabled>
                Update Authentication Details
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
