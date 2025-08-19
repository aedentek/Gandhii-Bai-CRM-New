import React, { useState } from 'react';

const AddGroceryModal = ({ isOpen, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [price, setPrice] = useState('');
    const [stockQuantity, setStockQuantity] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ name, categoryId, supplierId, price, stockQuantity });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
                <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center justify-center h-8 w-8 bg-blue-100 rounded-full">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600"><path d="M10 4v12m6-6H4" /></svg>
                    </span>
                    <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6">Enter the details for the new grocery product</p>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Product Name *</label>
                            <input type="text" required placeholder="Enter product name" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                            <select required value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                                <option value="">Select category</option>
                                {/* Populate options dynamically */}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Supplier *</label>
                            <select required value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                                <option value="">Select supplier</option>
                                {/* Populate options dynamically */}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Price *</label>
                            <input type="number" required placeholder="Enter price" value={price} onChange={e => setPrice(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Stock Quantity *</label>
                            <input type="number" required placeholder="Enter quantity" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6 justify-end">
                        <button type="button" onClick={onClose} className="min-w-[100px] border rounded-lg px-4 py-2 bg-white text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="min-w-[120px] bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold shadow hover:bg-blue-700">Add Product</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddGroceryModal;
