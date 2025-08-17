const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireStudent, requireStaff, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_PATH || './uploads');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 16 * 1024 * 1024 // 16MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image, PDF, and document files are allowed!'));
        }
    }
});

// @route   POST /api/internships
// @desc    Create a new internship application
// @access  Private (Students only)
router.post('/', [
    authenticateToken,
    requireStudent,
    upload.single('proof_file'),
    body('company_name', 'Company name is required').notEmpty(),
    body('position', 'Position is required').notEmpty(),
    body('start_date', 'Start date is required').isISO8601(),
    body('end_date', 'End date is required').isISO8601()
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { company_name, position, start_date, end_date } = req.body;
        const proof_file = req.file ? req.file.filename : null;

        // Validate dates
        if (new Date(start_date) >= new Date(end_date)) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }

        // Create internship
        const [result] = await pool.execute(
            'INSERT INTO internships (student_id, company_name, position, start_date, end_date, proof_file) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, company_name, position, start_date, end_date, proof_file]
        );

        // Get the created internship
        const [internships] = await pool.execute(
            `SELECT i.*, u.username as student_name 
             FROM internships i 
             JOIN users u ON i.student_id = u.id 
             WHERE i.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Internship application submitted successfully',
            internship: internships[0]
        });

    } catch (error) {
        console.error('Create internship error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/internships
// @desc    Get internships (filtered by user role)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        let query, params;

        if (req.user.role === 'student') {
            // Students see only their own internships
            query = `
                SELECT i.*, u.username as student_name, 
                       approver.username as approved_by_name
                FROM internships i 
                JOIN users u ON i.student_id = u.id 
                LEFT JOIN users approver ON i.approved_by = approver.id
                WHERE i.student_id = ?
                ORDER BY i.created_at DESC
            `;
            params = [req.user.id];
        } else {
            // Staff and admin see all internships
            query = `
                SELECT i.*, u.username as student_name, 
                       approver.username as approved_by_name
                FROM internships i 
                JOIN users u ON i.student_id = u.id 
                LEFT JOIN users approver ON i.approved_by = approver.id
                ORDER BY i.created_at DESC
            `;
            params = [];
        }

        const [internships] = await pool.execute(query, params);

        res.json({
            success: true,
            internships
        });

    } catch (error) {
        console.error('Get internships error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/internships/:id
// @desc    Get internship by ID
// @access  Private
router.get('/:id', [
    authenticateToken,
    requireOwnership('internship')
], async (req, res) => {
    try {
        const [internships] = await pool.execute(
            `SELECT i.*, u.username as student_name, 
                    approver.username as approved_by_name
             FROM internships i 
             JOIN users u ON i.student_id = u.id 
             LEFT JOIN users approver ON i.approved_by = approver.id
             WHERE i.id = ?`,
            [req.params.id]
        );

        if (internships.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
        }

        res.json({
            success: true,
            internship: internships[0]
        });

    } catch (error) {
        console.error('Get internship error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/internships/:id/approve
// @desc    Approve internship application
// @access  Private (Staff/Admin only)
router.put('/:id/approve', [
    authenticateToken,
    requireStaff
], async (req, res) => {
    try {
        const [result] = await pool.execute(
            'UPDATE internships SET status = ?, approved_by = ? WHERE id = ? AND status = ?',
            ['approved', req.user.id, req.params.id, 'pending']
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found or already processed'
            });
        }

        res.json({
            success: true,
            message: 'Internship approved successfully'
        });

    } catch (error) {
        console.error('Approve internship error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/internships/:id/reject
// @desc    Reject internship application
// @access  Private (Staff/Admin only)
router.put('/:id/reject', [
    authenticateToken,
    requireStaff
], async (req, res) => {
    try {
        const [result] = await pool.execute(
            'UPDATE internships SET status = ?, approved_by = ? WHERE id = ? AND status = ?',
            ['rejected', req.user.id, req.params.id, 'pending']
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found or already processed'
            });
        }

        res.json({
            success: true,
            message: 'Internship rejected successfully'
        });

    } catch (error) {
        console.error('Reject internship error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/internships/:id/complete
// @desc    Mark internship as completed
// @access  Private (Student only)
router.put('/:id/complete', [
    authenticateToken,
    requireStudent,
    requireOwnership('internship'),
    upload.single('certificate_file')
], async (req, res) => {
    try {
        const certificate_file = req.file ? req.file.filename : null;

        const [result] = await pool.execute(
            'UPDATE internships SET status = ?, certificate_file = ? WHERE id = ? AND student_id = ? AND status = ?',
            ['completed', certificate_file, req.params.id, req.user.id, 'approved']
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found or not approved'
            });
        }

        res.json({
            success: true,
            message: 'Internship marked as completed'
        });

    } catch (error) {
        console.error('Complete internship error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/internships/:id
// @desc    Delete internship (only if pending)
// @access  Private (Student only)
router.delete('/:id', [
    authenticateToken,
    requireStudent,
    requireOwnership('internship')
], async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM internships WHERE id = ? AND student_id = ? AND status = ?',
            [req.params.id, req.user.id, 'pending']
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found or cannot be deleted'
            });
        }

        res.json({
            success: true,
            message: 'Internship deleted successfully'
        });

    } catch (error) {
        console.error('Delete internship error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;