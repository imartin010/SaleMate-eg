import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Columns3, X, GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { useCustomColumns, ColumnConfig } from '../../hooks/crm/useCustomColumns';

interface CustomColumnsManagerProps {
  onClose?: () => void;
}

export function CustomColumnsManager({ onClose }: CustomColumnsManagerProps) {
  const { columns, toggleColumn, reorderColumns, resetColumns, saveColumns, resetTempColumns } = useCustomColumns();
  const [isOpen, setIsOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    if (draggedIndex !== index) {
      reorderColumns(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    resetTempColumns(); // Reset temp columns to saved state when closing without saving
    setIsOpen(false);
    onClose?.();
  };

  const handleDone = () => {
    saveColumns(); // Save temp columns to localStorage
    setIsOpen(false);
    onClose?.();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="gap-2"
      >
        <Columns3 className="h-4 w-4" />
        Columns
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b">
                  <h3 className="text-lg font-semibold">Customize Columns</h3>
                  <button
                    onClick={handleClose}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-2">
                    {columns.map((column, index) => (
                      <motion.div
                        key={column.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          draggedIndex === index ? 'opacity-50' : 'bg-white'
                        }`}
                      >
                        <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                        <span className="flex-1 text-sm font-medium">{column.label}</span>
                        <button
                          onClick={() => toggleColumn(column.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {column.visible ? (
                            <Eye className="h-4 w-4 text-indigo-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={resetColumns}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button onClick={handleDone}>
                    Done
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

