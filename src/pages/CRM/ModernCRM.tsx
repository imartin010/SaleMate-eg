import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, AlertCircle, Search, Filter, Plus, Download, 
  LayoutGrid, List, Phone, Mail, MessageCircle,
  X, Check, Eye, Edit, Briefcase,
  RefreshCw, BarChart3, Users, TrendingUp,
  Sparkles, ChevronLeft, ChevronRight, Grid3x3, Building2, DollarSign, MessageSquare, Save, Upload, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import { useLeads, Lead, LeadStage } from '../../hooks/crm/useLeads';
import { useLeadFilters } from '../../hooks/crm/useLeadFilters';
import { useLeadStats } from '../../hooks/crm/useLeadStats';
import { useDuplicateDetection } from '../../hooks/crm/useDuplicateDetection';
import { useCustomColumns, CustomColumnsProvider } from '../../hooks/crm/useCustomColumns';
import { DuplicateLeadsModal } from '../../components/crm/DuplicateLeadsModal';
import { SavedFiltersManager } from '../../components/crm/SavedFiltersManager';
import { AdvancedSearch } from '../../components/crm/AdvancedSearch';
import { CustomColumnsManager } from '../../components/crm/CustomColumnsManager';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';
import { AddLeadModal } from '../../components/crm/AddLeadModal';
import { BulkUploadModal } from '../../components/crm/BulkUploadModal';
import { EditLeadDialog } from '../../components/crm/EditLeadDialog';
import { LeadDetailModal } from '../../components/crm/LeadDetailModal';
import { MaskedPhone } from '../../components/crm/MaskedPhone';
import { FeedbackHistory } from '../../components/crm/FeedbackHistory';
import { EmptyState } from '../../components/common/EmptyState';
import { BottomSheet } from '../../components/common/BottomSheet';
import { FloatingActionButton } from '../../components/common/FloatingActionButton';
import { SkeletonList } from '../../components/common/SkeletonCard';
import { AssignLeadDialog } from '../../components/crm/AssignLeadDialog';

interface Project {
  id: string;
  name: string;
}

type ViewMode = 'table' | 'kanban' | 'cards';

const STAGES: LeadStage[] = [
  'New Lead',
  'Potential',
  'Hot Case',
  'Meeting Done',
  'Closed Deal',
  'No Answer',
  'Call Back',
  'Whatsapp',
  'Non Potential',
  'Wrong Number',
  'Switched Off',
  'Low Budget',
];

export const getStageColor = (stage: LeadStage): string => {
  const colors: Record<LeadStage, string> = {
    'New Lead': 'bg-blue-100 text-blue-800 border-blue-200',
    'Potential': 'bg-purple-100 text-purple-800 border-purple-200',
    'Hot Case': 'bg-orange-100 text-orange-800 border-orange-200',
    'Meeting Done': 'bg-green-100 text-green-800 border-green-200',
    'Closed Deal': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'No Answer': 'bg-gray-100 text-gray-800 border-gray-200',
    'Call Back': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Whatsapp': 'bg-green-100 text-green-800 border-green-200',
    'Non Potential': 'bg-red-100 text-red-800 border-red-200',
    'Wrong Number': 'bg-red-100 text-red-800 border-red-200',
    'Switched Off': 'bg-slate-100 text-slate-800 border-slate-200',
    'Low Budget': 'bg-amber-100 text-amber-800 border-amber-200',
  };
  return colors[stage] || 'bg-gray-100 text-gray-800 border-gray-200';
};

function ModernCRMContent() {
  const navigate = useNavigate();
  const { leads, loading, error, fetchLeads, createLead, updateLead } = useLeads();
  const { filters, filteredLeads, updateFilter, clearFilters, hasActiveFilters, updateMultipleFilters, loadFilters } = useLeadFilters(leads);
  const stats = useLeadStats(leads);

  // Load view mode from localStorage or default to 'cards'
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const savedViewMode = localStorage.getItem('crm_view_mode') as ViewMode;
    return savedViewMode && ['table', 'kanban', 'cards'].includes(savedViewMode) 
      ? savedViewMode 
      : 'cards';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [leadsPerPage, setLeadsPerPage] = useState<number>(() => {
    const saved = localStorage.getItem('crm_leads_per_page');
    return saved ? parseInt(saved, 10) : 30;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [budgetValue, setBudgetValue] = useState<string>('');
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [feedbackValue, setFeedbackValue] = useState<string>('');
  const [revealedPhoneId, setRevealedPhoneId] = useState<string | null>(null);
  const [openStageDropdown, setOpenStageDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [selectedDuplicateLead, setSelectedDuplicateLead] = useState<Lead | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const badgeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const leadsSectionRef = useRef<HTMLDivElement>(null);

  // Duplicate detection
  const { isDuplicate, getAllDuplicates } = useDuplicateDetection(leads);

  // Custom columns
  const { visibleColumns } = useCustomColumns();

  // Enhanced search - search across all fields
  const searchFilteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return filteredLeads;
    
    const query = searchQuery.toLowerCase();
    return filteredLeads.filter(lead => 
      lead.client_name?.toLowerCase().includes(query) ||
      lead.client_phone?.includes(query) ||
      lead.client_email?.toLowerCase().includes(query) ||
      lead.company_name?.toLowerCase().includes(query) ||
      lead.project?.name?.toLowerCase().includes(query) ||
      lead.feedback?.toLowerCase().includes(query) ||
      lead.source?.toLowerCase().includes(query)
    );
  }, [filteredLeads, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(searchFilteredLeads.length / leadsPerPage);
  const startIndex = (currentPage - 1) * leadsPerPage;
  const endIndex = startIndex + leadsPerPage;
  const paginatedLeads = searchFilteredLeads.slice(startIndex, endIndex);

  // Reset to first page if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Reset selected leads and page when search/filter changes
  useEffect(() => {
    setSelectedLeads(new Set());
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, filters]);

  // Reset to first page when leads per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [leadsPerPage]);

  // Save leads per page to localStorage
  useEffect(() => {
    localStorage.setItem('crm_leads_per_page', leadsPerPage.toString());
  }, [leadsPerPage]);

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('crm_view_mode', viewMode);
  }, [viewMode]);

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (openStageDropdown) {
      const badgeElement = badgeRefs.current.get(openStageDropdown);
      if (badgeElement) {
        const rect = badgeElement.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right
        });
      }
    } else {
      setDropdownPosition(null);
    }
  }, [openStageDropdown]);

  // Close stage dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openStageDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-stage-dropdown]') && !target.closest('[data-stage-dropdown-menu]')) {
          setOpenStageDropdown(null);
        }
      }
    };

    if (openStageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openStageDropdown]);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .order('name');

        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };
    fetchProjects();
  }, []);

  // Quick contact actions
  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };


  // Export to CSV - exports selected leads if any are selected, otherwise exports all filtered leads
  const handleExport = () => {
    const headers = ['Name', 'Phone', 'Phone 2', 'Phone 3', 'Email', 'Job Title', 'Company', 'Project', 'Stage', 'Source', 'Budget', 'Feedback', 'Created At'];
    
    // If there are selected leads, export only those. Otherwise, export all filtered leads.
    const leadsToExport = selectedLeads.size > 0
      ? searchFilteredLeads.filter(lead => selectedLeads.has(lead.id))
      : searchFilteredLeads;
    
    const rows = leadsToExport.map(lead => [
      lead.client_name || '',
      lead.client_phone || '',
      lead.client_phone2 || '',
      lead.client_phone3 || '',
      lead.client_email || '',
      lead.client_job_title || '',
      lead.company_name || '',
      lead.project?.name || '',
      lead.stage || '',
      lead.source || '',
      lead.budget?.toString() || '',
      lead.feedback || '',
      lead.created_at ? format(new Date(lead.created_at), 'yyyy-MM-dd HH:mm:ss') : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const exportType = selectedLeads.size > 0 ? 'selected' : 'all';
    link.download = `leads-export-${exportType}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Toggle lead selection
  const toggleLeadSelection = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const toggleSelectAll = () => {
    // Get IDs of currently visible (paginated) leads only
    const visibleLeadIds = paginatedLeads.map(l => l.id);
    const allVisibleSelected = visibleLeadIds.every(id => selectedLeads.has(id));
    
    const newSelected = new Set(selectedLeads);
    
    if (allVisibleSelected) {
      // Deselect all visible leads
      visibleLeadIds.forEach(id => newSelected.delete(id));
    } else {
      // Select all visible leads
      visibleLeadIds.forEach(id => newSelected.add(id));
    }
    
    setSelectedLeads(newSelected);
  };

  // Loading state
  if (loading && leads.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-blue-50/20 to-white">
        <div className="px-4 py-8">
          <SkeletonList count={5} />
        </div>
      </div>
    );
  }

  // Error state
  if (error && leads.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-blue-50/20 to-white">
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <div className="text-center max-w-md bg-white rounded-2xl p-8 shadow-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Leads</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchLeads} className="bg-indigo-600 hover:bg-indigo-700">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const statCardVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        type: "spring" as const,
        stiffness: 200,
        damping: 20,
      },
    }),
    hover: {
      scale: 1.05,
      y: -5,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 25,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-blue-50/20 to-white pb-20 relative overflow-hidden">
      {/* Animated background elements - reduced on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-10 -left-10 w-48 h-48 md:top-20 md:-left-20 md:w-96 md:h-96 bg-indigo-200/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 25, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
    <motion.div
          className="absolute bottom-10 -right-10 w-48 h-48 md:bottom-20 md:-right-20 md:w-96 md:h-96 bg-blue-200/20 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -25, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <main className="w-full px-3 py-3 md:container md:mx-auto md:px-6 md:py-8 md:max-w-7xl relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4 md:space-y-6"
        >
          {/* Header - Mobile First */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1"
            >
              <motion.h1 
                className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 bg-clip-text text-transparent mb-1 md:text-3xl md:mb-2 lg:text-4xl"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                My Leads
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="inline-block ml-1 md:ml-2"
                >
                  <Sparkles className="h-5 w-5 text-indigo-500 inline md:h-6 md:w-6 lg:h-8 lg:w-8" />
                </motion.span>
              </motion.h1>
              <motion.p 
                className="text-sm text-gray-600 md:text-base lg:text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Manage and track your sales leads
              </motion.p>
            </motion.div>

            <motion.div 
              className="flex items-center gap-2 w-full md:w-auto"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div 
                className="flex-1 md:flex-none"
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="w-full md:w-auto rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-500/30 relative overflow-hidden group h-11 md:h-auto"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <Plus className="h-4 w-4 mr-2 relative z-10" />
                  <span className="relative z-10 text-sm md:text-base">Add Lead</span>
                </Button>
              </motion.div>
              <motion.div 
                className="md:flex-none"
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  onClick={() => setShowBulkUploadModal(true)}
                  className="rounded-xl border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 h-11 w-11 md:h-auto md:w-auto md:px-4"
                >
                  <Upload className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Bulk Upload</span>
                </Button>
              </motion.div>
              <motion.div 
                className="md:flex-none"
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="rounded-xl border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 h-11 w-11 md:h-auto md:w-auto md:px-4"
                  disabled={searchFilteredLeads.length === 0}
                >
                  <Download className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">
                    {selectedLeads.size > 0 
                      ? `Export Selected (${selectedLeads.size})` 
                      : 'Export All'}
                  </span>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Stats Cards - Mobile First Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-5"
          >
            {[
              { 
                label: 'Total Leads', 
                value: stats.totalLeads, 
                icon: Users, 
                color: 'indigo', 
                gradient: 'from-indigo-500 to-indigo-600',
                isActive: !hasActiveFilters,
                onClick: () => {
                  clearFilters();
                  setSearchQuery('');
                }
              },
              { 
                label: 'Hot Cases', 
                value: stats.hotCases, 
                icon: TrendingUp, 
                color: 'orange', 
                gradient: 'from-orange-500 to-orange-600',
                isActive: filters.stage === 'Hot Case' && !filters.stages && filters.hasBudget === undefined && filters.search === '' && filters.project === 'all' && filters.platform === 'all' && filters.dateRange === 'all',
                onClick: () => {
                  updateMultipleFilters({
                    stage: 'Hot Case',
                    stages: undefined,
                    hasBudget: undefined,
                  });
                  setSearchQuery('');
                  setCurrentPage(1);
                  // Scroll to top of leads section
                  setTimeout(() => {
                    if (leadsSectionRef.current) {
                      leadsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 0);
                }
              },
              { 
                label: 'Meetings', 
                value: stats.meetings, 
                icon: Check, 
                color: 'emerald', 
                gradient: 'from-emerald-500 to-emerald-600',
                isActive: filters.stage === 'Meeting Done' && !filters.stages && filters.hasBudget === undefined && filters.search === '' && filters.project === 'all' && filters.platform === 'all' && filters.dateRange === 'all',
                onClick: () => {
                  updateMultipleFilters({
                    stage: 'Meeting Done',
                    stages: undefined,
                    hasBudget: undefined,
                  });
                  setSearchQuery('');
                  setCurrentPage(1);
                  // Scroll to top of leads section
                  setTimeout(() => {
                    if (leadsSectionRef.current) {
                      leadsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 0);
                }
              },
              { 
                label: 'Quality', 
                value: Math.round(stats.qualityRate), 
                icon: BarChart3, 
                color: 'indigo', 
                gradient: 'from-indigo-500 to-indigo-600', 
                suffix: '%',
                isActive: filters.stages?.length === 5 && 
                  filters.stages.includes('Potential') && 
                  filters.stages.includes('Hot Case') && 
                  filters.stages.includes('Meeting Done') && 
                  filters.stages.includes('Closed Deal') && 
                  filters.stages.includes('Call Back') &&
                  filters.hasBudget === undefined && filters.search === '' && filters.project === 'all' && filters.platform === 'all' && filters.dateRange === 'all',
                onClick: () => {
                  updateMultipleFilters({
                    stage: 'all',
                    stages: ['Potential', 'Hot Case', 'Meeting Done', 'Closed Deal', 'Call Back'],
                    hasBudget: undefined,
                  });
                  setSearchQuery('');
                  setCurrentPage(1);
                  // Scroll to top of leads section
                  setTimeout(() => {
                    if (leadsSectionRef.current) {
                      leadsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 0);
                }
              },
              { 
                label: 'Pipeline', 
                value: stats.pipeline, 
                icon: DollarSign, 
                color: 'blue', 
                gradient: 'from-blue-500 to-blue-600', 
                format: 'currency',
                isActive: filters.hasBudget === true && !filters.stages && !filters.stage && filters.search === '' && filters.project === 'all' && filters.platform === 'all' && filters.dateRange === 'all',
                onClick: () => {
                  updateMultipleFilters({
                    stage: 'all',
                    stages: undefined,
                    hasBudget: true,
                  });
                  setSearchQuery('');
                  setCurrentPage(1);
                  // Scroll to top of leads section
                  setTimeout(() => {
                    if (leadsSectionRef.current) {
                      leadsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 0);
                }
              },
            ].map((stat, index) => {
              const isActive = stat.isActive || false;
              return (
              <motion.div
                key={stat.label}
                custom={index}
                variants={statCardVariants}
                whileHover="hover"
                whileTap={{ scale: 0.98 }}
                onClick={stat.onClick}
                className={`bg-white rounded-xl p-3 md:rounded-2xl md:p-4 lg:p-6 border shadow-sm relative overflow-hidden group cursor-pointer transition-all hover:shadow-md active:shadow-sm ${
                  isActive 
                    ? 'border-indigo-400 shadow-md ring-2 ring-indigo-200' 
                    : 'border-indigo-100'
                }`}
              >
                {/* Animated gradient overlay */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-active:opacity-5 md:group-hover:opacity-5 transition-opacity duration-300`}
                />
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-active:translate-x-full md:group-hover:translate-x-full transition-transform duration-1000"
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1 md:mb-2">
                    <p className="text-xs text-gray-600 font-medium md:text-sm truncate pr-1">{stat.label}</p>
                    <motion.div
                      whileTap={{ rotate: 360, scale: 1.2 }}
                      className="md:whileHover={{ rotate: 360, scale: 1.2 }}"
                      transition={{ duration: 0.5 }}
                    >
                      <stat.icon className={`h-4 w-4 text-${stat.color}-600 md:h-5 md:w-5`} />
                    </motion.div>
                  </div>
                  <motion.p 
                    className={`text-xl font-bold bg-gradient-to-r from-${stat.color}-600 to-${stat.color}-700 bg-clip-text text-transparent md:text-2xl lg:text-3xl`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 200 }}
                  >
                    {stat.format === 'currency' 
                      ? `EGP ${stat.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                      : `${stat.value}${stat.suffix || ''}`
                    }
                  </motion.p>
                  {/* Animated pulse dot - hidden on mobile */}
                  <motion.div
                    className={`hidden md:block absolute top-3 right-3 md:top-4 md:right-4 w-2 h-2 bg-${stat.color}-500 rounded-full`}
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </motion.div>
              );
            })}
          </motion.div>

          {/* Action Buttons Row - Floating above search bar */}
          <motion.div
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-2 md:p-3 border border-indigo-100 shadow-md relative z-10"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <motion.div 
                className="flex-shrink-0"
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  onClick={() => setShowFilters(!showFilters)}
                  size="sm"
                  className="rounded-xl h-9 md:h-10"
                >
                  <motion.div
                    animate={showFilters ? { rotate: 180 } : { rotate: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                  </motion.div>
                  <span className="text-sm">Filters</span>
                  {hasActiveFilters && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-2 bg-indigo-600 text-white rounded-full px-1.5 py-0.5 text-xs"
                    >
                      {Object.values(filters).filter(Boolean).length}
                    </motion.span>
                  )}
                </Button>
              </motion.div>
              {/* Advanced Search */}
              <div className="flex-shrink-0">
                <AdvancedSearch
                  filters={filters}
                  onFiltersChange={updateMultipleFilters}
                />
              </div>
              {/* Saved Filters - Only show in table view */}
              {viewMode === 'table' && (
                <div className="flex-shrink-0">
                  <SavedFiltersManager
                    currentFilters={filters}
                    onLoadFilter={loadFilters}
                  />
                </div>
              )}
              {/* Custom Columns - Only show in table view */}
              {viewMode === 'table' && (
                <div className="flex-shrink-0">
                  <CustomColumnsManager />
                </div>
              )}
              <motion.div
                whileTap={{ rotate: 180, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="md:whileHover={{ rotate: 180 }} flex-shrink-0"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchLeads}
                  className="rounded-xl h-9 w-9 md:h-10 md:w-auto md:px-3 touch-manipulation"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Search Bar - Separate container, full width */}
          <motion.div
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-3 md:rounded-2xl md:p-4 lg:p-6 border border-indigo-100 shadow-lg relative overflow-hidden"
          >
            {/* Animated border gradient */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent)',
                backgroundSize: '200% 100%',
              }}
              animate={{
                backgroundPosition: ['200% 0', '-200% 0'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            {/* Search Bar - Full Width */}
            <motion.div 
              className="relative w-full"
              whileFocus={{ scale: 1.01 }}
            >
              <motion.div
                animate={{
                  rotate: searchQuery ? [0, 10, -10, 0] : 0,
                }}
                transition={{ duration: 0.5 }}
                className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 z-10"
              >
                <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              </motion.div>
              <Input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 md:pl-12 h-11 md:h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 relative z-0 text-sm md:text-base w-full"
              />
              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 z-10"
                >
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 active:bg-gray-100 md:hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Filters Section Container - Only show when filters are active or filters panel is open */}
          {(hasActiveFilters || showFilters) && (
            <motion.div
              variants={itemVariants}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-3 md:rounded-2xl md:p-4 lg:p-6 border border-indigo-100 shadow-lg relative overflow-hidden"
            >
              {/* Clear Filters Button - Appears when filters are active */}
              {hasActiveFilters && (
              <div className="mb-3 md:mb-4 relative z-50">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Clear Filters button clicked - handler fired');
                    clearFilters();
                    setSearchQuery('');
                    console.log('Filters should be cleared now');
                  }}
                  variant="outline"
                  size="default"
                  className="w-full md:w-auto rounded-xl border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 font-medium transition-all duration-200 cursor-pointer active:scale-95 shadow-sm hover:shadow-md relative z-50"
                  style={{ pointerEvents: 'auto' }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Advanced Filters Panel - Desktop */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="hidden md:block pt-3 md:pt-4 border-t border-gray-200 space-y-3 md:space-y-4 relative z-10"
                >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Stage</label>
                    <Select
                      value={filters.stage || 'all'}
                      onValueChange={(value) => updateFilter('stage', value === 'all' ? undefined : (value as LeadStage))}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        {STAGES.map(stage => (
                          <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Project</label>
                    <Select
                      value={filters.project || 'all'}
                      onValueChange={(value) => updateFilter('project', value === 'all' ? undefined : value)}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Platform</label>
                    <Select
                      value={filters.platform || 'all'}
                      onValueChange={(value) => updateFilter('platform', value === 'all' ? undefined : value)}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="snapchat">Snapchat</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearFilters();
                        setSearchQuery('');
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
                </motion.div>
              )}
            </AnimatePresence>
            </motion.div>
          )}

          {/* View Mode Toggle and Bulk Actions - Mobile First */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs md:text-sm text-gray-600">
                Showing <span className="font-semibold">{startIndex + 1}</span> - <span className="font-semibold">{Math.min(endIndex, searchFilteredLeads.length)}</span> of{' '}
                <span className="font-semibold">{searchFilteredLeads.length}</span> leads
                {searchFilteredLeads.length !== leads.length && (
                  <span className="text-gray-500"> (filtered from {leads.length})</span>
                )}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 w-full md:w-auto">
              {selectedLeads.size > 0 && (
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <span className="text-xs md:text-sm text-gray-600">{selectedLeads.size} selected</span>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowAssignDialog(true)}
                    className="rounded-xl h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Users className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Assign to:</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLeads(new Set())}
                    className="rounded-xl h-8 w-8 p-0 md:h-auto md:w-auto md:px-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
              <motion.div 
                className="flex items-center gap-1 bg-white rounded-xl p-1 border border-indigo-100 shadow-sm ml-auto md:ml-0"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="md:whileHover={{ scale: 1.1 }}"
                >
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setViewMode('cards');
                      localStorage.setItem('crm_view_mode', 'cards');
                    }}
                    className="rounded-lg transition-all h-8 w-8 p-0 md:h-auto md:w-auto md:px-3 touch-manipulation"
                  >
                    <Grid3x3 className="h-4 w-4" />
                    <span className="hidden md:inline ml-2">Cards</span>
                  </Button>
                </motion.div>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="md:whileHover={{ scale: 1.1 }}"
                >
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setViewMode('table');
                      localStorage.setItem('crm_view_mode', 'table');
                    }}
                    className="rounded-lg transition-all h-8 w-8 p-0 md:h-auto md:w-auto md:px-3 touch-manipulation"
                  >
                    <motion.div
                      animate={viewMode === 'table' ? { rotate: 0 } : { rotate: -90 }}
                      transition={{ duration: 0.3 }}
                    >
                      <List className="h-4 w-4" />
                    </motion.div>
                    <span className="hidden md:inline ml-2">Table</span>
                  </Button>
                </motion.div>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="md:whileHover={{ scale: 1.1 }}"
                >
                  <Button
                    variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setViewMode('kanban');
                      localStorage.setItem('crm_view_mode', 'kanban');
                    }}
                    className="rounded-lg transition-all h-8 w-8 p-0 md:h-auto md:w-auto md:px-3 touch-manipulation"
                  >
                    <motion.div
                      animate={viewMode === 'kanban' ? { rotate: 0 } : { rotate: 90 }}
                      transition={{ duration: 0.3 }}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </motion.div>
                    <span className="hidden md:inline ml-2">Kanban</span>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Leads Display */}
          <div ref={leadsSectionRef} data-leads-section>
          <AnimatePresence mode="wait">
            {viewMode === 'cards' && (
              <motion.div
                key="cards"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 auto-rows-min"
              >
                {paginatedLeads.map((lead, index) => {
                  return (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, x: -20 }}
                    transition={{ 
                      delay: index * 0.03,
                      type: "spring",
                      stiffness: 200,
                      damping: 20
                    }}
                    whileTap={{ scale: 0.98 }}
                    className={`bg-white rounded-xl md:rounded-2xl border shadow-sm hover:shadow-lg transition-all relative overflow-hidden group touch-manipulation cursor-pointer active:border-indigo-300 ${
                      selectedLeads.has(lead.id) 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-indigo-100'
                    }`}
                    onDoubleClick={(e) => {
                      // Double-click selects/deselects lead for assignment
                      const target = e.target as HTMLElement;
                      if (target.closest('button') || target.closest('a') || target.closest('select')) {
                        return;
                      }
                      toggleLeadSelection(lead.id);
                    }}
                    data-testid="lead-card"
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-50/50 to-transparent -translate-x-full group-active:translate-x-full md:group-hover:translate-x-full transition-transform duration-1000"
                    />
                    
                    <div className="p-4 md:p-5 relative z-10">
                      {/* Header with Stage Badge */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 
                              className="font-semibold text-gray-900 text-base md:text-lg truncate cursor-pointer hover:text-indigo-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/app/crm/case/${lead.id}`);
                              }}
                            >
                              {lead.client_name}
                            </h3>
                            {isDuplicate(lead.id) && (
                              <Badge
                                className="bg-orange-100 text-orange-800 border-orange-200 text-xs px-2 py-0.5 cursor-pointer hover:bg-orange-200 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDuplicateLead(lead);
                                  setShowDuplicateModal(true);
                                }}
                              >
                                Duplicated
                              </Badge>
                            )}
                          </div>
                          {lead.company_name && (
                            <p className="text-xs md:text-sm text-gray-600 truncate mb-2">
                              {lead.company_name}
                            </p>
                          )}
                        </div>
                        <div 
                          className="relative" 
                          onClick={(e) => e.stopPropagation()} 
                          data-stage-dropdown
                          ref={(el) => {
                            if (el) {
                              badgeRefs.current.set(lead.id, el);
                            } else {
                              badgeRefs.current.delete(lead.id);
                            }
                          }}
                        >
                          <Badge 
                            className={`${getStageColor(lead.stage)} text-xs px-2 py-0.5 ml-2 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap`}
                            onClick={() => setOpenStageDropdown(openStageDropdown === lead.id ? null : lead.id)}
                          >
                            {lead.stage}
                          </Badge>
                        </div>
                      </div>

                      {/* Project Info */}
                      <div className="flex items-center gap-2 mb-3 text-sm">
                        <Building2 className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                        <span className={`truncate ${lead.project ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}`}>
                          {lead.project?.name || 'No Project'}
                        </span>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 mb-3">
                        {lead.client_phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                            <MaskedPhone 
                              phone={lead.client_phone} 
                              leadId={lead.id}
                              isRevealed={revealedPhoneId === lead.id}
                              onToggle={(id) => setRevealedPhoneId(id === revealedPhoneId ? null : id)}
                            />
                          </div>
                        )}
                        {lead.client_email && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                            <span className="truncate text-xs">{lead.client_email}</span>
                          </div>
                        )}
                      </div>

                      {/* Budget */}
                      {lead.budget && (
                        <div className="flex items-center gap-2 mb-3 text-sm">
                          <DollarSign className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-semibold text-gray-900">
                            EGP {lead.budget.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        {lead.client_phone && (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCall(lead.client_phone!);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-xs md:text-sm font-medium touch-manipulation"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            <span>Call</span>
                          </motion.button>
                        )}
                        {lead.client_phone && (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWhatsApp(lead.client_phone!);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs md:text-sm font-medium touch-manipulation"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>WhatsApp</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
                })}
              </motion.div>
            )}

            {viewMode === 'table' && (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl border border-indigo-100 shadow-lg overflow-hidden relative"
              >
                {/* Animated shimmer on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-100/50 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ backgroundSize: '200% 100%' }}
                  animate={{
                    backgroundPosition: ['200% 0', '-200% 0'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <div className="overflow-x-auto -mx-3 md:mx-0">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-indigo-50 border-b border-indigo-100">
                      <tr>
                        {/* Select column - always show */}
                        <th className="px-2 py-2 md:px-4 md:py-3 text-left">
                          <input
                            type="checkbox"
                            checked={paginatedLeads.length > 0 && paginatedLeads.every(lead => selectedLeads.has(lead.id))}
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 md:w-auto md:h-auto"
                          />
                        </th>
                        {/* Dynamic columns based on visibleColumns */}
                        {visibleColumns.map((column) => {
                          if (column.id === 'select') return null; // Skip select as it's always shown
                          return (
                            <th
                              key={column.id}
                              className={`px-2 py-2 md:px-4 md:py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider ${
                                column.id === 'contact' ? 'hidden sm:table-cell' : ''
                              } ${column.id === 'budget' ? 'hidden lg:table-cell' : ''} ${
                                column.id === 'feedback' ? 'min-w-[200px]' : ''
                              }`}
                            >
                              {column.label}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <AnimatePresence>
                        {paginatedLeads.map((lead, index) => (
                          <motion.tr
                            key={lead.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            transition={{ 
                              delay: index * 0.03,
                              type: "spring",
                              stiffness: 100,
                              damping: 15
                            }}
                            whileHover={{ 
                              scale: 1.01,
                              backgroundColor: "rgba(99, 102, 241, 0.05)",
                              transition: { duration: 0.2 }
                            }}
                            onDoubleClick={(e) => {
                              // Double-click selects/deselects lead for assignment
                              const target = e.target as HTMLElement;
                              if (target.closest('button') || target.closest('a') || target.closest('select') || target.closest('input')) {
                                return;
                              }
                              toggleLeadSelection(lead.id);
                            }}
                            className={`active:bg-indigo-50/50 md:hover:bg-indigo-50/50 transition-colors relative group touch-manipulation cursor-pointer ${
                              selectedLeads.has(lead.id) 
                                ? 'bg-indigo-50 border-l-4 border-indigo-500' 
                                : ''
                            }`}
                          >
                          {/* Empty cell for spacing (checkbox column removed) */}
                          <td className="px-2 py-2 md:px-4 md:py-3 w-0"></td>
                          {/* Dynamic columns based on visibleColumns */}
                          {visibleColumns.map((column) => {
                            if (column.id === 'select') return null; // Skip select as it's always shown
                            
                            let cellContent: React.ReactNode = null;
                            let cellClassName = `px-2 py-2 md:px-4 md:py-3 ${
                              column.id === 'contact' ? 'hidden sm:table-cell' : ''
                            } ${column.id === 'budget' ? 'hidden lg:table-cell' : ''}`;

                            switch (column.id) {
                              case 'name':
                                cellContent = (
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p 
                                        className="font-medium text-gray-900 text-sm md:text-base cursor-pointer hover:text-indigo-600 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/app/crm/case/${lead.id}`);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigate(`/app/crm/case/${lead.id}`);
                                          }
                                        }}
                                      >
                                        {lead.client_name}
                                      </p>
                                      {isDuplicate(lead.id) && (
                                        <Badge
                                          className="bg-orange-100 text-orange-800 border-orange-200 text-xs px-2 py-0.5 cursor-pointer hover:bg-orange-200 transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedDuplicateLead(lead);
                                            setShowDuplicateModal(true);
                                          }}
                                        >
                                          Duplicated
                                        </Badge>
                                      )}
                                    </div>
                                    {lead.company_name && (
                                      <p className="text-xs md:text-sm text-gray-500">{lead.company_name}</p>
                                    )}
                                    {/* Mobile: Show contact icons inline */}
                                    <div className="flex items-center gap-2 mt-1 sm:hidden">
                                      {lead.client_phone && (
                                        <motion.button
                                          whileTap={{ scale: 0.9 }}
                                          onClick={() => handleCall(lead.client_phone!)}
                                          className="text-indigo-600 p-1 rounded-full active:bg-indigo-100 transition-colors touch-manipulation"
                                          title="Call"
                                        >
                                          <Phone className="h-3.5 w-3.5" />
                                        </motion.button>
                                      )}
                                      {lead.client_phone && (
                                        <motion.button
                                          whileTap={{ scale: 0.9 }}
                                          onClick={() => handleWhatsApp(lead.client_phone!)}
                                          className="text-green-600 p-1 rounded-full active:bg-green-100 transition-colors touch-manipulation"
                                          title="WhatsApp"
                                        >
                                          <MessageCircle className="h-3.5 w-3.5" />
                                        </motion.button>
                                      )}
                                    </div>
                                  </div>
                                );
                                break;
                              case 'contact':
                                cellContent = (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {lead.client_phone && (
                                      <div className="flex items-center gap-1 text-sm text-gray-700">
                                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                                        <MaskedPhone 
                                          phone={lead.client_phone} 
                                          leadId={lead.id}
                                          isRevealed={revealedPhoneId === lead.id}
                                          onToggle={(id) => setRevealedPhoneId(id === revealedPhoneId ? null : id)}
                                        />
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      {lead.client_phone && (
                                        <motion.button
                                          whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                                          whileTap={{ scale: 0.9 }}
                                          onClick={() => handleCall(lead.client_phone!)}
                                          className="text-indigo-600 hover:text-indigo-800 p-1 rounded-full hover:bg-indigo-100 transition-colors touch-manipulation"
                                          title="Call"
                                        >
                                          <Phone className="h-4 w-4" />
                                        </motion.button>
                                      )}
                                      {lead.client_phone && (
                                        <motion.button
                                          whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                                          whileTap={{ scale: 0.9 }}
                                          onClick={() => handleWhatsApp(lead.client_phone!)}
                                          className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100 transition-colors touch-manipulation"
                                          title="WhatsApp"
                                        >
                                          <MessageCircle className="h-4 w-4" />
                                        </motion.button>
                                      )}
                                      {lead.client_email && (
                                        <motion.button
                                          whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                                          whileTap={{ scale: 0.9 }}
                                          onClick={() => handleEmail(lead.client_email!)}
                                          className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-colors touch-manipulation"
                                          title="Email"
                                        >
                                          <Mail className="h-4 w-4" />
                                        </motion.button>
                                      )}
                                    </div>
                                  </div>
                                );
                                break;
                              case 'project':
                                cellContent = (
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0 hidden sm:inline" />
                                    <p className={`text-xs md:text-sm truncate max-w-[120px] lg:max-w-none ${lead.project ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}`}>
                                      {lead.project?.name || 'No Project'}
                                    </p>
                                  </div>
                                );
                                break;
                              case 'assigned_to':
                                cellContent = (
                                  <div className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0 hidden sm:inline" />
                                    <p className={`text-xs md:text-sm truncate max-w-[120px] lg:max-w-none ${lead.assigned_to ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}`}>
                                      {lead.assigned_to?.name || 'Not Assigned'}
                                    </p>
                                  </div>
                                );
                                break;
                              case 'stage':
                                cellContent = (
                                  <div 
                                    className="relative inline-block" 
                                    onClick={(e) => e.stopPropagation()} 
                                    data-stage-dropdown
                                    ref={(el) => {
                                      if (el) {
                                        badgeRefs.current.set(lead.id, el);
                                      } else {
                                        badgeRefs.current.delete(lead.id);
                                      }
                                    }}
                                  >
                                    <Badge 
                                      className={`${getStageColor(lead.stage)} text-xs px-2 py-0.5 cursor-pointer hover:opacity-80 transition-opacity border whitespace-nowrap`}
                                      onClick={() => setOpenStageDropdown(openStageDropdown === lead.id ? null : lead.id)}
                                    >
                                      {lead.stage}
                                    </Badge>
                                  </div>
                                );
                                break;
                              case 'budget':
                                cellContent = editingBudgetId === lead.id ? (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      value={budgetValue}
                                      onChange={(e) => setBudgetValue(e.target.value)}
                                      onBlur={async () => {
                                        const numValue = budgetValue.trim() === '' ? undefined : parseFloat(budgetValue);
                                        if (numValue !== undefined && !isNaN(numValue)) {
                                          await updateLead(lead.id, { budget: numValue });
                                        } else if (budgetValue.trim() === '') {
                                          await updateLead(lead.id, { budget: undefined });
                                        }
                                        setEditingBudgetId(null);
                                        setBudgetValue('');
                                      }}
                                      onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                          e.currentTarget.blur();
                                        } else if (e.key === 'Escape') {
                                          setEditingBudgetId(null);
                                          setBudgetValue('');
                                        }
                                      }}
                                      className="h-7 md:h-8 text-xs md:text-sm w-24 md:w-32"
                                      autoFocus
                                      placeholder="Budget"
                                    />
                                  </div>
                                ) : (
                                  <p 
                                    className="text-xs md:text-sm font-medium text-gray-900 cursor-pointer hover:text-indigo-600 hover:bg-indigo-50 -mx-1 px-1 py-0.5 rounded transition-colors"
                                    onClick={() => {
                                      setEditingBudgetId(lead.id);
                                      setBudgetValue(lead.budget?.toString() || '');
                                    }}
                                    title="Click to edit budget"
                                  >
                                    {lead.budget ? `EGP ${lead.budget.toLocaleString()}` : '-'}
                                  </p>
                                );
                                break;
                              case 'feedback':
                                cellContent = editingFeedbackId === lead.id ? (
                                  <div className="space-y-2 min-w-[200px]">
                                    <div className="relative">
                                      <Textarea
                                        value={feedbackValue}
                                        onChange={(e) => setFeedbackValue(e.target.value)}
                                        placeholder="Enter your feedback here..."
                                        className="w-full min-h-[80px] text-xs md:text-sm resize-none border-2 border-indigo-500 focus:border-indigo-600 shadow-md"
                                        autoFocus
                                      />
                                      <div className="absolute top-2 right-2 text-xs text-gray-400">
                                        {feedbackValue.length} chars
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        onClick={async () => {
                                          await updateLead(lead.id, { feedback: feedbackValue });
                                          setEditingFeedbackId(null);
                                          setFeedbackValue('');
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-7"
                                      >
                                        <Save className="h-3 w-3 mr-1" />
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingFeedbackId(null);
                                          setFeedbackValue('');
                                        }}
                                        className="text-xs h-7"
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2 min-w-[200px]">
                                    <div
                                      onClick={() => {
                                        setEditingFeedbackId(lead.id);
                                        setFeedbackValue(lead.feedback || '');
                                      }}
                                      className="group relative cursor-pointer"
                                    >
                                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-gray-300 group-hover:border-indigo-500 rounded-lg p-2 md:p-3 min-h-[60px] transition-all duration-200 group-hover:shadow-md">
                                        <div className="flex items-start gap-2">
                                          <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                          <div className="flex-1">
                                            {lead.feedback ? (
                                              <p className="text-xs md:text-sm text-gray-700 whitespace-pre-wrap line-clamp-2">
                                                {lead.feedback}
                                              </p>
                                            ) : (
                                              <p className="text-xs md:text-sm text-gray-400 italic">
                                                Click to add feedback...
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                                          <span>Click to {lead.feedback ? 'edit' : 'add'} feedback</span>
                                          {lead.feedback_history && lead.feedback_history.length > 0 ? (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedFeedbackId(
                                                  expandedFeedbackId === lead.id ? null : lead.id
                                                );
                                              }}
                                              className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium px-2 py-0.5 rounded hover:bg-indigo-50 transition-colors"
                                              title={`View ${lead.feedback_history.length} previous feedback ${lead.feedback_history.length === 1 ? 'entry' : 'entries'}`}
                                            >
                                              <Clock className="h-3 w-3 mr-1" />
                                              <span className="mr-1">History ({lead.feedback_history.length})</span>
                                              {expandedFeedbackId === lead.id ? (
                                                <ChevronUp className="h-3 w-3" />
                                              ) : (
                                                <ChevronDown className="h-3 w-3" />
                                              )}
                                            </button>
                                          ) : (
                                            <span className="text-gray-400 text-[10px]">No history</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {expandedFeedbackId === lead.id && lead.feedback_history && (
                                      <FeedbackHistory history={lead.feedback_history} />
                                    )}
                                  </div>
                                );
                                break;
                              case 'actions':
                                cellContent = (
                                  <div className="flex items-center gap-1 md:gap-2">
                                    <motion.button
                                      whileTap={{ scale: 0.9 }}
                                      whileHover={{ scale: 1.2 }}
                                      onClick={() => navigate(`/app/crm/case/${lead.id}`)}
                                      className="text-purple-600 hover:text-purple-800 p-1.5 md:p-1 rounded-full active:bg-purple-100 md:hover:bg-purple-100 transition-colors touch-manipulation"
                                      title="Manage Case"
                                    >
                                      <Briefcase className="h-4 w-4" />
                                    </motion.button>
                                    <motion.button
                                      whileTap={{ scale: 0.9 }}
                                      whileHover={{ scale: 1.2 }}
                                      onClick={() => handleCall(lead.client_phone || '')}
                                      disabled={!lead.client_phone}
                                      className="text-indigo-600 hover:text-indigo-800 p-1.5 md:p-1 rounded-full active:bg-indigo-100 md:hover:bg-indigo-100 transition-colors touch-manipulation disabled:opacity-50"
                                      title="Call"
                                    >
                                      <Phone className="h-4 w-4" />
                                    </motion.button>
                                    <motion.button
                                      whileTap={{ scale: 0.9 }}
                                      whileHover={{ scale: 1.2 }}
                                      onClick={() => handleWhatsApp(lead.client_phone || '')}
                                      disabled={!lead.client_phone}
                                      className="text-green-600 hover:text-green-800 p-1.5 md:p-1 rounded-full active:bg-green-100 md:hover:bg-green-100 transition-colors touch-manipulation disabled:opacity-50"
                                      title="WhatsApp"
                                    >
                                      <MessageCircle className="h-4 w-4" />
                                    </motion.button>
                                  </div>
                                );
                                break;
                              default:
                                cellContent = null;
                            }

                            return (
                              <td key={column.id} className={cellClassName}>
                                {cellContent}
                              </td>
                            );
                          })}
                        </motion.tr>
                      ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {viewMode === 'kanban' && (
              <motion.div
                key="kanban"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="overflow-x-auto pb-4 -mx-3 md:mx-0"
              >
                <div className="flex gap-2 md:gap-4 min-w-max px-3 md:px-0">
                  {['New Lead', 'Potential', 'Hot Case', 'Meeting Done', 'Closed Deal'].map((stage, colIndex) => {
                    // Filter leads for this stage from the paginated results
                    const stageLeads = paginatedLeads.filter(l => l.stage === stage);
                    // Also get total count for badge
                    const totalStageLeads = searchFilteredLeads.filter(l => l.stage === stage).length;
                    return (
                      <motion.div
                        key={stage}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: colIndex * 0.1 }}
                        className="flex-shrink-0 w-64 md:w-72 bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl border border-indigo-100 shadow-lg p-3 md:p-4 relative overflow-hidden"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.add('ring-2', 'ring-indigo-400', 'ring-offset-2');
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove('ring-2', 'ring-indigo-400', 'ring-offset-2');
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.remove('ring-2', 'ring-indigo-400', 'ring-offset-2');
                          
                          const leadId = e.dataTransfer.getData('text/plain');
                          if (leadId) {
                            const lead = leads.find(l => l.id === leadId);
                            if (lead && lead.stage !== stage) {
                              try {
                                await updateLead(leadId, { stage: stage as LeadStage });
                                setDraggedLeadId(null);
                              } catch (error) {
                                console.error('Error updating lead stage:', error);
                                setDraggedLeadId(null);
                              }
                            }
                          }
                        }}
                      >
                        {/* Column header with animated gradient */}
                        <motion.div
                          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"
                          animate={{
                            backgroundPosition: ['0% 0%', '100% 0%'],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          style={{ backgroundSize: '200% 100%' }}
                        />
                        <div className="flex items-center justify-between mb-3 md:mb-4 mt-1">
                          <h3 className="font-semibold text-gray-900 text-sm md:text-base">{stage}</h3>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: colIndex * 0.1 + 0.2, type: "spring" }}
                          >
                            <Badge className={`${getStageColor(stage as LeadStage)} text-xs px-2 py-0.5`}>
                              {totalStageLeads}
                            </Badge>
                          </motion.div>
                        </div>
                        <div className="space-y-2 max-h-[400px] md:max-h-[600px] overflow-y-auto">
                          <AnimatePresence>
                            {stageLeads.map((lead, index) => (
                              <motion.div
                                key={lead.id}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8, x: -20 }}
                                transition={{ 
                                  delay: index * 0.05,
                                  type: "spring",
                                  stiffness: 200,
                                  damping: 20
                                }}
                                whileTap={{ 
                                  scale: 0.98, 
                                  y: -2,
                                }}
                                whileHover={{ 
                                  scale: 1.05, 
                                  y: -4,
                                  boxShadow: "0px 10px 25px rgba(99, 102, 241, 0.2)"
                                }}
                                draggable
                                onDragStart={(e) => {
                                  setDraggedLeadId(lead.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                  e.dataTransfer.setData('text/plain', lead.id);
                                  // Add visual feedback
                                  if (e.currentTarget) {
                                    e.currentTarget.style.opacity = '0.5';
                                  }
                                }}
                                onDragEnd={(e) => {
                                  setDraggedLeadId(null);
                                  if (e.currentTarget) {
                                    e.currentTarget.style.opacity = '1';
                                  }
                                }}
                                className={`bg-indigo-50 rounded-lg md:rounded-xl p-2.5 md:p-3 border border-indigo-100 active:border-indigo-300 md:hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing relative overflow-hidden group touch-manipulation ${
                                  draggedLeadId === lead.id ? 'opacity-50' : ''
                                }`}
                                onClick={(e) => {
                                  // Click on card goes to Case Manager (not detail modal)
                                  const target = e.target as HTMLElement;
                                  if (target.closest('button') || target.closest('a') || target.closest('select')) {
                                    return;
                                  }
                                  navigate(`/app/crm/case/${lead.id}`);
                                }}
                              >
                                {/* Shimmer effect on hover */}
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-active:translate-x-full md:group-hover:translate-x-full transition-transform duration-1000"
                                />
                                <div className="flex items-center gap-2 mb-1 relative z-10 flex-wrap">
                                  <p className="font-medium text-gray-900 text-sm md:text-base">{lead.client_name}</p>
                                  {isDuplicate(lead.id) && (
                                    <Badge
                                      className="bg-orange-100 text-orange-800 border-orange-200 text-xs px-1.5 py-0.5 cursor-pointer hover:bg-orange-200 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedDuplicateLead(lead);
                                        setShowDuplicateModal(true);
                                      }}
                                    >
                                      Duplicated
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mb-2 relative z-10">
                                  <Building2 className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />
                                  <p className={`text-xs truncate ${lead.project ? 'text-gray-700 font-medium' : 'text-gray-400 italic'}`}>
                                    {lead.project?.name || 'No Project'}
                                  </p>
                                </div>
                                {lead.client_phone && (
                                  <div className="flex items-center gap-1 mb-2 relative z-10 text-xs text-gray-600">
                                    <Phone className="h-3 w-3 text-gray-400" />
                                    <MaskedPhone 
                                      phone={lead.client_phone} 
                                      leadId={lead.id}
                                      isRevealed={revealedPhoneId === lead.id}
                                      onToggle={(id) => setRevealedPhoneId(id === revealedPhoneId ? null : id)}
                                    />
                                  </div>
                                )}
                                <div className="flex items-center gap-2 relative z-10">
                                  {lead.client_phone && (
                                    <motion.button
                                      whileTap={{ scale: 0.9 }}
                                      whileHover={{ scale: 1.3 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCall(lead.client_phone!);
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800 p-1.5 md:p-1 rounded-full active:bg-indigo-100 md:hover:bg-indigo-100 touch-manipulation"
                                    >
                                      <Phone className="h-3.5 w-3.5 md:h-3 md:w-3" />
                                    </motion.button>
                                  )}
                                  {lead.client_phone && (
                                    <motion.button
                                      whileTap={{ scale: 0.9 }}
                                      whileHover={{ scale: 1.3 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleWhatsApp(lead.client_phone!);
                                      }}
                                      className="text-green-600 hover:text-green-800 p-1.5 md:p-1 rounded-full active:bg-green-100 md:hover:bg-green-100 touch-manipulation"
                                    >
                                      <MessageCircle className="h-3.5 w-3.5 md:h-3 md:w-3" />
                                    </motion.button>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
          </motion.div>
        )}
      </AnimatePresence>
          </div>

          {/* Empty State */}
          {/* Pagination Controls */}
          {searchFilteredLeads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4 border border-indigo-100 shadow-lg"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-xs md:text-sm text-gray-600">
                  Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm text-gray-600">Show:</span>
                  <Select
                    value={leadsPerPage.toString()}
                    onValueChange={(value) => setLeadsPerPage(parseInt(value, 10))}
                  >
                    <SelectTrigger className="h-8 w-20 text-xs md:text-sm rounded-lg border-indigo-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="60">60</SelectItem>
                      <SelectItem value="120">120</SelectItem>
                      <SelectItem value="240">240</SelectItem>
                      <SelectItem value="480">480</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl h-9 px-3 md:px-4 border-indigo-200 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span className="text-xs md:text-sm">Previous</span>
                  </Button>
                </motion.div>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <motion.button
                        key={pageNum}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-lg text-xs md:text-sm font-medium transition-all touch-manipulation ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200'
                        }`}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  })}
                </div>

                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-xl h-9 px-3 md:px-4 border-indigo-200 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    <span className="text-xs md:text-sm">Next</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Mobile Filters Bottom Sheet - Only on Mobile */}
          <BottomSheet
            open={showFilters}
            onClose={() => setShowFilters(false)}
            title="Filters"
            footer={
              <div className="space-y-3">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="mobile"
                    onClick={() => {
                      clearFilters();
                      setShowFilters(false);
                    }}
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                )}
                <Button
                  size="mobile"
                  onClick={() => setShowFilters(false)}
                  className="w-full"
                >
                  Apply Filters
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stage</label>
                <Select
                  value={filters.stage || 'all'}
                  onValueChange={(value) => updateFilter('stage', value === 'all' ? undefined : (value as LeadStage))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {STAGES.map(stage => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                <Select
                  value={filters.project || 'all'}
                  onValueChange={(value) => updateFilter('project', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <Select
                  value={filters.platform || 'all'}
                  onValueChange={(value) => updateFilter('platform', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="snapchat">Snapchat</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </BottomSheet>

          {searchFilteredLeads.length === 0 && !loading && (
            <EmptyState
              title="No leads found"
              description={hasActiveFilters 
                ? "Try adjusting your filters to see more leads"
                : leads.length === 0
                ? "Start shopping to get your first leads"
                : "No leads match your search criteria"}
              ctaText={leads.length === 0 ? "Browse Shop" : "Clear Filters"}
              onCtaClick={leads.length === 0 
                ? () => navigate('/app/shop')
                : () => {
                    clearFilters();
                    setSearchQuery('');
                  }}
            />
          )}

          {/* Legacy Empty State - Keep for reference but hidden */}
          {false && searchFilteredLeads.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="text-center py-8 md:py-12 bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl border border-indigo-100 shadow-lg relative overflow-hidden px-4"
            >
              {/* Animated background pattern */}
              <motion.div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
                animate={{
                  backgroundPosition: ['0 0', '20px 20px'],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                }}
              >
                <Users className="h-12 w-12 md:h-16 md:w-16 text-indigo-300 mx-auto mb-3 md:mb-4" />
              </motion.div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
              <p className="text-sm md:text-base text-gray-600 mb-4">
                {searchQuery || hasActiveFilters 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first lead'}
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 relative overflow-hidden group"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <Plus className="h-4 w-4 mr-2 relative z-10" />
                  <span className="relative z-10">Add Lead</span>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Modals */}
      <AddLeadModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={async (leadData) => {
          await createLead(leadData);
          await fetchLeads();
        }}
      />
      <BulkUploadModal
        open={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onUploadComplete={async () => {
          await fetchLeads();
        }}
      />

      {editingLead && (
        <EditLeadDialog
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSave={async (leadId, updates) => {
            await updateLead(leadId, updates);
            setEditingLead(null);
            await fetchLeads();
          }}
        />
      )}

      {/* Floating Action Button for Add Lead - Mobile Only */}
      <FloatingActionButton
        onClick={() => setShowAddModal(true)}
        aria-label="Add Lead"
      />

      {/* Detail Modal for Table/Kanban views */}
      <LeadDetailModal
        lead={detailLead}
        open={!!detailLead}
        onClose={() => setDetailLead(null)}
        onUpdateStage={async (leadId, stage) => {
          await updateLead(leadId, { stage });
        }}
      />

      {/* Stage Dropdown Portal - Renders outside card container */}
      {openStageDropdown && dropdownPosition && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999] bg-white rounded-lg shadow-2xl border border-gray-200 w-[180px] max-h-[240px] overflow-hidden flex flex-col"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`
            }}
            data-stage-dropdown-menu
          >
            <div className="overflow-y-auto py-1 flex-1">
              {STAGES.map((stage) => {
                const lead = leads.find(l => l.id === openStageDropdown);
                if (!lead) return null;
                return (
                  <button
                    key={stage}
                    onClick={async () => {
                      await updateLead(lead.id, { stage: stage as LeadStage });
                      setOpenStageDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 transition-colors whitespace-nowrap ${
                      lead.stage === stage ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {stage}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Duplicate Leads Modal */}
      {selectedDuplicateLead && (
        <DuplicateLeadsModal
          isOpen={showDuplicateModal}
          onClose={() => {
            setShowDuplicateModal(false);
            setSelectedDuplicateLead(null);
          }}
          duplicates={getAllDuplicates(selectedDuplicateLead.id).filter(l => l.id !== selectedDuplicateLead.id)}
          currentLead={selectedDuplicateLead}
        />
      )}

      {/* Assign Leads Dialog */}
      {showAssignDialog && (
        <AssignLeadDialog
          leadIds={Array.from(selectedLeads)}
          onClose={() => {
            setShowAssignDialog(false);
            setSelectedLeads(new Set());
          }}
          onSuccess={async () => {
            await fetchLeads();
          }}
        />
      )}
    </div>
  );
}

export default function ModernCRM() {
  return (
    <CustomColumnsProvider>
      <ModernCRMContent />
    </CustomColumnsProvider>
  );
}
