const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireStudent, requireStaff, requireOwnership } = require('../middleware/auth');
const mlUtils = require('../utils/mlUtils');

const router = express.Router();

// @route   POST /api/progress
// @desc    Submit a progress update
// @access  Private (Students only)
router.post('/', [
    authenticateToken,
    requireStudent,
    body('internship_id', 'Internship ID is required').isInt(),
    body('week_number', 'Week number is required').isInt({ min: 1, max: 52 }),
    body('description', 'Description is required').notEmpty().isLength({ min: 10 })
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

        const { internship_id, week_number, description } = req.body;

        // Check if internship exists and belongs to student
        const [internships] = await pool.execute(
            'SELECT id, status FROM internships WHERE id = ? AND student_id = ?',
            [internship_id, req.user.id]
        );

        if (internships.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
        }

        if (internships[0].status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Can only submit progress for approved internships'
            });
        }

        // Check if progress update for this week already exists
        const [existingProgress] = await pool.execute(
            'SELECT id FROM progress_updates WHERE internship_id = ? AND week_number = ?',
            [internship_id, week_number]
        );

        if (existingProgress.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Progress update for this week already exists'
            });
        }

        // Analyze progress with ML
        const insights = mlUtils.getProgressInsights(description);

        // Create progress update
        const [result] = await pool.execute(
            `INSERT INTO progress_updates 
             (internship_id, week_number, description, sentiment_score, quality_classification, keywords) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                internship_id,
                week_number,
                description,
                insights.sentimentScore,
                insights.quality,
                JSON.stringify(insights.keywords)
            ]
        );

        // Get the created progress update
        const [progressUpdates] = await pool.execute(
            `SELECT pu.*, i.company_name, i.position 
             FROM progress_updates pu 
             JOIN internships i ON pu.internship_id = i.id 
             WHERE pu.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Progress update submitted successfully',
            progress: {
                ...progressUpdates[0],
                insights
            }
        });

    } catch (error) {
        console.error('Submit progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/progress
// @desc    Get progress updates (filtered by user role)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        let query, params;

        if (req.user.role === 'student') {
            // Students see only their own progress updates
            query = `
                SELECT pu.*, i.company_name, i.position, u.username as student_name,
                       evaluator.username as evaluated_by_name
                FROM progress_updates pu 
                JOIN internships i ON pu.internship_id = i.id 
                JOIN users u ON i.student_id = u.id
                LEFT JOIN users evaluator ON pu.evaluated_by = evaluator.id
                WHERE i.student_id = ?
                ORDER BY pu.submitted_at DESC
            `;
            params = [req.user.id];
        } else {
            // Staff and admin see all progress updates
            query = `
                SELECT pu.*, i.company_name, i.position, u.username as student_name,
                       evaluator.username as evaluated_by_name
                FROM progress_updates pu 
                JOIN internships i ON pu.internship_id = i.id 
                JOIN users u ON i.student_id = u.id
                LEFT JOIN users evaluator ON pu.evaluated_by = evaluator.id
                ORDER BY pu.submitted_at DESC
            `;
            params = [];
        }

        const [progressUpdates] = await pool.execute(query, params);

        // Add insights for each progress update
        const progressWithInsights = progressUpdates.map(progress => ({
            ...progress,
            keywords: progress.keywords ? JSON.parse(progress.keywords) : [],
            insights: mlUtils.getProgressInsights(progress.description)
        }));

        res.json({
            success: true,
            progress: progressWithInsights
        });

    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/progress/internship/:internshipId
// @desc    Get progress updates for a specific internship
// @access  Private
router.get('/internship/:internshipId', [
    authenticateToken,
    requireOwnership('internship')
], async (req, res) => {
    try {
        const [progressUpdates] = await pool.execute(
            `SELECT pu.*, i.company_name, i.position, u.username as student_name,
                    evaluator.username as evaluated_by_name
             FROM progress_updates pu 
             JOIN internships i ON pu.internship_id = i.id 
             JOIN users u ON i.student_id = u.id
             LEFT JOIN users evaluator ON pu.evaluated_by = evaluator.id
             WHERE pu.internship_id = ?
             ORDER BY pu.week_number ASC`,
            [req.params.internshipId]
        );

        // Add insights for each progress update
        const progressWithInsights = progressUpdates.map(progress => ({
            ...progress,
            keywords: progress.keywords ? JSON.parse(progress.keywords) : [],
            insights: mlUtils.getProgressInsights(progress.description)
        }));

        res.json({
            success: true,
            progress: progressWithInsights
        });

    } catch (error) {
        console.error('Get internship progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/progress/:id
// @desc    Get specific progress update
// @access  Private
router.get('/:id', [
    authenticateToken,
    requireOwnership('progress')
], async (req, res) => {
    try {
        const [progressUpdates] = await pool.execute(
            `SELECT pu.*, i.company_name, i.position, u.username as student_name,
                    evaluator.username as evaluated_by_name
             FROM progress_updates pu 
             JOIN internships i ON pu.internship_id = i.id 
             JOIN users u ON i.student_id = u.id
             LEFT JOIN users evaluator ON pu.evaluated_by = evaluator.id
             WHERE pu.id = ?`,
            [req.params.id]
        );

        if (progressUpdates.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Progress update not found'
            });
        }

        const progress = progressUpdates[0];
        const insights = mlUtils.getProgressInsights(progress.description);

        res.json({
            success: true,
            progress: {
                ...progress,
                keywords: progress.keywords ? JSON.parse(progress.keywords) : [],
                insights
            }
        });

    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/progress/:id/evaluate
// @desc    Evaluate a progress update (Staff/Admin only)
// @access  Private (Staff/Admin only)
router.put('/:id/evaluate', [
    authenticateToken,
    requireStaff,
    body('evaluation', 'Evaluation is required').isIn(['good', 'satisfactory', 'needs_improvement']),
    body('evaluation_notes', 'Evaluation notes are required').notEmpty()
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

        const { evaluation, evaluation_notes } = req.body;

        const [result] = await pool.execute(
            'UPDATE progress_updates SET evaluation = ?, evaluation_notes = ?, evaluated_by = ? WHERE id = ?',
            [evaluation, evaluation_notes, req.user.id, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Progress update not found'
            });
        }

        res.json({
            success: true,
            message: 'Progress update evaluated successfully'
        });

    } catch (error) {
        console.error('Evaluate progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/progress/:id
// @desc    Update progress update (Students only)
// @access  Private (Students only)
router.put('/:id', [
    authenticateToken,
    requireStudent,
    requireOwnership('progress'),
    body('description', 'Description is required').notEmpty().isLength({ min: 10 })
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

        const { description } = req.body;

        // Check if progress update has been evaluated
        const [progressUpdates] = await pool.execute(
            'SELECT evaluation FROM progress_updates WHERE id = ?',
            [req.params.id]
        );

        if (progressUpdates.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Progress update not found'
            });
        }

        if (progressUpdates[0].evaluation) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update progress update that has been evaluated'
            });
        }

        // Analyze updated progress with ML
        const insights = mlUtils.getProgressInsights(description);

        const [result] = await pool.execute(
            `UPDATE progress_updates 
             SET description = ?, sentiment_score = ?, quality_classification = ?, keywords = ?
             WHERE id = ?`,
            [
                description,
                insights.sentimentScore,
                insights.quality,
                JSON.stringify(insights.keywords),
                req.params.id
            ]
        );

        res.json({
            success: true,
            message: 'Progress update updated successfully',
            insights
        });

    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/progress/:id
// @desc    Delete progress update (Students only, if not evaluated)
// @access  Private (Students only)
router.delete('/:id', [
    authenticateToken,
    requireStudent,
    requireOwnership('progress')
], async (req, res) => {
    try {
        // Check if progress update has been evaluated
        const [progressUpdates] = await pool.execute(
            'SELECT evaluation FROM progress_updates WHERE id = ?',
            [req.params.id]
        );

        if (progressUpdates.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Progress update not found'
            });
        }

        if (progressUpdates[0].evaluation) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete progress update that has been evaluated'
            });
        }

        const [result] = await pool.execute(
            'DELETE FROM progress_updates WHERE id = ?',
            [req.params.id]
        );

        res.json({
            success: true,
            message: 'Progress update deleted successfully'
        });

    } catch (error) {
        console.error('Delete progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;