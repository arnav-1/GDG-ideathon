import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  role: null,
  isLoading: true,
  initialize: async () => {
    // Initial fetch
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || null;
    
    // Check custom claims, user metadata, OR the mocked hr domain
    const role = (user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin' || user?.email?.includes('@hr.dell.com')) 
      ? 'admin' 
      : (user ? 'employee' : null);
    
    set({ user, role, isLoading: false });

    // Listener for login/logout events securely from Supabase
    supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      const currentRole = (currentUser?.user_metadata?.role === 'admin' || currentUser?.app_metadata?.role === 'admin' || currentUser?.email?.includes('@hr.dell.com')) 
        ? 'admin' 
        : (currentUser ? 'employee' : null);
      
      set({ user: currentUser, role: currentRole, isLoading: false });
    });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null });
  }
}));
