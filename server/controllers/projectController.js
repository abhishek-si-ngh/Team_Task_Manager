const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

/**
 * @desc   Create a new project
 * @route  POST /api/projects
 * @access Private (Admin only)
 */
const createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      admin: req.user._id,
      members: [req.user._id],
    });

    await project.populate('admin members', 'name email role');

    res.status(201).json({ success: true, project });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, message: 'Failed to create project.' });
  }
};

/**
 * @desc   Get all projects for current user
 * @route  GET /api/projects
 * @access Private
 */
const getProjects = async (req, res) => {
  try {
    // Admin sees projects they own; members see projects they're in
    const query =
      req.user.role === 'admin'
        ? { $or: [{ admin: req.user._id }, { members: req.user._id }] }
        : { members: req.user._id };

    const projects = await Project.find(query)
      .populate('admin', 'name email')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch projects.' });
  }
};

/**
 * @desc   Get a single project by ID
 * @route  GET /api/projects/:id
 * @access Private (project members only)
 */
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('admin', 'name email role')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Authorization: only members of the project can view it
    const isMember = project.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch project.' });
  }
};

/**
 * @desc   Update a project
 * @route  PUT /api/projects/:id
 * @access Private (Project Admin only)
 */
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project admin can update this project.' });
    }

    const { name, description, status } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;

    await project.save();
    await project.populate('admin members', 'name email role');

    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update project.' });
  }
};

/**
 * @desc   Delete a project (and all its tasks)
 * @route  DELETE /api/projects/:id
 * @access Private (Project Admin only)
 */
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project admin can delete this project.' });
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ projectId: project._id });
    await project.deleteOne();

    res.status(200).json({ success: true, message: 'Project and all associated tasks deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete project.' });
  }
};

/**
 * @desc   Add a member to a project
 * @route  POST /api/projects/:id/members
 * @access Private (Project Admin only)
 */
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project admin can add members.' });
    }

    // Check user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if already a member
    if (project.members.includes(userId)) {
      return res.status(409).json({ success: false, message: 'User is already a member of this project.' });
    }

    project.members.push(userId);
    await project.save();
    await project.populate('admin members', 'name email role');

    res.status(200).json({ success: true, message: 'Member added successfully.', project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add member.' });
  }
};

/**
 * @desc   Remove a member from a project
 * @route  DELETE /api/projects/:id/members/:userId
 * @access Private (Project Admin only)
 */
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the project admin can remove members.' });
    }

    const { userId } = req.params;

    // Cannot remove the admin themselves
    if (project.admin.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project admin.' });
    }

    project.members = project.members.filter((m) => m.toString() !== userId);
    await project.save();
    await project.populate('admin members', 'name email role');

    res.status(200).json({ success: true, message: 'Member removed successfully.', project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove member.' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
