'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { X, Upload, User } from 'lucide-react';
import { uploadFile, getSignedUrl } from '@/lib/supabase';
import { useWhop } from '@/hooks/use-whop-mock';

interface ProfileFormProps {
  initialData?: {
    name: string;
    bio: string;
    interests: string[];
    avatar_path?: string;
  };
  onSubmit: (data: { name: string; bio: string; interests: string[]; avatarPath?: string }) => Promise<void>;
  isLoading?: boolean;
}

const SUGGESTED_INTERESTS = [
  'AI & ML',
  'Crypto',
  'Trading',
  'NFTs',
  'Web3',
  'Gaming',
  'Fitness',
  'Music',
  'Art',
  'Coding',
  'Marketing',
  'Business',
  'SaaS',
  'Entrepreneurship',
  'Design',
];

export function ProfileForm({ initialData, onSubmit, isLoading }: ProfileFormProps) {
  const { user } = useWhop();
  const [name, setName] = useState(initialData?.name || '');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [interests, setInterests] = useState<string[]>(initialData?.interests || []);
  const [customInterest, setCustomInterest] = useState('');
  const [avatarPath, setAvatarPath] = useState(initialData?.avatar_path || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Load existing avatar URL when component mounts
  useEffect(() => {
    const loadAvatar = async () => {
      if (initialData?.avatar_path && !avatarPreview) {
        const url = await getSignedUrl('user-profiles', initialData.avatar_path);
        if (url) {
          setAvatarPreview(url);
        }
      }
    };
    loadAvatar();
  }, [initialData?.avatar_path]);

  const handleAddInterest = (interest: string) => {
    if (interest && !interests.includes(interest) && interests.length < 10) {
      setInterests([...interests, interest]);
      setCustomInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Avatar must be less than 2MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Avatar must be an image');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileName = `${user.id}.${file.name.split('.').pop()}`;
      const path = await uploadFile('user-profiles', fileName, file);
      
      if (path) {
        setAvatarPath(path);
        setAvatarPreview(URL.createObjectURL(file));
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, bio, interests, avatarPath });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Profile Picture</Label>
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarPreview || avatarPath ? (
              <img
                src={avatarPreview || avatarPath}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
              </div>
            )}
          </div>
          <div>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={isLoading || isUploadingAvatar}
            />
            <label htmlFor="avatar-upload">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading || isUploadingAvatar}
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Avatar
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              Max 2MB, JPG/PNG/GIF
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself..."
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label>Interests * (select at least 3)</Label>
        <div className="flex flex-wrap gap-2 mb-3">
          {interests.map(interest => (
            <Badge key={interest} variant="default" className="cursor-pointer">
              {interest}
              <button
                type="button"
                onClick={() => handleRemoveInterest(interest)}
                className="ml-1 hover:text-destructive"
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              placeholder="Add custom interest"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInterest(customInterest);
                }
              }}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAddInterest(customInterest)}
              disabled={!customInterest || isLoading}
            >
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {SUGGESTED_INTERESTS.filter(i => !interests.includes(i)).map(interest => (
              <Badge
                key={interest}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                onClick={() => handleAddInterest(interest)}
              >
                + {interest}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || isUploadingAvatar || !name || interests.length < 3}
      >
        {isLoading || isUploadingAvatar ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  );
}

