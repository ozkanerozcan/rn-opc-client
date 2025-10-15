import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Load user session on mount
  useEffect(() => {
    checkUser();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      
      setInitializing(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error on no rows

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      // If profile doesn't exist, create one
      if (!data) {
        console.log('Profile not found, creating new profile...');
        await createProfile(userId);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const createProfile = async (userId) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email || '';
      const userMetadata = userData?.user?.user_metadata || {};
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            full_name: userMetadata.full_name || userEmail.split('@')[0],
            avatar_url: null,
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const signUp = async (email, password, fullName) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Create profile immediately after signup
      if (data?.user) {
        await createProfile(data.user.id);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      // Clear session locally first to avoid UI bouncing back to tabs
      setUser(null);
      setProfile(null);
      console.log('[Auth] Calling supabase.auth.signOut');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('[Auth] supabase.auth.signOut success');
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      
      if (!user) throw new Error('No user logged in');

      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      let data, error;

      if (!existingProfile) {
        // Create profile if it doesn't exist
        console.log('Profile does not exist, creating...');
        const result = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              ...updates,
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        // Update existing profile
        const result = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error updating password:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (uri) => {
    try {
      setLoading(true);
      
      if (!user) throw new Error('No user logged in');

      // Create file path
      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Fetch the image
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: `image/${fileExt}`,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with avatar URL
      await updateProfile({ avatar_url: publicUrl });

      return { data: publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    loading,
    initializing,
    signUp,
    signIn,
    signOut,
    updateProfile,
    updatePassword,
    uploadAvatar,
    refreshProfile: () => user ? loadProfile(user.id) : null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};