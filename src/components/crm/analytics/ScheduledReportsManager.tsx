import React, { useState } from 'react';
import { useScheduledReports, CreateScheduledReportInput } from '../../../hooks/crm/useScheduledReports';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Loader2, Plus, Trash2, Mail, Edit2, Send } from 'lucide-react';
import { format } from 'date-fns';

export function ScheduledReportsManager() {
  const {
    reports,
    loading,
    error,
    createScheduledReport,
    updateScheduledReport,
    deleteScheduledReport,
    sendTestReport,
  } = useScheduledReports();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateScheduledReportInput>({
    report_type: 'daily',
    email_recipients: [],
    is_active: true,
  });
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddEmail = () => {
    if (emailInput.trim() && !formData.email_recipients.includes(emailInput.trim())) {
      setFormData({
        ...formData,
        email_recipients: [...formData.email_recipients, emailInput.trim()],
      });
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setFormData({
      ...formData,
      email_recipients: formData.email_recipients.filter((e) => e !== email),
    });
  };

  const handleCreate = async () => {
    if (formData.email_recipients.length === 0) {
      alert('Please add at least one email recipient');
      return;
    }

    try {
      setIsSubmitting(true);
      await createScheduledReport(formData);
      setShowCreateForm(false);
      setFormData({
        report_type: 'daily',
        email_recipients: [],
        is_active: true,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      setIsSubmitting(true);
      await updateScheduledReport(id, formData);
      setEditingId(null);
      setFormData({
        report_type: 'daily',
        email_recipients: [],
        is_active: true,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) return;

    try {
      await deleteScheduledReport(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete report');
    }
  };

  const handleSendTest = async (id: string) => {
    try {
      await sendTestReport(id);
      alert('Test report sent successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send test report');
    }
  };

  const startEdit = (report: typeof reports[0]) => {
    setEditingId(report.id);
    setFormData({
      report_type: report.report_type,
      email_recipients: report.email_recipients,
      is_active: report.is_active,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Scheduled Reports</h3>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Report
        </Button>
      </div>

      {showCreateForm && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <Select
              value={formData.report_type}
              onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                setFormData({ ...formData, report_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Recipients
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
              />
              <Button onClick={handleAddEmail} variant="outline" size="sm">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.email_recipients.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-md text-sm"
                >
                  {email}
                  <button
                    onClick={() => handleRemoveEmail(email)}
                    className="hover:text-indigo-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Report'
              )}
            </Button>
            <Button
              onClick={() => {
                setShowCreateForm(false);
                setFormData({
                  report_type: 'daily',
                  email_recipients: [],
                  is_active: true,
                });
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No scheduled reports. Create one to get started.
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
            >
              {editingId === report.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Type
                    </label>
                    <Select
                      value={formData.report_type}
                      onValueChange={(value: 'daily' | 'weekly' | 'monthly') =>
                        setFormData({ ...formData, report_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Recipients
                    </label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddEmail();
                          }
                        }}
                      />
                      <Button onClick={handleAddEmail} variant="outline" size="sm">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.email_recipients.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-md text-sm"
                        >
                          {email}
                          <button
                            onClick={() => handleRemoveEmail(email)}
                            className="hover:text-indigo-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdate(report.id)}
                      disabled={isSubmitting}
                      size="sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingId(null);
                        setFormData({
                          report_type: 'daily',
                          email_recipients: [],
                          is_active: true,
                        });
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-800 capitalize">
                          {report.report_type} Report
                        </h4>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            report.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {report.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{report.email_recipients.join(', ')}</span>
                        </div>
                        {report.last_sent_at && (
                          <div>
                            Last sent: {format(new Date(report.last_sent_at), 'PPp')}
                          </div>
                        )}
                        {report.next_send_at && (
                          <div>
                            Next send: {format(new Date(report.next_send_at), 'PPp')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSendTest(report.id)}
                        variant="outline"
                        size="sm"
                        title="Send test report"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => startEdit(report)}
                        variant="outline"
                        size="sm"
                        title="Edit report"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(report.id)}
                        variant="outline"
                        size="sm"
                        title="Delete report"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

