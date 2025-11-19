import { useState, useEffect, useMemo } from 'react';
import { AdminProject } from './useAdminData';

export function useProjectSearch(projects: AdminProject[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter projects based on debounced search term
  const filteredProjects = useMemo(() => {
    if (!debouncedTerm.trim()) {
      return projects;
    }

    const term = debouncedTerm.toLowerCase();
    return projects.filter(
      project =>
        project.name.toLowerCase().includes(term) ||
        project.region.toLowerCase().includes(term)
    );
  }, [projects, debouncedTerm]);

  return {
    filteredProjects,
    searchTerm,
    setSearchTerm,
    isSearching: searchTerm !== debouncedTerm,
  };
}

