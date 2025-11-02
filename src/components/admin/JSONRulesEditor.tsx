import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface JSONRulesEditorProps {
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  schema?: {
    key: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    label: string;
    description?: string;
    options?: string[];
  }[];
}

export const JSONRulesEditor: React.FC<JSONRulesEditorProps> = ({
  value,
  onChange,
  schema = [],
}) => {
  const [jsonString, setJsonString] = useState(JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [useVisual, setUseVisual] = useState(schema.length > 0);

  const handleJSONChange = (newJson: string) => {
    setJsonString(newJson);
    try {
      const parsed = JSON.parse(newJson);
      setError(null);
      onChange(parsed);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleVisualChange = (key: string, fieldValue: any) => {
    const updated = { ...value, [key]: fieldValue };
    onChange(updated);
    setJsonString(JSON.stringify(updated, null, 2));
  };

  if (useVisual && schema.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-brand-dark">Visibility Rules</h3>
          <button
            onClick={() => setUseVisual(false)}
            className="text-xs text-brand-primary hover:text-brand-primary-dark"
          >
            Switch to JSON editor
          </button>
        </div>
        <div className="space-y-4">
          {schema.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-brand-dark mb-1">
                {field.label}
              </label>
              {field.description && (
                <p className="text-xs text-brand-muted mb-2">{field.description}</p>
              )}
              {field.type === 'boolean' && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value[field.key] || false}
                    onChange={(e) => handleVisualChange(field.key, e.target.checked)}
                    className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-sm text-brand-dark">Enable</span>
                </label>
              )}
              {field.type === 'string' && (
                <input
                  type="text"
                  value={value[field.key] || ''}
                  onChange={(e) => handleVisualChange(field.key, e.target.value)}
                  className="input-brand w-full"
                />
              )}
              {field.type === 'number' && (
                <input
                  type="number"
                  value={value[field.key] || 0}
                  onChange={(e) => handleVisualChange(field.key, Number(e.target.value))}
                  className="input-brand w-full"
                />
              )}
              {field.type === 'array' && field.options && (
                <select
                  multiple
                  value={(value[field.key] as string[]) || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                    handleVisualChange(field.key, selected);
                  }}
                  className="input-brand w-full"
                >
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-dark">JSON Rules</h3>
        {schema.length > 0 && (
          <button
            onClick={() => setUseVisual(true)}
            className="text-xs text-brand-primary hover:text-brand-primary-dark"
          >
            Switch to visual editor
          </button>
        )}
      </div>
      <textarea
        value={jsonString}
        onChange={(e) => handleJSONChange(e.target.value)}
        className={`input-brand w-full font-mono text-sm min-h-[200px] ${
          error ? 'border-brand-error' : ''
        }`}
        placeholder='{"region": ["cairo", "alexandria"], "min_wallet_balance": 100}'
      />
      {error && (
        <div className="flex items-center gap-2 text-sm text-brand-error">
          <AlertCircle className="h-4 w-4" />
          <span>Invalid JSON: {error}</span>
        </div>
      )}
      {schema.length > 0 && (
        <div className="text-xs text-brand-muted">
          <p className="font-semibold mb-1">Available fields:</p>
          <ul className="list-disc list-inside space-y-1">
            {schema.map((field) => (
              <li key={field.key}>
                <code className="bg-brand-light px-1 rounded">{field.key}</code> ({field.type})
                {field.description && ` - ${field.description}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

