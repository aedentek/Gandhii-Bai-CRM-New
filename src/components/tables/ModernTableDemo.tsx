import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Activity,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Users,
  Hash
} from 'lucide-react';
import '../../../styles/modern-tables.css';

interface TableData {
  id: number;
  first: string;
  last: string;
  handle: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  lastActive: string;
}

interface ModernTableDemoProps {
  title?: string;
  subtitle?: string;
}

const ModernTableDemo: React.FC<ModernTableDemoProps> = ({
  title = "Modern Table Design",
  subtitle = "Professional data presentation with enhanced user experience"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Sample data
  const sampleData: TableData[] = [
    {
      id: 1,
      first: "Mark",
      last: "Otto",
      handle: "@mdo",
      email: "mark.otto@example.com",
      phone: "+1 (555) 123-4567",
      role: "Admin",
      status: "active",
      joinDate: "2024-01-15",
      lastActive: "2025-08-11"
    },
    {
      id: 2,
      first: "Jacob",
      last: "Thornton",
      handle: "@fat",
      email: "jacob.thornton@example.com",
      phone: "+1 (555) 234-5678",
      role: "Manager",
      status: "active",
      joinDate: "2024-02-20",
      lastActive: "2025-08-10"
    },
    {
      id: 3,
      first: "Larry",
      last: "the Bird",
      handle: "@twitter",
      email: "larry.bird@example.com",
      phone: "+1 (555) 345-6789",
      role: "User",
      status: "inactive",
      joinDate: "2024-03-10",
      lastActive: "2025-08-05"
    },
    {
      id: 4,
      first: "Sarah",
      last: "Johnson",
      handle: "@sjohnson",
      email: "sarah.johnson@example.com",
      phone: "+1 (555) 456-7890",
      role: "Doctor",
      status: "active",
      joinDate: "2024-04-05",
      lastActive: "2025-08-11"
    },
    {
      id: 5,
      first: "Mike",
      last: "Wilson",
      handle: "@mwilson",
      email: "mike.wilson@example.com",
      phone: "+1 (555) 567-8901",
      role: "Nurse",
      status: "pending",
      joinDate: "2024-05-12",
      lastActive: "2025-08-09"
    }
  ];

  // Filter and search data
  const filteredData = useMemo(() => {
    return sampleData.filter(item => {
      const matchesSearch = 
        item.first.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.last.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleAction = (action: string, id: number) => {
    setLoading(true);
    setTimeout(() => {
      console.log(`${action} action for ID: ${id}`);
      setLoading(false);
      alert(`${action} action performed for user ${id}`);
    }, 1000);
  };

  const toggleRowSelection = (id: number) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`modern-table-badge ${status}`}>
        <Activity className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleColors: { [key: string]: string } = {
      'Admin': 'danger',
      'Manager': 'primary',
      'Doctor': 'active',
      'Nurse': 'pending',
      'User': 'inactive'
    };
    
    return (
      <span className={`modern-table-badge ${roleColors[role] || 'inactive'}`}>
        <User className="w-3 h-3" />
        {role}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="modern-table-container">
        <div className="modern-table-loading">
          <div className="modern-table-loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      <div className="modern-table-container">
        {/* Toolbar */}
        <div className="modern-table-toolbar">
          <div className="modern-table-search">
            <Search className="modern-table-search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="modern-table-filters">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            
            <button className="modern-table-action-btn secondary">
              <Filter className="w-4 h-4" />
            </button>
            
            <button className="modern-table-action-btn view">
              <Download className="w-4 h-4" />
            </button>
            
            <button className="modern-table-action-btn approve">
              <Upload className="w-4 h-4" />
            </button>
            
            <button className="modern-table-action-btn edit">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <table className="modern-table">
          <thead className="modern-table-header">
            <tr className="modern-table-header-row">
              <th className="modern-table-header-cell">
                <div className="header-content">
                  <Hash className="header-icon" />
                  <span>#</span>
                </div>
              </th>
              <th className="modern-table-header-cell">
                <div className="header-content">
                  <User className="header-icon" />
                  <span>First Name</span>
                </div>
              </th>
              <th className="modern-table-header-cell">
                <div className="header-content">
                  <User className="header-icon" />
                  <span>Last Name</span>
                </div>
              </th>
              <th className="modern-table-header-cell">
                <div className="header-content">
                  <Mail className="header-icon" />
                  <span>Handle</span>
                </div>
              </th>
              <th className="modern-table-header-cell">
                <div className="header-content">
                  <Mail className="header-icon" />
                  <span>Email</span>
                </div>
              </th>
              <th className="modern-table-header-cell">
                <div className="header-content">
                  <Phone className="header-icon" />
                  <span>Phone</span>
                </div>
              </th>
              <th className="modern-table-header-cell">
                <div className="header-content">
                  <Users className="header-icon" />
                  <span>Role</span>
                </div>
              </th>
              <th className="modern-table-header-cell">
                <div className="header-content">
                  <Activity className="header-icon" />
                  <span>Status</span>
                </div>
              </th>
              <th className="modern-table-header-cell">
                <div className="header-content">
                  <MoreHorizontal className="header-icon" />
                  <span>Actions</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="modern-table-body">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="modern-table-cell">
                  <div className="modern-table-empty">
                    <Users className="modern-table-empty-icon" />
                    <div className="modern-table-empty-title">No users found</div>
                    <div className="modern-table-empty-description">
                      Try adjusting your search criteria or add new users
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr 
                  key={row.id} 
                  className={`modern-table-row ${selectedRows.includes(row.id) ? 'selected' : ''}`}
                  onClick={() => toggleRowSelection(row.id)}
                >
                  <td className="modern-table-cell">
                    <span className="modern-table-row-number">
                      {startIndex + index + 1}
                    </span>
                  </td>
                  <td className="modern-table-cell">
                    <div className="font-semibold text-gray-900">{row.first}</div>
                  </td>
                  <td className="modern-table-cell">
                    <div className="font-semibold text-gray-900">{row.last}</div>
                  </td>
                  <td className="modern-table-cell">
                    <div className="text-blue-600 font-medium">{row.handle}</div>
                  </td>
                  <td className="modern-table-cell">
                    <div className="text-gray-700">{row.email}</div>
                  </td>
                  <td className="modern-table-cell">
                    <div className="text-gray-700">{row.phone}</div>
                  </td>
                  <td className="modern-table-cell">
                    {getRoleBadge(row.role)}
                  </td>
                  <td className="modern-table-cell">
                    {getStatusBadge(row.status)}
                  </td>
                  <td className="modern-table-cell">
                    <div className="modern-table-actions">
                      <button 
                        className="modern-table-action-btn view"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction('View', row.id);
                        }}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="modern-table-action-btn edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction('Edit', row.id);
                        }}
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        className="modern-table-action-btn approve"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction('Approve', row.id);
                        }}
                        title="Approve User"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        className="modern-table-action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction('Delete', row.id);
                        }}
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="modern-table-pagination">
            <div className="modern-table-pagination-info">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
            </div>
            <div className="modern-table-pagination-controls">
              <button
                className="modern-table-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`modern-table-pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              
              <button
                className="modern-table-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernTableDemo;
