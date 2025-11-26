import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../features/auth';

interface FranchiseContextType {
  franchiseId: string | null;
  franchiseSlug: string | null;
  franchiseName: string | null;
  userRole: 'user' | 'manager' | 'support' | 'admin' | 'ceo' | 'franchise_employee' | null;
  isCEO: boolean;
  isAdmin: boolean;
  isFranchiseEmployee: boolean;
  canViewAllFranchises: boolean;
  canEditFranchise: (franchiseId: string) => boolean;
  isLoading: boolean;
  error: Error | null;
}

const FranchiseContext = createContext<FranchiseContextType | undefined>(undefined);

interface FranchiseProviderProps {
  children: ReactNode;
}

export const FranchiseProvider: React.FC<FranchiseProviderProps> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const [franchiseId, setFranchiseId] = useState<string | null>(null);
  const [franchiseSlug, setFranchiseSlug] = useState<string | null>(null);
  const [franchiseName, setFranchiseName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<FranchiseContextType['userRole']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUserFranchise = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get user profile to check role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        setUserRole(profile.role as FranchiseContextType['userRole']);

        // If user is CEO or admin, they don't have a specific franchise
        if (profile.role === 'ceo' || profile.role === 'admin') {
          setFranchiseId(null);
          setFranchiseSlug(null);
          setFranchiseName(null);
          setIsLoading(false);
          return;
        }

        // If user is franchise_employee, fetch their franchise
        if (profile.role === 'franchise_employee') {
          const { data: franchise, error: franchiseError } = await supabase
            .from('performance_franchises' as any)
            .select('id, slug, name')
            .eq('owner_user_id', user.id)
            .single();

          if (franchiseError) {
            // User might not be linked to a franchise yet
            console.warn('Franchise employee not linked to franchise:', franchiseError);
            setIsLoading(false);
            return;
          }

          if (franchise) {
            setFranchiseId(franchise.id);
            setFranchiseSlug(franchise.slug);
            setFranchiseName(franchise.name);
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching user franchise:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    fetchUserFranchise();
  }, [user?.id]);

  // Helper functions
  const isCEO = userRole === 'ceo';
  const isAdmin = userRole === 'admin';
  const isFranchiseEmployee = userRole === 'franchise_employee';
  const canViewAllFranchises = isCEO || isAdmin;

  const canEditFranchise = (targetFranchiseId: string): boolean => {
    // CEO and admin can edit any franchise
    if (isCEO || isAdmin) return true;
    
    // Franchise employees can only edit their own franchise
    if (isFranchiseEmployee && franchiseId === targetFranchiseId) return true;
    
    return false;
  };

  const value: FranchiseContextType = {
    franchiseId,
    franchiseSlug,
    franchiseName,
    userRole,
    isCEO,
    isAdmin,
    isFranchiseEmployee,
    canViewAllFranchises,
    canEditFranchise,
    isLoading,
    error,
  };

  return (
    <FranchiseContext.Provider value={value}>
      {children}
    </FranchiseContext.Provider>
  );
};

export const useFranchise = (): FranchiseContextType => {
  const context = useContext(FranchiseContext);
  if (context === undefined) {
    throw new Error('useFranchise must be used within a FranchiseProvider');
  }
  return context;
};
