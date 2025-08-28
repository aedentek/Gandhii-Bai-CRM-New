import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import '../../styles/modern-forms.css';
import '../../styles/modern-tables.css';
import '../../styles/modern-settings.css';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Palette, 
  Layout, 
  Server, 
  Shield,
  Database,
  Zap,
  Monitor,
  Mail,
  Bell,
  FileText,
  Upload,
  Download,
  Eye,
  Edit,
  Save,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { settingsAPI } from '@/utils/api';
import usePageTitle from '@/hooks/usePageTitle';

interface Setting {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  file_path?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const Settings: React.FC = () => {
  // Set page title
  usePageTitle();

  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  const settingCategories = [
    { id: 'all', label: 'All Settings', icon: <SettingsIcon className="h-4 w-4" />, count: 0 },
    { id: 'website', label: 'Website', icon: <Globe className="h-4 w-4" />, count: 0 },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="h-4 w-4" />, count: 0 },
    { id: 'sidebar', label: 'Layout', icon: <Layout className="h-4 w-4" />, count: 0 },
    { id: 'system', label: 'System', icon: <Server className="h-4 w-4" />, count: 0 },
    { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" />, count: 0 },
    { id: 'database', label: 'Database', icon: <Database className="h-4 w-4" />, count: 0 },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" />, count: 0 }
  ];

  const getSettingIcon = (key: string) => {
    if (key.includes('website') || key.includes('company')) return <Globe className="h-4 w-4" />;
    if (key.includes('theme') || key.includes('color')) return <Palette className="h-4 w-4" />;
    if (key.includes('sidebar') || key.includes('layout')) return <Layout className="h-4 w-4" />;
    if (key.includes('backup') || key.includes('version')) return <Server className="h-4 w-4" />;
    if (key.includes('security') || key.includes('auth')) return <Shield className="h-4 w-4" />;
    if (key.includes('database') || key.includes('db')) return <Database className="h-4 w-4" />;
    if (key.includes('notification') || key.includes('mail')) return <Bell className="h-4 w-4" />;
    return <SettingsIcon className="h-4 w-4" />;
  };

  const getSettingStatus = (setting: Setting) => {
    if (!setting.setting_value) return { status: 'empty', color: 'gray', label: 'Not Set' };
    if (setting.setting_key.includes('backup') && new Date(setting.updated_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      return { status: 'warning', color: 'orange', label: 'Outdated' };
    }
    return { status: 'active', color: 'green', label: 'Active' };
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log('🔗 Loading settings using unified API...');
      
      const data = await settingsAPI.getAll();
      console.log('✅ Settings loaded:', data);
      
      setSettings(data);
      
      toast({
        title: "Settings Loaded",
        description: `Successfully loaded ${data.length} settings from Hostinger database`,
      });
      
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      toast({
        title: "Error",
        description: `Failed to load settings: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (setting: Setting) => {
    if (setting.setting_type === 'file' && setting.file_path) {
      return `${setting.setting_value} (${setting.file_path})`;
    }
    return setting.setting_value || '(empty)';
  };

  const getCategorySettings = (category: string) => {
    if (category === 'all') return settings;
    
    const categoryMap: { [key: string]: string[] } = {
      website: ['website_title', 'website_favicon', 'company_name', 'company_logo'],
      appearance: ['theme_mode', 'primary_color', 'accent_color', 'border_radius', 'font_family'],
      sidebar: ['sidebar_title', 'sidebar_logo', 'sidebar_width', 'sidebar_position'],
      system: ['app_version', 'backup_frequency', 'last_backup_date', 'system_timezone'],
      security: ['session_timeout', 'password_policy', 'two_factor_auth', 'login_attempts'],
      database: ['db_host', 'db_port', 'db_name', 'connection_pool'],
      notifications: ['email_notifications', 'push_notifications', 'sms_notifications']
    };
    
    return settings.filter(s => 
      categoryMap[category]?.some(key => s.setting_key.includes(key)) ||
      s.setting_key.toLowerCase().includes(category)
    );
  };

  const filteredSettings = getCategorySettings(selectedCategory).filter(setting =>
    setting.setting_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setting.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="modern-container">
      {/* Header Section */}
      <div className="modern-page-header">
        <div className="modern-page-header-content">
          <div className="modern-page-title-section">
            <div className="modern-page-icon">
              <SettingsIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="modern-page-title">System Settings</h1>
              <p className="modern-page-subtitle">
                Configure and manage your application settings
              </p>
            </div>
          </div>
          
          <div className="modern-page-actions">
            <Button className="modern-btn modern-btn-secondary">
              <Upload className="h-4 w-4 mr-2" />
              Import Settings
            </Button>
            <Button className="modern-btn modern-btn-secondary">
              <Download className="h-4 w-4 mr-2" />
              Export Settings
            </Button>
            <Button className="global-btn">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="modern-stats-grid">
        <div className="modern-stat-card">
          <div className="modern-stat-icon modern-stat-icon-blue">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div className="modern-stat-content">
            <div className="modern-stat-value">{settings.length}</div>
            <div className="modern-stat-label">Total Settings</div>
          </div>
        </div>
        
        <div className="modern-stat-card">
          <div className="modern-stat-icon modern-stat-icon-green">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="modern-stat-content">
            <div className="modern-stat-value">
              {settings.filter(s => s.setting_value).length}
            </div>
            <div className="modern-stat-label">Configured</div>
          </div>
        </div>
        
        <div className="modern-stat-card">
          <div className="modern-stat-icon modern-stat-icon-orange">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="modern-stat-content">
            <div className="modern-stat-value">
              {settings.filter(s => !s.setting_value).length}
            </div>
            <div className="modern-stat-label">Pending</div>
          </div>
        </div>
        
        <div className="modern-stat-card">
          <div className="modern-stat-icon modern-stat-icon-purple">
            <Activity className="h-5 w-5" />
          </div>
          <div className="modern-stat-content">
            <div className="modern-stat-value">
              {new Date().toLocaleDateString()}
            </div>
            <div className="modern-stat-label">Last Updated</div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="modern-controls-section">
        <div className="modern-search-container">
          <div className="modern-search-wrapper">
            <Search className="modern-search-icon" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="modern-search-input"
            />
          </div>
          <Button className="modern-btn modern-btn-outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button className="modern-btn modern-btn-outline" onClick={loadSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="modern-tabs-container">
          {settingCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`modern-tab ${selectedCategory === category.id ? 'modern-tab-active' : ''}`}
            >
              {category.icon}
              <span>{category.label}</span>
              <Badge className="modern-badge modern-badge-secondary">
                {getCategorySettings(category.id).length}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="modern-loading-container">
          <div className="modern-loading-spinner"></div>
          <p className="modern-loading-text">Loading settings...</p>
        </div>
      ) : (
        <div className="modern-content-grid">
          {filteredSettings.length === 0 ? (
            <div className="modern-empty-state">
              <div className="modern-empty-icon">
                <SettingsIcon className="h-12 w-12" />
              </div>
              <h3 className="modern-empty-title">No Settings Found</h3>
              <p className="modern-empty-description">
                {searchTerm ? 
                  `No settings match "${searchTerm}"` : 
                  `No settings available in ${selectedCategory} category`
                }
              </p>
            </div>
          ) : (
            <div className="modern-settings-grid">
              {filteredSettings.map(setting => {
                const status = getSettingStatus(setting);
                return (
                  <div key={setting.id} className="modern-setting-card">
                    <div className="modern-setting-header">
                      <div className="modern-setting-info">
                        <div className="modern-setting-icon">
                          {getSettingIcon(setting.setting_key)}
                        </div>
                        <div>
                          <h3 className="modern-setting-title">
                            {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h3>
                          <p className="modern-setting-description">
                            {setting.description || 'No description available'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="modern-setting-status">
                        <Badge className={`modern-badge modern-badge-${status.color}`}>
                          {status.label}
                        </Badge>
                        <Button className="modern-btn modern-btn-ghost modern-btn-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="modern-setting-content">
                      <div className="modern-setting-value">
                        <label className="modern-setting-label">Current Value:</label>
                        <div className="modern-setting-display">
                          {setting.setting_key.includes('color') && setting.setting_value ? (
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: setting.setting_value }}
                              />
                              <span>{setting.setting_value}</span>
                            </div>
                          ) : (
                            <span className={!setting.setting_value ? 'text-gray-400 italic' : ''}>
                              {formatValue(setting)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="modern-setting-meta">
                        <div className="modern-setting-meta-item">
                          <Clock className="h-3 w-3" />
                          <span>Updated: {new Date(setting.updated_at).toLocaleDateString()}</span>
                        </div>
                        <div className="modern-setting-meta-item">
                          <FileText className="h-3 w-3" />
                          <span>Type: {setting.setting_type}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="modern-setting-actions">
                      <Button className="modern-btn modern-btn-ghost modern-btn-sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button className="global-btn modern-btn-sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
