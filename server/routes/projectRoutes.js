const express = require('express');
const { body } = require('express-validator');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();

const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description too long'),
];

// All project routes require authentication
router.use(protect);

router.get('/', getProjects);
router.post('/', roleCheck('admin'), projectValidation, createProject);

router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
