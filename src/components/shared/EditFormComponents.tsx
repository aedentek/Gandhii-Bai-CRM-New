import React from 'react';

interface EditFormSectionProps {
  title: string;
  icon: React.ReactNode;
  iconColorClass?: string;
  iconBgColorClass?: string;
  children: React.ReactNode;
  className?: string;
}

const EditFormSection: React.FC<EditFormSectionProps> = ({
  title,
  icon,
  iconColorClass = "text-blue-600",
  iconBgColorClass = "bg-blue-100",
  children,
  className = ""
}) => {
  return (
    <div className={`editpopup form form-section space-y-4 ${className}`}>
      <h3 className="editpopup form form-section-title text-lg font-semibold text-gray-900 flex items-center gap-2">
        <div className={`editpopup form form-section-icon w-6 h-6 ${iconBgColorClass} rounded-lg flex items-center justify-center`}>
          <div className={`h-4 w-4 ${iconColorClass}`}>
            {icon}
          </div>
        </div>
        {title}
      </h3>
      <div className="editpopup form form-grid grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
};

interface EditFormFieldProps {
  children: React.ReactNode;
  className?: string;
}

const EditFormField: React.FC<EditFormFieldProps> = ({ children, className = "" }) => {
  return (
    <div className={`editpopup form form-field space-y-2 ${className}`}>
      {children}
    </div>
  );
};

export { EditFormSection, EditFormField };
