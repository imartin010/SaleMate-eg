import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { useLeads, Lead, LeadStage } from '../../hooks/crm/useLeads';
import { useLeadFilters } from '../../hooks/crm/useLeadFilters';
import { useLeadStats } from '../../hooks/crm/useLeadStats';
import { StatsHeader } from '../../components/crm/StatsHeader';
import { FilterBar } from '../../components/crm/FilterBar';
import { LeadTable } from '../../components/crm/LeadTable';
import { LeadCardList } from '../../components/crm/LeadCard';
import { AddLeadModal } from '../../components/crm/AddLeadModal';
import { EditLeadDialog } from '../../components/crm/EditLeadDialog';
import { AssignLeadDialog } from '../../components/crm/AssignLeadDialog';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/auth';

interface Project {
  id: string;
  name: string;
}

export default function ModernCRM() {
  const { leads, loading, error, fetchLeads, createLead, updateLead, deleteLead } = useLeads();
  const { filters, filteredLeads, updateFilter, clearFilters, hasActiveFilters } = useLeadFilters(leads);
  const stats = useLeadStats(leads);
  const { profile } = useAuthStore();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const isManager = profile?.role === 'manager';

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch projects for filters
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

  const handleUpdateStage = async (leadId: string, stage: LeadStage) => {
    try {
      await updateLead(leadId, { stage });
    } catch (err) {
      console.error('Error updating stage:', err);
    }
  };

  const handleUpdateFeedback = async (leadId: string, feedback: string) => {
    try {
      await updateLead(leadId, { feedback });
    } catch (err) {
      console.error('Error updating feedback:', err);
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
  };

  const handleSaveEdit = async (leadId: string, updates: any) => {
    await updateLead(leadId, updates);
    setEditingLead(null);
    await fetchLeads();
  };

  // Loading state
  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#257CFF] mx-auto mb-4" />
          <p className="text-gray-600">Loading your leads...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && leads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Leads</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchLeads} className="bg-[#257CFF] hover:bg-[#1a5fd4]">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-6 max-w-[1600px] mx-auto"
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">My Leads</h1>
        <p className="text-gray-600">Manage and track your sales leads</p>
      </div>

      {/* Stats Header */}
      <StatsHeader stats={stats} loading={loading} />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        onRefresh={fetchLeads}
        onAddLead={() => setShowAddModal(true)}
        projects={projects}
        loading={loading}
      />

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredLeads.length}</span> of{' '}
          <span className="font-semibold">{leads.length}</span> leads
        </p>
      </div>

      {/* Leads View (Responsive) */}
      <AnimatePresence mode="wait">
        {isMobile ? (
          <motion.div
            key="mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LeadCardList
              leads={filteredLeads}
              onUpdateStage={handleUpdateStage}
              onEdit={handleEditLead}
            />
          </motion.div>
        ) : (
          <motion.div
            key="desktop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LeadTable
              leads={filteredLeads}
              onUpdateStage={handleUpdateStage}
              onUpdateFeedback={handleUpdateFeedback}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Lead Modal */}
      <AddLeadModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={async (leadData) => {
          await createLead(leadData);
        }}
      />

      {/* Edit Lead Dialog */}
      {editingLead && (
        <EditLeadDialog
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Assign Lead Dialog (Manager only) */}
      {showAssignDialog && isManager && (
        <AssignLeadDialog
          leadIds={selectedLeads}
          onClose={() => {
            setShowAssignDialog(false);
            setSelectedLeads([]);
          }}
          onSuccess={async () => {
            await fetchLeads();
            setSelectedLeads([]);
          }}
        />
      )}
    </motion.div>
  );
}

