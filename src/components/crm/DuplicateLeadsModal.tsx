import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, Building2, Calendar, User } from 'lucide-react';
import { Lead } from '../../hooks/crm/useLeads';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { MaskedPhone } from './MaskedPhone';
import { getStageColor } from '../../pages/CRM/ModernCRM';

interface DuplicateLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: Lead[];
  currentLead: Lead;
}

export function DuplicateLeadsModal({
  isOpen,
  onClose,
  duplicates,
  currentLead,
}: DuplicateLeadsModalProps) {
  if (!isOpen) return null;

  const allLeads = [currentLead, ...duplicates];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Duplicate Leads</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Found {allLeads.length} duplicate lead{allLeads.length > 1 ? 's' : ''} with the same phone number
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allLeads.map((lead, index) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border rounded-xl p-4 ${
                        lead.id === currentLead.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {lead.id === currentLead.id && (
                        <Badge className="mb-2 bg-indigo-600 text-white">
                          Current Lead
                        </Badge>
                      )}
                      
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {lead.client_name}
                          </h3>
                          {lead.company_name && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Building2 className="h-3 w-3" />
                              {lead.company_name}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Phone:</span>
                            <span className="font-medium text-gray-900">{lead.client_phone}</span>
                          </div>
                          
                          {lead.client_phone2 && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Phone 2:</span>
                              <span className="font-medium text-gray-900">{lead.client_phone2}</span>
                            </div>
                          )}
                          
                          {lead.client_phone3 && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Phone 3:</span>
                              <span className="font-medium text-gray-900">{lead.client_phone3}</span>
                            </div>
                          )}

                          {lead.client_email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Email:</span>
                              <span className="font-medium text-gray-900">{lead.client_email}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <Badge className={getStageColor(lead.stage)}>
                            {lead.stage}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(lead.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

