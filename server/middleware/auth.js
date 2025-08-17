const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access token required' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user details from database
        const [users] = await pool.execute(
            'SELECT id, username, email, role FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

// Middleware to check if user has required role
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        const userRole = req.user.role;
        
        // Convert single role to array
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Insufficient permissions' 
            });
        }

        next();
    };
};

// Specific role middlewares
const requireStudent = requireRole('student');
const requireStaff = requireRole(['staff', 'superadmin']);
const requireAdmin = requireRole('superadmin');

// Middleware to check if user owns the resource (for students)
const requireOwnership = (resourceType) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        // Staff and admin can access any resource
        if (['staff', 'superadmin'].includes(req.user.role)) {
            return next();
        }

        // Students can only access their own resources
        if (req.user.role === 'student') {
            const resourceId = req.params.id || req.params.internshipId;
            
            if (!resourceId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Resource ID required' 
                });
            }

            try {
                let query, params;
                
                if (resourceType === 'internship') {
                    query = 'SELECT id FROM internships WHERE id = ? AND student_id = ?';
                    params = [resourceId, req.user.id];
                } else if (resourceType === 'progress') {
                    query = `
                        SELECT pu.id FROM progress_updates pu 
                        JOIN internships i ON pu.internship_id = i.id 
                        WHERE pu.id = ? AND i.student_id = ?
                    `;
                    params = [resourceId, req.user.id];
                }

                const [resources] = await pool.execute(query, params);
                
                if (resources.length === 0) {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'Access denied to this resource' 
                    });
                }

                next();
            } catch (error) {
                console.error('Ownership check error:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Internal server error' 
                });
            }
        }
    };
};

module.exports = {
    authenticateToken,
    requireRole,
    requireStudent,
    requireStaff,
    requireAdmin,
    requireOwnership
};