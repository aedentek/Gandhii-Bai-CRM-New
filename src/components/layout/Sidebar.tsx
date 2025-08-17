import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  List, 
  Calendar, 
  History,
  PhoneCall,
  UserCog, 
  Stethoscope, 
  ShoppingCart, 
  Pill, 
  Truck, 
  ClipboardCheck, 
  Settings, 
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Plus,
  Package,
  CreditCard,
  FolderOpen,
  ShoppingBag,
  Trash2,
  Shield,
  FileText,
  TestTube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logo from '@/assets/healthcare-logo.png';

interface SidebarProps {
  user: { name: string; role: string };
  onLogout: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, onCollapsedChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const location = useLocation();

  // State for custom settings
  const [customLogo, setCustomLogo] = useState<string>('');
  const [sidebarIcon, setSidebarIcon] = useState<string>('🏥');
  const [sidebarIconFile, setSidebarIconFile] = useState<string>('');
  const [appName, setAppName] = useState<string>('Gandhi Bai CRM');

  // Function to handle collapse toggle
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Auto-expand active menu on page load
  useEffect(() => {
    const activeItem = navigationItems.find(item => 
      item.submenu?.some(subItem => isActiveRoute(subItem.href))
    );
    if (activeItem && !openMenu) {
      setOpenMenu(activeItem.title);
    }
  }, [location.pathname]);

  const handleCollapseToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapsedChange?.(newCollapsedState);
  };

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      const savedLogo = localStorage.getItem('customLogo');
      if (savedLogo) {
        setCustomLogo(savedLogo);
      }

      const savedAppSettings = localStorage.getItem('appSettings');
      if (savedAppSettings) {
        const appSettings = JSON.parse(savedAppSettings);
        setSidebarIcon(appSettings.sidebarIcon || '🏥');
        setAppName(appSettings.appName || 'Gandhi Bai CRM');
      }

      const savedSidebarIconFile = localStorage.getItem('sidebarIconFile');
      if (savedSidebarIconFile) {
        setSidebarIconFile(savedSidebarIconFile);
      }
    };

    loadSettings();

    // Listen for storage changes to update in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'customLogo' || e.key === 'appSettings' || e.key === 'sidebarIconFile') {
        loadSettings();
      }
    };

    // Listen for custom event when settings are saved
    const handleSettingsUpdate = () => {
      loadSettings();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []);

  const navigationItems = [
    
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Patient Management',
      icon: Users,
      submenu: [
        // { title: 'Add Role', href: '/management/user-role/add', icon: Plus },
        { title: 'Add Patient', href: '/patients/add', icon: UserPlus },
        { title: 'Patient List', href: '/patients/list', icon: List },
        { title: 'Test Report Amount', href: '/patients/test-report-amount', icon: TestTube },
        { title: 'Patient Attendance', href: '/patients/attendance', icon: Calendar },
        { title: 'Patient Medical Record', href: '/patients/medical-records', icon: FileText },
        { title: 'Patient History', href: '/patients/history', icon: History },
        { title: 'Call Records', href: '/patients/call-records', icon: PhoneCall },
        { title: 'Payment Fees', href: '/patients/payment-fees', icon: CreditCard },
        { title: 'Deleted Patients', href: '/patients/deleted', icon: Trash2 },
      ]
    },
    {
      title: 'Staff Management',
      icon: UserCog,
      submenu: [
        { title: 'Add Staff', href: '/management/add-staff', icon: Plus },
        { title: 'Staff Category', href: '/management/staff-category', icon: FolderOpen },
        { title: 'Staff List', href: '/management/staff', icon: UserCog },
        { title: 'Staff Attendance', href: '/management/attendance', icon: ClipboardCheck },
        { title: 'Salary Payment', href: '/management/salary-payment', icon: CreditCard },
        { title: 'Deleted Staff', href: '/management/deleted-staff', icon: Trash2 },
      ]
    },
    {
      title: 'Doctors Management',
      icon: Stethoscope,
      submenu: [
        { title: 'Add Doctor', href: '/management/add-doctor', icon: Plus },
        { title: 'Doctor Role', href: '/management/doctor-category', icon: FolderOpen },
        { title: 'Doctor List', href: '/management/doctors', icon: Stethoscope },
            { title: 'Doctor Attendance', href: '/management/doctor-attendance', icon: Calendar },
            { title: 'Doctor Salary', href: '/management/doctor-salary', icon: CreditCard },
        { title: 'Deleted Doctors', href: '/management/deleted-doctors', icon: Trash2 },
      ]
    },
    {
      title: 'Medicine',
      icon: Pill,
      submenu: [
        { title: 'Add Medicine', href: '/medicine/add', icon: Plus },
        { title: 'Categories', href: '/medicine/categories', icon: FolderOpen },
        { title: 'Suppliers', href: '/medicine/suppliers', icon: Truck },
        { title: 'Stock List', href: '/medicine/stock', icon: Package },
        { title: 'Accounts', href: '/medicine/accounts', icon: CreditCard },
      ]
    },
    {
      title: 'Grocery',
      icon: ShoppingCart,
      submenu: [
        { title: 'Add Grocery', href: '/grocery', icon: Plus },
        { title: 'Categories', href: '/grocery/categories', icon: FolderOpen },
        { title: 'Suppliers', href: '/grocery/suppliers', icon: Truck },
        { title: 'Stock List', href: '/grocery/stock', icon: Package },
        { title: 'Accounts', href: '/grocery/accounts', icon: CreditCard },
      ]
    },
    {
      title: 'General Purchase',
      icon: ShoppingBag,
      submenu: [
        { title: 'Add Products', href: '/general/add', icon: Plus },
        { title: 'Category', href: '/general/categories', icon: FolderOpen },
        { title: 'Suppliers', href: '/general/suppliers', icon: Truck },
        { title: 'Stock List', href: '/general/stock', icon: Package },
        { title: 'Accounts', href: '/general/accounts', icon: CreditCard },
      ]
    },
    // Attendance moved under Staff Management
    {
      title: 'User Role',
      icon: UserCog,
      submenu: [
        { title: 'Add Role', href: '/management/user-role/add', icon: Plus },
        { title: 'Role Management', href: '/management/user-role/roles', icon: Shield },
        { title: 'Role Access', href: '/management/user-role/access', icon: Shield },
      ]
    },
    {
      title: 'Leads',
      icon: FolderOpen,
      submenu: [
        { title: 'Add Category', href: '/leads/add-category', icon: Plus },
        { title: 'Leads List', href: '/leads/list', icon: Users },
      ]
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  const isActiveRoute = (href: string) => location.pathname === href;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Use custom sidebar icon file, or custom icon text, or fallback to default logo */}
            {sidebarIconFile ? (
              <img 
                src={sidebarIconFile} 
                alt="Custom Sidebar Icon" 
                className="w-8 h-8 object-contain"
                data-logo-target
              />
            ) : customLogo ? (
              <img 
                src={customLogo} 
                alt="Custom Logo" 
                className="w-8 h-8 object-contain"
                data-logo-target
              />
            ) : sidebarIcon && sidebarIcon !== '🏥' ? (
              <span className="text-2xl">{sidebarIcon}</span>
            ) : (
              <img src={logo} alt="HealthCare Logo" className="w-8 h-8" />
            )}
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-lg">{appName}</h2>
                <p className="text-xs opacity-80">{user.role}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCollapseToggle}
            className="hidden lg:flex text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item, index) => (
          <div key={index}>
            {item.submenu ? (
              <div>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 group",
                    openMenu === item.title && "bg-sidebar-accent/50 font-medium",
                    isCollapsed && "justify-center"
                  )}
                  onClick={() => !isCollapsed && 
                    setOpenMenu(openMenu === item.title ? null : item.title)
                  }
                >
                  <item.icon className={cn("w-4 h-4", !isCollapsed && "mr-3")} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        openMenu === item.title ? "rotate-180" : ""
                      )} />
                    </>
                  )}
                </Button>
                {openMenu === item.title && !isCollapsed && (
                  <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    "max-h-screen opacity-100"
                  )}>
                    <div className="ml-4 mt-2 space-y-1 border-l border-sidebar-border pl-3">
                      {item.submenu.map((subItem, subIndex) => (
                        <Link key={subIndex} to={subItem.href}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200",
                              isActiveRoute(subItem.href) && "bg-sidebar-accent font-medium shadow-sm",
                              "relative group"
                            )}
                          >
                            <subItem.icon className="w-3 h-3 mr-2" />
                            {subItem.title}
                            {/* Active indicator */}
                            {isActiveRoute(subItem.href) && (
                              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-4 bg-sidebar-accent-foreground rounded-l-full" />
                            )}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 group relative",
                    isActiveRoute(item.href) && "bg-sidebar-accent font-medium shadow-sm",
                    isCollapsed && "justify-center"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", !isCollapsed && "mr-3")} />
                  {!isCollapsed && item.title}
                  {/* Active indicator */}
                  {isActiveRoute(item.href) && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-sidebar-accent-foreground rounded-l-full" />
                  )}
                </Button>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={onLogout}
          className={cn(
            "w-full justify-start text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className={cn("w-4 h-4", !isCollapsed && "mr-3")} />
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-card shadow-md"
        >
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-screen z-40 transition-all duration-300",
        "lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;