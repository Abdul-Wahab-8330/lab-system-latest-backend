const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        // 1. Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // 2. Extract token (remove "Bearer " prefix)
        const token = authHeader.split(' ')[1];

        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Attach user info to request
        req.user = decoded; // { id, role }
        
        // 5. Continue to next middleware/controller
        next();
        
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

module.exports = verifyToken;