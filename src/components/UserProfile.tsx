
import { User } from '@/lib/types';
import { Button } from './ui/button';
import { ChevronLeft, LogOut } from 'lucide-react';
import { Input } from './ui/input';
import { useState } from 'react';
import { useChatStore } from '@/lib/store';
import { updateUserStatus } from '@/lib/firebase';
import { toast } from './ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserProfileProps {
  user: User;
  showBackButton?: boolean;
  onBack?: () => void;
}

const UserProfile = ({ user, showBackButton, onBack }: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const { setCurrentUser, currentUser } = useChatStore();
  const isOwnProfile = currentUser?.id === user.id;
  const { logout } = useAuth();
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="h-full bg-[#09122C] text-white">
      {showBackButton && (
        <div className="p-4 border-b border-gray-700">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden -ml-2 text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>
      )}
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl">
            {user.name[0].toUpperCase()}
          </div>
          <div className="text-center space-y-1">
            {isOwnProfile && isEditing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-center bg-white/10 text-white border-white/20"
                placeholder="Enter your name"
              />
            ) : (
              <h2 className="text-xl font-semibold">{user.name}</h2>
            )}
            <p className="text-gray-300">
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
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            ) : (
              <Button 
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="border-white/20 text-white hover:bg-white/10 w-full"
              >
                Edit Profile
              </Button>
            )}

            {/* Logout button with red background and icon */}
            <Button 
              className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white flex gap-2 items-center justify-center"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Logout
            </Button>

            {/* Future authentication fields - only shown on own profile */}
            <div className="space-y-4 pt-4 border-t border-white/20 mt-6">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Email</label>
                <Input
                  type="email"
                  placeholder="Email will be added with authentication"
                  disabled
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Password</label>
                <Input
                  type="password"
                  placeholder="Password will be added with authentication"
                  disabled
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <Button className="w-full bg-white/10 text-white hover:bg-white/20" disabled>
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
