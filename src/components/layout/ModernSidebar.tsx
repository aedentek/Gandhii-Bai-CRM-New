import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
  DollarSign,
  IndianRupee,
  Shield,
  FileText,
  Home,
  File,
  MessageSquare,
  Bell,
  MapPin,
  BarChart3,
  TestTube
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUserPermissions, hasPagePermission, filterMenuItemsByPermissions } from '@/utils/permissions';

interface ModernSidebarProps {
  user: { name: string; role: string; email?: string; permissions?: string[] };
  onLogout: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const ModernSidebar: React.FC<ModernSidebarProps> = ({ user, onLogout, onCollapsedChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const location = useLocation();

  // Get user permissions on component mount
  useEffect(() => {
    const permissionData = getUserPermissions();
    const permissions = user.permissions || permissionData.permissions;
    setUserPermissions(permissions);
  }, [user]);

  // Function to handle collapse toggle
  const handleCollapseToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapsedChange?.(newCollapsedState);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      badge: null
    },
    {
      title: 'Patient List',
      icon: Users,
      submenu: [
        { title: 'Add Patient', href: '/patients/add', icon: UserPlus },
        { title: 'Patient List', href: '/patients/list', icon: List },
        { title: 'Attendance', href: '/patients/attendance', icon: Calendar },
        { title: 'Medical Record', href: '/patients/medical-records', icon: FileText },
        { title: 'Patient History', href: '/patients/history', icon: History },
        { title: 'Call Records', href: '/patients/call-records', icon: PhoneCall },
        { title: 'Test Report Amount', href: '/patients/test-report-amount', icon: IndianRupee },
        { title: 'Payment Fees', href: '/patients/payment-fees', icon: CreditCard },
        { title: 'Deleted Patients', href: '/patients/deleted', icon: Trash2 },
      ]
    },
    {
      title: 'Staff List',
      icon: UserCog,
      submenu: [
        { title: 'Add Staff', href: '/management/add-staff', icon: Plus },
        { title: 'Staff Category', href: '/management/staff-category', icon: FolderOpen },
        { title: 'Staff List', href: '/management/staff', icon: UserCog },
        { title: 'Staff Attendance', href: '/management/attendance', icon: ClipboardCheck },
        { title: 'Staff Advance', href: '/management/staff-advance', icon: IndianRupee },
        { title: 'Salary Payment', href: '/management/salary-payment', icon: CreditCard },
        { title: 'Deleted Staff', href: '/management/deleted-staff', icon: Trash2 },
      ]
    },
    {
      title: 'Doctors List',
      icon: Stethoscope,
      submenu: [
        { title: 'Add Doctor', href: '/management/add-doctor', icon: Plus },
        { title: 'Doctor Role', href: '/management/doctor-category', icon: FolderOpen },
        { title: 'Doctor List', href: '/management/doctors', icon: Stethoscope },
        { title: 'Doctor Attendance', href: '/management/doctor-attendance', icon: Calendar },
        { title: 'Doctor Advance', href: '/management/doctor-advance', icon: IndianRupee },
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
    {
      title: 'User Role',
      icon: Shield,
      submenu: [
  { title: 'Administration', href: '/administration', icon: Users },
        { title: 'Add Role', href: '/management/user-role/add', icon: Plus },
  { title: 'Role Management', href: '/management/user-role/roles', icon: Shield },
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
      icon: Settings,
      href: '/settings',
      badge: null
    }
  ];

  // Filter menu items based on user permissions
  const filteredMenuItems = filterMenuItemsByPermissions(menuItems, userPermissions, user.role);

  const isActive = (href: string) => location.pathname === href;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* User Profile Section */}
      <div className="p-6 border-b border-slate-200">
        <div className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "space-x-3"
        )}>
          <Avatar className="h-12 w-12 ring-2 ring-white shadow-lg">
            <AvatarImage src="/api/placeholder/48/48" />
            <AvatarFallback className="bg-blue-600 text-white text-lg font-semibold">
              {user.role.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-lg truncate">
                {user.role}
              </h3>
              <p className="text-blue-100 text-sm truncate">
                {user.email || user.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-hide">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const active = item.href ? isActive(item.href) : false;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSubmenuOpen = openMenu === item.title;
            
            return (
              <li key={item.title}>
                {/* Main menu item */}
                {hasSubmenu ? (
                  <button
                    onClick={() => setOpenMenu(isSubmenuOpen ? null : item.title)}
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative w-full text-left",
                      isSubmenuOpen 
                        ? "bg-white/20 text-white shadow-lg" 
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-colors",
                      isSubmenuOpen ? "text-white" : "text-blue-200 group-hover:text-white"
                    )} strokeWidth={1.5} />
                    
                    {!isCollapsed && (
                      <>
                        <span className="font-medium flex-1 ml-3">{item.title}</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isSubmenuOpen ? "rotate-180" : ""
                        )} />
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                      active 
                        ? "bg-white/20 text-white shadow-lg" 
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-colors",
                      active ? "text-white" : "text-blue-200 group-hover:text-white"
                    )} strokeWidth={1.5} />
                    
                    {!isCollapsed && (
                      <>
                        <span className="font-medium flex-1 ml-3">{item.title}</span>
                        {item.badge && (
                          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                        {/* Invisible placeholder for chevron to match dropdown items */}
                        <div className="h-4 w-4" />
                      </>
                    )}
                    
                    {/* Active indicator */}
                    {active && (
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-l-full" />
                    )}
                  </Link>
                )}

                {/* Submenu with smooth animation */}
                {hasSubmenu && !isCollapsed && (
                  <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isSubmenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <ul className="mt-2 ml-6 space-y-1 border-l border-white/20 pl-4 pb-2">
                      {item.submenu.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const subActive = isActive(subItem.href);
                        
                        return (
                          <li key={subItem.href}>
                            <Link
                              to={subItem.href}
                              className={cn(
                                "flex items-center px-3 py-2 rounded-lg transition-all duration-200 group text-sm relative",
                                subActive 
                                  ? "bg-white/15 text-white shadow-md" 
                                  : "text-blue-100 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              <SubIcon className={cn(
                                "h-4 w-4 transition-colors",
                                subActive ? "text-white" : "text-blue-200 group-hover:text-white"
                              )} />
                              <span className="font-medium ml-3">{subItem.title}</span>
                              
                              {/* Active indicator for submenu */}
                              {subActive && (
                                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-4 bg-white rounded-l-full" />
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Button */}
      <div className="p-4 border-t border-slate-200">
        <Button
          onClick={handleCollapseToggle}
          variant="ghost"
          size="sm"
          className={cn(
            "text-blue-100 hover:text-white hover:bg-white/10",
            isCollapsed ? "w-12 h-10 p-0 justify-center" : "w-full"
          )}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {!isCollapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>

      {/* Logout Button */}
      <div className="p-4">
        <Button
          onClick={onLogout}
          variant="ghost"
          className={cn(
            "text-blue-100 hover:text-white hover:bg-red-500/20",
            isCollapsed ? "w-12 h-10 p-0 justify-center" : "w-full justify-start"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        variant="outline"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-lg"
      >
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl z-30 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={cn(
        "lg:hidden fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl z-50 transition-transform duration-300 w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>
    </>
  );
};

export default ModernSidebar;
