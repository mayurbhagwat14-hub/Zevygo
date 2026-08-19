import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiSliders, FiGrid } from "react-icons/fi";
import { toast } from "react-hot-toast";
import CardShell from "../components/CardShell";
import Modal from "../components/Modal";
import VendorFormBuilderModal from "../components/VendorFormBuilderModal";
import { categoryService } from "../../../../../services/catalogService";
import { z } from "zod";

const categorySchema = z.object({
  title: z.string().min(2, "Title is required"),
  homeBadge: z.string().optional(),
  description: z.string().optional()
});

const VendorServicesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [formBuilderCategory, setFormBuilderCategory] = useState(null);

  // Category Edit State
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ title: "", homeBadge: "", description: "" });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setFetching(true);
      const catRes = await categoryService.getAll({ status: 'active' });

      if (catRes.success) {
        setCategories((catRes.categories || []).filter(c => c.status !== 'deleted' && c.status !== 'inactive'));
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load service categories");
    } finally {
      setFetching(false);
    }
  };

  // Save Category
  const handleSaveCategory = async () => {
    const result = categorySchema.safeParse(categoryForm);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    try {
      setLoading(true);
      if (editingCategory) {
        const res = await categoryService.update(editingCategory.id || editingCategory._id, result.data);
        if (res.success) {
          toast.success("Category updated successfully");
          loadCategories();
          resetCategoryForm();
        }
      } else {
        const res = await categoryService.create(result.data);
        if (res.success) {
          toast.success("Category created successfully");
          loadCategories();
          resetCategoryForm();
        }
      }
    } catch (error) {
      console.error("Save category error:", error);
      toast.error(error.response?.data?.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category? It will remove it from vendor signup and user app.")) return;
    try {
      setLoading(true);
      const res = await categoryService.delete(id);
      if (res.success) {
        toast.success("Category deleted");
        loadCategories();
      }
    } catch (error) {
      toast.error("Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({ title: "", homeBadge: "", description: "" });
    setIsCategoryModalOpen(false);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      title: cat.title || "",
      homeBadge: cat.homeBadge || "",
      description: cat.description || ""
    });
    setIsCategoryModalOpen(true);
  };

  const filteredCategories = categories.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Vendor Services & Form Builder</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage platform service categories and configure dynamic vendor signup form fields</p>
        </div>

        <button
          onClick={() => { resetCategoryForm(); setIsCategoryModalOpen(true); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
        >
          <FiPlus /> Create New Category
        </button>
      </div>

      {/* CATEGORIES & VENDOR FORM SCHEMAS */}
      <CardShell icon={FiGrid} title={`Service Categories (${categories.length})`}>
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-4">
          <div className="relative w-full sm:w-80">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search category title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {fetching ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold">Loading service categories...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No categories found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((c) => {
              const schemaCount = (c.vendorFormSchema || []).length;
              return (
                <div key={c.id || c._id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
                        {c.slug || "category"}
                      </span>
                      {c.homeBadge && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          {c.homeBadge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black text-slate-900">{c.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description || "No description provided."}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setFormBuilderCategory(c)}
                      className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-indigo-100"
                    >
                      <FiSliders className="w-3.5 h-3.5" /> Vendor Form ({schemaCount} fields)
                    </button>

                    <button onClick={() => openEditCategory(c)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" title="Edit Category">
                      <FiEdit2 className="w-4 h-4" />
                    </button>

                    <button onClick={() => handleDeleteCategory(c.id || c._id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" title="Delete Category">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardShell>

      {/* CREATE / EDIT CATEGORY MODAL */}
      <Modal isOpen={isCategoryModalOpen} onClose={resetCategoryForm} title={editingCategory ? "Edit Category" : "Create New Category"}>
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Category Title *</label>
            <input
              type="text"
              value={categoryForm.title}
              onChange={(e) => setCategoryForm(p => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Electrician, Car Wash, Salon"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Badge (Optional)</label>
            <input
              type="text"
              value={categoryForm.homeBadge}
              onChange={(e) => setCategoryForm(p => ({ ...p, homeBadge: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Popular, Subscription, 24/7 Available"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              value={categoryForm.description}
              onChange={(e) => setCategoryForm(p => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              rows={3}
              placeholder="Brief summary of services included"
            />
          </div>

          <button
            onClick={handleSaveCategory}
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Category"}
          </button>
        </div>
      </Modal>

      {/* VENDOR FORM BUILDER MODAL */}
      <VendorFormBuilderModal
        isOpen={Boolean(formBuilderCategory)}
        onClose={() => setFormBuilderCategory(null)}
        category={formBuilderCategory}
        onSaveSuccess={(updatedCat) => {
          setCategories(prev => prev.map(c => (c.id === updatedCat.id || c._id === updatedCat.id) ? { ...c, vendorFormSchema: updatedCat.vendorFormSchema } : c));
        }}
      />
    </div>
  );
};

export default VendorServicesPage;
