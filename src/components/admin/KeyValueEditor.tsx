import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

interface KeyValuePair {
  key: string;
  value: string;
}

interface KeyValueEditorProps {
  data: KeyValuePair[];
  onChange: (data: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  data,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  addLabel = 'Add Row',
}) => {
  const [pairs, setPairs] = useState<KeyValuePair[]>(data.length > 0 ? data : [{ key: '', value: '' }]);

  const updatePair = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...pairs];
    updated[index] = { ...updated[index], [field]: value };
    setPairs(updated);
    onChange(updated);
  };

  const addPair = () => {
    const updated = [...pairs, { key: '', value: '' }];
    setPairs(updated);
    onChange(updated);
  };

  const removePair = (index: number) => {
    const updated = pairs.filter((_, i) => i !== index);
    setPairs(updated.length > 0 ? updated : [{ key: '', value: '' }]);
    onChange(updated.length > 0 ? updated : [{ key: '', value: '' }]);
  };

  return (
    <div className="space-y-3">
      {pairs.map((pair, index) => (
        <div key={index} className="flex gap-2 items-start">
          <input
            type="text"
            placeholder={keyPlaceholder}
            value={pair.key}
            onChange={(e) => updatePair(index, 'key', e.target.value)}
            className="input-brand flex-1"
          />
          <input
            type="text"
            placeholder={valuePlaceholder}
            value={pair.value}
            onChange={(e) => updatePair(index, 'value', e.target.value)}
            className="input-brand flex-1"
          />
          <button
            onClick={() => removePair(index)}
            className="p-2 text-brand-error hover:bg-red-50 rounded-lg transition-colors"
            disabled={pairs.length === 1}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        onClick={addPair}
        className="flex items-center gap-2 text-brand-primary hover:text-brand-primary-dark transition-colors"
      >
        <Plus className="h-4 w-4" />
        {addLabel}
      </button>
    </div>
  );
};

