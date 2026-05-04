const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

/**
 * Helper: Check if user is a member of the project
 */
const isProjectMember = (project, userId) =>
  project.members.some((m) => m.toString() === userId.toString());

/**
 * Helper: Check if user is the admin of the project
 */
const isProjectAdmin = (project, userId) =>
  project.admin.toString() === userId.toString();

/**
 * @desc   Create a new task
 * @route  POST /api/tasks
 * @access Private (Project Admin only)
 */
const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { title, description, projectId, assignedTo, status, priority, dueDate } = req.body;

    // Verify project exists and user is admin
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (!isProjectAdmin(project, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the project admin can create tasks.' });
    }

    // If assigning to someone, verify they are a project member
    if (assignedTo) {
      const assignedMember = project.members.find((m) => m.toString() === assignedTo);
      if (!assignedMember) {
        return res.status(400).json({ success: false, message: 'Assigned user is not a member of this project.' });
      }
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
    });

    await task.populate('assignedTo createdBy', 'name email');
    await task.populate('projectId', 'name');

    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: 'Failed to create task.' });
  }
};

/**
 * @desc   Get tasks (filtered by project, status, or assigned user)
 * @route  GET /api/tasks
 * @access Private
 */
const getTasks = async (req, res) => {
  try {
    const { projectId, status, priority, assignedTo, page = 1, limit = 50 } = req.query;

    let query = {};

    if (projectId) {
      // Verify user has access to this project
      const project = await Project.findById(projectId);
      if (!project || !isProjectMember(project, req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied to this project.' });
      }
      query.projectId = projectId;
    } else {
      // Members only see their own assigned tasks across all projects
      if (req.user.role === 'member') {
        query.assignedTo = req.user._id;
      } else {
        // Admin sees tasks in their projects
        const adminProjects = await Project.find({ admin: req.user._id }).select('_id');
        const memberProjects = await Project.find({ members: req.user._id }).select('_id');
        const allProjectIds = [
          ...adminProjects.map((p) => p._id),
          ...memberProjects.map((p) => p._id),
        ];
        query.projectId = { $in: allProjectIds };
      }
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Task.countDocuments(query);

    res.status(200).json({ success: true, tasks, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks.' });
  }
};

/**
 * @desc   Get dashboard stats for current user
 * @route  GET /api/tasks/dashboard
 * @access Private
 */
const getDashboardStats = async (req, res) => {
  try {
    let baseQuery = {};
    const now = new Date();

    if (req.user.role === 'member') {
      baseQuery.assignedTo = req.user._id;
    } else {
      // Admin sees stats for all projects they own
      const adminProjects = await Project.find({
        $or: [{ admin: req.user._id }, { members: req.user._id }],
      }).select('_id');
      baseQuery.projectId = { $in: adminProjects.map((p) => p._id) };
    }

    const [total, todo, inProgress, done, overdue] = await Promise.all([
      Task.countDocuments(baseQuery),
      Task.countDocuments({ ...baseQuery, status: 'todo' }),
      Task.countDocuments({ ...baseQuery, status: 'in-progress' }),
      Task.countDocuments({ ...baseQuery, status: 'done' }),
      Task.countDocuments({
        ...baseQuery,
        status: { $ne: 'done' },
        dueDate: { $lt: now },
        dueDate: { $ne: null },
      }),
    ]);

    // Recent tasks (last 5)
    const recentTasks = await Task.find(baseQuery)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Project counts (admin only)
    let projectCount = 0;
    if (req.user.role === 'admin') {
      projectCount = await Project.countDocuments({ admin: req.user._id });
    } else {
      projectCount = await Project.countDocuments({ members: req.user._id });
    }

    res.status(200).json({
      success: true,
      stats: { total, todo, inProgress, done, overdue, projectCount },
      recentTasks,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data.' });
  }
};

/**
 * @desc   Get a single task
 * @route  GET /api/tasks/:id
 * @access Private (project members)
 */
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('projectId', 'name admin members');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const project = task.projectId;
    if (!isProjectMember(project, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch task.' });
  }
};

/**
 * @desc   Update a task
 *         Admin: can update all fields
 *         Member: can only update status (of their own assigned task)
 * @route  PUT /api/tasks/:id
 * @access Private
 */
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('projectId');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const project = task.projectId;
    const userIsAdmin = isProjectAdmin(project, req.user._id);
    const userIsMember = isProjectMember(project, req.user._id);

    if (!userIsMember) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (userIsAdmin) {
      // Admin can update everything
      const { title, description, assignedTo, status, priority, dueDate } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
    } else {
      // Member can only update status of their own task
      const isAssigned =
        task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'You can only update tasks assigned to you.' });
      }

      if (req.body.status) {
        task.status = req.body.status;
      } else {
        return res.status(400).json({ success: false, message: 'Members can only update task status.' });
      }
    }

    await task.save();
    await task.populate('assignedTo createdBy', 'name email');
    await task.populate('projectId', 'name');

    res.status(200).json({ success: true, task });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, message: 'Failed to update task.' });
  }
};

/**
 * @desc   Delete a task
 * @route  DELETE /api/tasks/:id
 * @access Private (Project Admin only)
 */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('projectId');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (!isProjectAdmin(task.projectId, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the project admin can delete tasks.' });
    }

    await task.deleteOne();

    res.status(200).json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete task.' });
  }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask, getDashboardStats };
