import React, { useState, useEffect } from 'react';
import { Settings, ToggleLeft, ToggleRight, Save, Plus, Trash2 } from 'lucide-react';
import { KeyValueEditor } from '../../../components/admin/KeyValueEditor';
import { getAllFeatureFlags, toggleFeatureFlag, createFeatureFlag, FeatureFlag } from '../../../lib/data/featureFlags';
import { getAllSettings, setSetting, SystemSetting } from '../../../lib/data/settings';
import { useAuthStore } from '../../../store/auth';

export default function PlatformSettings() {
  const { profile } = useAuthStore();
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'features' | 'settings'>('features');
  const [newSettingKey, setNewSettingKey] = useState('');
  const [newSettingValue, setNewSettingValue] = useState('');
  const [newSettingDesc, setNewSettingDesc] = useState('');
  const [showAddSetting, setShowAddSetting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [flags, configs] = await Promise.all([
        getAllFeatureFlags(),
        getAllSettings(),
      ]);
      setFeatureFlags(flags);
      setSettings(configs);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (key: string, enabled: boolean) => {
    try {
      await toggleFeatureFlag(key, !enabled, profile?.id);
      await loadData();
    } catch (error) {
      console.error('Error toggling feature:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      // Settings are saved individually via KeyValueEditor onChange
      await loadData();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSetting = async () => {
    if (!newSettingKey || !newSettingValue) return;
    try {
      await setSetting(newSettingKey, newSettingValue, newSettingDesc || undefined, profile?.id);
      setNewSettingKey('');
      setNewSettingValue('');
      setNewSettingDesc('');
      setShowAddSetting(false);
      await loadData();
    } catch (error) {
      console.error('Error adding setting:', error);
    }
  };

  const handleUpdateSettings = async (updates: Array<{ key: string; value: string }>) => {
    try {
      for (const update of updates) {
        await setSetting(update.key, update.value, undefined, profile?.id);
      }
      await loadData();
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const settingsKeyValue = settings.map((s) => ({
    key: s.key,
    value: String(s.value || ''),
  }));

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-600 mt-1">Manage feature flags and system configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('features')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'features'
              ? 'text-purple-600 border-b-2 border-brand-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Feature Flags
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'settings'
              ? 'text-purple-600 border-b-2 border-brand-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          System Settings
        </button>
      </div>

      {/* Feature Flags Tab */}
      {activeTab === 'features' && (
        <div className="admin-card p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Feature Flags</h2>
          {featureFlags.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No feature flags configured</div>
          ) : (
            <div className="space-y-3">
              {featureFlags.map((flag) => (
                <div
                  key={flag.key}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{flag.key}</div>
                    {flag.description && (
                      <div className="text-sm text-gray-600 mt-1">{flag.description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleFeature(flag.key, flag.enabled)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                      flag.enabled
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {flag.enabled ? (
                      <>
                        <ToggleRight className="h-5 w-5" />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-5 w-5" />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'settings' && (
        <div className="admin-card p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
            <button
              onClick={() => setShowAddSetting(!showAddSetting)}
              className="admin-btn admin-btn-secondary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Setting
            </button>
          </div>

          {showAddSetting && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 mb-4">
              <input
                type="text"
                placeholder="Setting key"
                value={newSettingKey}
                onChange={(e) => setNewSettingKey(e.target.value)}
                className="admin-input w-full"
              />
              <input
                type="text"
                placeholder="Setting value"
                value={newSettingValue}
                onChange={(e) => setNewSettingValue(e.target.value)}
                className="admin-input w-full"
              />
              <textarea
                placeholder="Description (optional)"
                value={newSettingDesc}
                onChange={(e) => setNewSettingDesc(e.target.value)}
                className="admin-input w-full"
                rows={2}
              />
              <div className="flex gap-2">
                <button onClick={handleAddSetting} className="admin-btn admin-btn-primary flex-1">
                  Add Setting
                </button>
                <button
                  onClick={() => {
                    setShowAddSetting(false);
                    setNewSettingKey('');
                    setNewSettingValue('');
                    setNewSettingDesc('');
                  }}
                  className="admin-btn admin-btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {settings.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No settings configured</div>
          ) : (
            <div>
              <KeyValueEditor
                data={settingsKeyValue}
                onChange={(pairs) => {
                  handleUpdateSettings(pairs);
                }}
                keyPlaceholder="Setting key"
                valuePlaceholder="Setting value"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

