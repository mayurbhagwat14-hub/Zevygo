import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSave, FiX, FiCheck, FiSliders, FiList, FiEdit2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { categoryService } from '../../../../../services/catalogService';

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Number Input' },
  { value: 'select', label: 'Single Select Dropdown' },
  { value: 'multiselect', label: 'Multi-Select Buttons' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'toggle', label: 'Toggle Switch (Yes/No)' },
  { value: 'date', label: 'Date Picker' },
  { value: 'time', label: 'Time Picker' },
  { value: 'file', label: 'Document / File Upload' },
];

const VendorFormBuilderModal = ({ isOpen, onClose, category, onSaveSuccess }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // New field form state
  const [newField, setNewField] = useState({
    key: '',
    label: '',
    type: 'text',
    optionsText: '',
    required: false,
    helpText: '',
  });

  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (category && isOpen) {
      loadCategorySchema();
    }
  }, [category, isOpen]);

  const loadCategorySchema = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getFormSchema(category.id || category._id);
      if (res.success && res.vendorFormSchema) {
        setFields(res.vendorFormSchema);
      } else {
        setFields(category.vendorFormSchema || []);
      }
    } catch (err) {
      console.error('Error loading vendor schema:', err);
      setFields(category.vendorFormSchema || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = () => {
    if (!newField.label.trim()) {
      toast.error('Please enter a field label');
      return;
    }

    const key = newField.key.trim() || newField.label.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const options = (newField.type === 'select' || newField.type === 'multiselect')
      ? newField.optionsText.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const fieldObj = {
      key,
      label: newField.label.trim(),
      type: newField.type,
      options,
      required: Boolean(newField.required),
      helpText: newField.helpText.trim() || null,
      order: fields.length + 1
    };

    if (editingIndex !== null) {
      const updated = [...fields];
      updated[editingIndex] = fieldObj;
      setFields(updated);
      setEditingIndex(null);
      toast.success('Field updated locally');
    } else {
      setFields([...fields, fieldObj]);
      toast.success('Field added locally');
    }

    setNewField({ key: '', label: '', type: 'text', optionsText: '', required: false, helpText: '' });
  };

  const handleEditField = (index) => {
    const f = fields[index];
    setNewField({
      key: f.key,
      label: f.label,
      type: f.type,
      optionsText: (f.options || []).join(', '),
      required: f.required || false,
      helpText: f.helpText || '',
    });
    setEditingIndex(index);
  };

  const handleDeleteField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleSaveSchema = async () => {
    try {
      setSaving(true);
      const res = await categoryService.updateFormSchema(category.id || category._id, {
        vendorFormSchema: fields
      });

      if (res.success) {
        toast.success(`Vendor form for "${category.title}" updated successfully!`);
        if (onSaveSuccess) onSaveSuccess(res.category);
        onClose();
      }
    } catch (err) {
      console.error('Save vendor schema error:', err);
      toast.error(err.response?.data?.message || 'Failed to save form schema');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <FiSliders />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Vendor Form Builder: {category.title}</h2>
              <p className="text-xs text-slate-500">Configure dynamic specs & fields required from vendors during signup</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Add / Edit Form Card */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
            <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider">
              {editingIndex !== null ? 'Edit Field' : 'Add New Custom Field'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Field Label *</label>
                <input type="text" value={newField.label} onChange={e => setNewField(p => ({ ...p, label: e.target.value }))}
                  placeholder="e.g. License Number, Driving Experience" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Field Key (System ID)</label>
                <input type="text" value={newField.key} onChange={e => setNewField(p => ({ ...p, key: e.target.value }))}
                  placeholder="Auto-generated if blank" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Input Type</label>
                <select value={newField.type} onChange={e => setNewField(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold">
                  {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Help Text / Hint</label>
                <input type="text" value={newField.helpText} onChange={e => setNewField(p => ({ ...p, helpText: e.target.value }))}
                  placeholder="e.g. 12 digits without spaces" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {(newField.type === 'select' || newField.type === 'multiselect') && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Options (Comma separated)</label>
                <input type="text" value={newField.optionsText} onChange={e => setNewField(p => ({ ...p, optionsText: e.target.value }))}
                  placeholder="Option 1, Option 2, Option 3" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={newField.required} onChange={e => setNewField(p => ({ ...p, required: e.target.checked }))} className="w-4 h-4 text-blue-600 rounded" />
                <span>Is Required Field?</span>
              </label>

              <div className="flex items-center gap-2">
                {editingIndex !== null && (
                  <button type="button" onClick={() => { setEditingIndex(null); setNewField({ key: '', label: '', type: 'text', optionsText: '', required: false, helpText: '' }); }}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
                )}
                <button type="button" onClick={handleAddField} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-blue-700">
                  <FiPlus /> {editingIndex !== null ? 'Update Field' : 'Add Field'}
                </button>
              </div>
            </div>
          </div>

          {/* List of Existing Fields */}
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Current Form Fields ({fields.length})</h3>
            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Loading schema...</p>
            ) : fields.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center border border-dashed rounded-xl">No custom fields added yet for this category.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {fields.map((f, i) => (
                  <div key={f.key || i} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-blue-200 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{f.label}</span>
                        {f.required && <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Required</span>}
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">{f.type}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Key: <code className="text-slate-600">{f.key}</code> {f.options?.length > 0 && `• Options: ${f.options.join(', ')}`}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEditField(i)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><FiEdit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteField(i)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl">Cancel</button>
          <button onClick={handleSaveSchema} disabled={saving} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md">
            <FiSave /> {saving ? 'Saving...' : 'Save Schema to DB'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorFormBuilderModal;
