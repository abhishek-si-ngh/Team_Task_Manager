const express = require('express');
const { body } = require('express-validator');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getDashboardStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ min: 2, max: 200 }),
  body('projectId').notEmpty().withMessage('Project ID is required').isMongoId().withMessage('Invalid project ID'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('status').optional().isIn(['todo', 'in-progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
];

// All task routes require authentication
router.use(protect);

// Dashboard stats — must be before /:id to avoid conflict
router.get('/dashboard', getDashboardStats);

router.get('/', getTasks);
router.post('/', taskValidation, createTask);

router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
