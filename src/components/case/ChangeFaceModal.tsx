import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { changeFace } from '../../lib/api/caseApi';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabaseClient';

interface ChangeFaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  currentAgentId?: string;
  onSuccess: () => void;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function ChangeFaceModal({ isOpen, onClose, leadId, currentAgentId, onSuccess }: ChangeFaceModalProps) {
  const { user } = useAuthStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available agents
  useEffect(() => {
    if (!isOpen) return;

    const fetchAgents = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('id, name, email, role')
          .in('role', ['user', 'manager', 'admin'])
          .order('name');

        if (fetchError) throw fetchError;
        
        // Filter out current agent
        const filtered = (data || []).filter(a => a.id !== currentAgentId);
        setAgents(filtered);
      } catch (err) {
        console.error('Failed to fetch agents:', err);
        setError('Failed to load agents');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [isOpen, currentAgentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAgent || !user?.id) return;

    try {
      setSubmitting(true);
      setError(null);

      await changeFace({
        leadId,
        toAgentId: selectedAgent,
        reason: reason || undefined,
        userId: user.id,
      });

      onSuccess();
      setSelectedAgent('');
      setReason('');
    } catch (err) {
      console.error('Face change failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to change face');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Users className="h-6 w-6 text-indigo-600" />
            Change Face
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading agents...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="agent" className="text-base font-semibold">
                Assign To <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent} required>
                <SelectTrigger className="mt-2" data-testid="agent-select">
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.email}) - {agent.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Reassignment</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you reassigning this lead? (optional)"
                rows={3}
                className="mt-2"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-3"
                >
                  <p className="text-sm text-red-800">
                    <AlertCircle className="inline h-4 w-4 mr-2" />
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedAgent || submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Reassigning...
                  </>
                ) : (
                  'Reassign Lead'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

