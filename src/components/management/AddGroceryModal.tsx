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
        <div className="modal">
            <div className="modal-content">
                <h2>Add Grocery</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        Name:
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </label>
                    <label>
                        Category:
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            required
                        >
                            <option value="">Select Category</option>
                            {/* Populate options dynamically */}
                        </select>
                    </label>
                    <label>
                        Supplier:
                        <select
                            value={supplierId}
                            onChange={(e) => setSupplierId(e.target.value)}
                            required
                        >
                            <option value="">Select Supplier</option>
                            {/* Populate options dynamically */}
                        </select>
                    </label>
                    <label>
                        Price:
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </label>
                    <label>
                        Stock Quantity:
                        <input
                            type="number"
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(e.target.value)}
                            required
                        />
                    </label>
                    <button type="submit">Add</button>
                    <button type="button" onClick={onClose}>Cancel</button>
                </form>
            </div>
        </div>
    );
};

export default AddGroceryModal;
