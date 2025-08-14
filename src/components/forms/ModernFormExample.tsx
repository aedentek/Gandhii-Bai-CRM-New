import React, { useState } from 'react';
import '../styles/modern-forms.css';

interface ModernFormExampleProps {
  title?: string;
  subtitle?: string;
  onSubmit?: (data: any) => void;
}

const ModernFormExample: React.FC<ModernFormExampleProps> = ({
  title = "Modern Form",
  subtitle = "Experience the modern form design",
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    description: '',
    status: 'active',
    terms: false
  });

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev: any) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.terms) {
      newErrors.terms = 'You must accept the terms';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onSubmit) {
        onSubmit(formData);
      }
      
      console.log('Form submitted:', formData);
      alert('Form submitted successfully!');
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-form-container">
      <div className="max-w-2xl mx-auto">
        <div className="modern-form-card">
          {/* Form Header */}
          <div className="modern-form-header">
            <h1 className="modern-form-title">{title}</h1>
            <p className="modern-form-subtitle">{subtitle}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Personal Information Section */}
            <div className="modern-form-section">
              <h2 className="modern-form-section-title">Personal Information</h2>
              
              <div className="modern-form-group-row">
                <div className="modern-form-group">
                  <label htmlFor="name" className="modern-form-label required">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={`modern-form-input ${errors.name ? 'error' : ''}`}
                  />
                  {errors.name && (
                    <div className="modern-form-error">
                      <span>⚠️</span>
                      {errors.name}
                    </div>
                  )}
                </div>

                <div className="modern-form-group">
                  <label htmlFor="email" className="modern-form-label required">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className={`modern-form-input ${errors.email ? 'error' : ''}`}
                  />
                  {errors.email && (
                    <div className="modern-form-error">
                      <span>⚠️</span>
                      {errors.email}
                    </div>
                  )}
                </div>
              </div>

              <div className="modern-form-group-row">
                <div className="modern-form-group">
                  <label htmlFor="phone" className="modern-form-label required">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className={`modern-form-input ${errors.phone ? 'error' : ''}`}
                  />
                  {errors.phone && (
                    <div className="modern-form-error">
                      <span>⚠️</span>
                      {errors.phone}
                    </div>
                  )}
                </div>

                <div className="modern-form-group">
                  <label htmlFor="category" className="modern-form-label required">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`modern-form-input modern-form-select ${errors.category ? 'error' : ''}`}
                  >
                    <option value="">Select category</option>
                    <option value="staff">Staff</option>
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="admin">Admin</option>
                  </select>
                  {errors.category && (
                    <div className="modern-form-error">
                      <span>⚠️</span>
                      {errors.category}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="modern-form-section">
              <h2 className="modern-form-section-title">Additional Information</h2>
              
              <div className="modern-form-group">
                <label htmlFor="description" className="modern-form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter description or notes"
                  className="modern-form-input modern-form-textarea"
                  rows={4}
                />
              </div>

              <div className="modern-form-group">
                <label htmlFor="status" className="modern-form-label">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="modern-form-input modern-form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="modern-form-checkbox-group">
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleInputChange}
                  className="modern-form-checkbox"
                />
                <label htmlFor="terms" className="modern-form-checkbox-label">
                  I agree to the terms and conditions
                </label>
              </div>
              {errors.terms && (
                <div className="modern-form-error">
                  <span>⚠️</span>
                  {errors.terms}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="modern-form-btn-group">
              <button
                type="button"
                className="modern-form-btn-secondary"
                onClick={() => {
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    category: '',
                    description: '',
                    status: 'active',
                    terms: false
                  });
                  setErrors({});
                }}
              >
                Reset
              </button>
              <button
                type="submit"
                className={`modern-form-btn-primary ${loading ? 'modern-form-loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Form'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModernFormExample;
