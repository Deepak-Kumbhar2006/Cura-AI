const ROLE_PERMISSIONS = {
  admin: ['read', 'write', 'delete', 'export', 'manage_users', 'manage_thresholds', 'view_audit', 'system_config'],
  doctor: ['read', 'write', 'export', 'manage_thresholds', 'view_audit'],
  analyst: ['read', 'export', 'view_audit'],
  patient: ['read'],
};

function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRole = req.user.role;
    const userPerms = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS['patient'];
    const hasAll = permissions.every((p) => userPerms.includes(p));

    if (!hasAll) {
      return res.status(403).json({
        message: 'Forbidden: insufficient permissions',
        required: permissions,
        role: userRole,
      });
    }

    req.permissions = userPerms;
    next();
  };
}

function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['patient'];
}

module.exports = { requirePermission, getRolePermissions, ROLE_PERMISSIONS };
