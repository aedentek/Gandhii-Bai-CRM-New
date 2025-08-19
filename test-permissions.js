// Direct JavaScript test for permission system
console.log('🧪 Testing Permission System');

// Step 1: Set up a limited user
const limitedUser = {
    name: 'Administration Test User',
    role: 'Administration', 
    email: 'admin-test@healthcare.com',
    permissions: ['Dashboard', 'Patient List'] // Only these two permissions
};

localStorage.setItem('healthcare_user', JSON.stringify(limitedUser));
console.log('✅ Limited user set:', limitedUser);

// Step 2: Test admin user for comparison  
const adminUser = {
    name: 'Super Admin',
    role: 'Admin', 
    email: 'superadmin@healthcare.com',
    permissions: ['Dashboard'] // Admin should bypass this anyway
};

// Step 3: Test permission checking functions
function testPermissions() {
    // Import the permission functions (this would work in the actual app)
    const PAGE_PERMISSIONS_MAP = {
        '/dashboard': 'Dashboard',
        '/patients/list': 'Patient List',
        '/patients/add': 'Add Patient',
        '/management/staff': 'Staff List',
        '/settings': 'Settings'
    };

    function hasPagePermission(userPermissions, pageHref, userRole) {
        // Admin users have access to all pages by default
        if (userRole === 'admin' || userRole === 'Admin') {
            return true;
        }
        
        const requiredPermission = PAGE_PERMISSIONS_MAP[pageHref];
        if (!requiredPermission) {
            return true;
        }
        
        return userPermissions.includes(requiredPermission);
    }

    console.log('\n🧪 Testing Limited User (Administration role):');
    const testPages = ['/dashboard', '/patients/list', '/patients/add', '/management/staff', '/settings'];
    
    testPages.forEach(page => {
        const hasAccess = hasPagePermission(limitedUser.permissions, page, limitedUser.role);
        console.log(`${page}: ${hasAccess ? '✅ ALLOWED' : '❌ DENIED'}`);
    });

    console.log('\n🧪 Testing Admin User (Admin role):');
    testPages.forEach(page => {
        const hasAccess = hasPagePermission(adminUser.permissions, page, adminUser.role);
        console.log(`${page}: ${hasAccess ? '✅ ALLOWED' : '❌ DENIED'}`);
    });
}

testPermissions();

console.log('\n🎯 Expected Results:');
console.log('Administration user: Only Dashboard and Patient List should be ALLOWED');
console.log('Admin user: ALL pages should be ALLOWED (admin override)');
console.log('\n💡 Now refresh the main app to see sidebar filtering in action!');
