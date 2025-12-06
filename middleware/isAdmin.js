const isAdmin = (req, res, next) => {
    try {
        // req.user is already set by verifyToken middleware
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check if user role is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // User is admin, continue
        next();
        
    } catch (error) {
        console.error('Admin verification failed:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Authorization check failed'
        });
    }
};

module.exports = isAdmin;