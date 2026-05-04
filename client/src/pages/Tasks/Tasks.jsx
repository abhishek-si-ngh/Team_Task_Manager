import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  CheckSquare,
  Pencil,
  Trash2,
  Calendar,
  User,
  ArrowUpDown,
} from 'lucide-react';
import { tasksAPI, projectsAPI, authAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { formatDistanceToNow, isPast, format } from 'date-fns';
import toast from 'react-hot-toast';

// ─── Task Form Modal ──────────────────────────────────────────────────────────
const TaskModal = ({ isOpen, onClose, onSaved, editingTask, projects, members }) => {
  const { user } = useAuth();
  const isEditing = !!editingTask;

  const [form, setForm] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);

  useEffect(() => {
    if (editingTask) {
      setForm({
        title: editingTask.title || '',
        description: editingTask.description || '',
        projectId: editingTask.projectId?._id || editingTask.projectId || '',
        assignedTo: editingTask.assignedTo?._id || editingTask.assignedTo || '',
        status: editingTask.status || 'todo',
        priority: editingTask.priority || 'medium',
        dueDate: editingTask.dueDate ? format(new Date(editingTask.dueDate), 'yyyy-MM-dd') : '',
      });
    } else {
      setForm({
        title: '', description: '', projectId: '', assignedTo: '',
        status: 'todo', priority: 'medium', dueDate: '',
      });
    }
  }, [editingTask, isOpen]);

  // When project changes, fetch its members
  useEffect(() => {
    if (form.projectId) {
      const project = projects.find((p) => p._id === form.projectId);
      setProjectMembers(project?.members || []);
    } else {
      setProjectMembers([]);
    }
  }, [form.projectId, projects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.projectId) return toast.error('Select a project');
    setLoading(true);
    try {
      const payload = {
        ...form,
        assignedTo: form.assignedTo || null,
        dueDate: form.dueDate || null,
      };
      let res;
      if (isEditing) {
        res = await tasksAPI.update(editingTask._id, payload);
      } else {
        res = await tasksAPI.create(payload);
      }
      toast.success(isEditing ? 'Task updated!' : 'Task created!');
      onSaved(res.data.task, isEditing);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || (isEditing ? 'Failed to update task' : 'Failed to create task'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Task' : 'Create New Task'}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            className="form-input"
            placeholder="Task title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            placeholder="Task description (optional)"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ resize: 'vertical' }}
          />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Project *</label>
            <select
              className="form-input form-select"
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value, assignedTo: '' })}
              disabled={isEditing}
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assign To</label>
            <select
              className="form-input form-select"
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            >
              <option value="">Unassigned</option>
              {projectMembers.map((m) => (
                <option key={m._id || m} value={m._id || m}>{m.name || m}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-input form-select"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select
              className="form-input form-select"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Due Date</label>
          <input
            className="form-input"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
        <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading && <div className="btn-spinner" />}
            {isEditing ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Quick Status Update Modal (Members) ─────────────────────────────────────
const StatusUpdateModal = ({ isOpen, onClose, task, onUpdated }) => {
  const [status, setStatus] = useState(task?.status || 'todo');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (task) setStatus(task.status); }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await tasksAPI.update(task._id, { status });
      toast.success('Status updated!');
      onUpdated(data.task);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Task Status">
      <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>{task?.title}</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Status</label>
          <select
            className="form-input form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading && <div className="btn-spinner" />}
            Update
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Kanban Column ────────────────────────────────────────────────────────────
const KanbanColumn = ({ title, status, tasks, color, onEdit, onDelete, onStatusUpdate, isAdmin }) => (
  <div className="kanban-column">
    <div className="kanban-column-header">
      <div className="kanban-col-title">
        <div className="kanban-dot" style={{ background: color }} />
        {title}
      </div>
      <span className="kanban-count">{tasks.length}</span>
    </div>
    <div className="task-cards-list">
      {tasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          No tasks here
        </div>
      )}
      {tasks.map((task) => {
        const isOverdue = task.dueDate && task.status !== 'done' && isPast(new Date(task.dueDate));
        return (
          <div key={task._id} className="task-card">
            <div className="task-card-title">{task.title}</div>
            {task.description && (
              <p className="text-xs text-muted" style={{ marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {task.description}
              </p>
            )}
            <div className="task-card-tags">
              <PriorityBadge priority={task.priority} />
              {task.projectId?.name && (
                <span className="badge" style={{ background: 'rgba(79,156,249,0.1)', color: 'var(--accent-blue)' }}>
                  {task.projectId.name}
                </span>
              )}
            </div>
            <div className="task-card-meta">
              <div className="flex items-center gap-2 text-xs text-muted">
                {task.assignedTo ? (
                  <div className="flex items-center gap-1">
                    <div className="avatar avatar-sm" data-tooltip={task.assignedTo.name}>
                      {task.assignedTo.name[0].toUpperCase()}
                    </div>
                    <span>{task.assignedTo.name}</span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                )}
                {task.dueDate && (
                  <span className={isOverdue ? 'overdue' : ''}>
                    <Calendar size={11} style={{ display: 'inline', marginRight: 2 }} />
                    {isOverdue ? 'Overdue' : format(new Date(task.dueDate), 'MMM d')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {isAdmin ? (
                  <>
                    <button className="btn-ghost" onClick={() => onEdit(task)} data-tooltip="Edit" style={{ padding: '0.25rem' }}>
                      <Pencil size={13} />
                    </button>
                    <button className="btn-ghost" onClick={() => onDelete(task._id)} data-tooltip="Delete" style={{ padding: '0.25rem', color: 'var(--accent-red)' }}>
                      <Trash2 size={13} />
                    </button>
                  </>
                ) : (
                  <button className="btn btn-secondary btn-sm" onClick={() => onStatusUpdate(task)}>
                    <ArrowUpDown size={12} /> Status
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Tasks Page ───────────────────────────────────────────────────────────────
const Tasks = () => {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [statusUpdateTask, setStatusUpdateTask] = useState(null);
  const [search, setSearch] = useState('');

  const projectId = searchParams.get('projectId') || '';
  const statusFilter = searchParams.get('status') || '';
  const priorityFilter = searchParams.get('priority') || '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (projectId) params.projectId = projectId;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const [tasksRes, projectsRes] = await Promise.all([
        tasksAPI.getAll(params),
        projectsAPI.getAll(),
      ]);
      setTasks(tasksRes.data.tasks);
      setProjects(projectsRes.data.projects);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId, statusFilter, priorityFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTaskSaved = (task, isEdit) => {
    if (isEdit) {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    } else {
      setTasks((prev) => [task, ...prev]);
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleStatusUpdated = (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
  };

  // Filter by search
  const filtered = tasks.filter((t) =>
    search ? t.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  // Group by status for kanban
  const byStatus = (status) => filtered.filter((t) => t.status === status);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="text-sm text-muted">
            {isAdmin ? 'Manage and track all project tasks' : 'Your assigned tasks'}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditingTask(null); setShowCreate(true); }}>
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            className="form-input search-input"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={projectId}
          onChange={(e) => updateFilter('projectId', e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={priorityFilter}
          onChange={(e) => updateFilter('priority', e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {(projectId || statusFilter || priorityFilter) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setSearchParams({})}
          >
            Clear Filters
          </button>
        )}
        <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Kanban Board */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CheckSquare size={32} /></div>
          <h3>No tasks found</h3>
          <p className="text-muted">
            {isAdmin ? 'Create your first task to get started.' : 'No tasks have been assigned to you yet.'}
          </p>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => { setEditingTask(null); setShowCreate(true); }}>
              <Plus size={16} /> Create Task
            </button>
          )}
        </div>
      ) : (
        <div className="kanban-board">
          <KanbanColumn
            title="To Do"
            status="todo"
            tasks={byStatus('todo')}
            color="var(--text-muted)"
            isAdmin={isAdmin}
            onEdit={(t) => { setEditingTask(t); setShowCreate(true); }}
            onDelete={handleDelete}
            onStatusUpdate={(t) => setStatusUpdateTask(t)}
          />
          <KanbanColumn
            title="In Progress"
            status="in-progress"
            tasks={byStatus('in-progress')}
            color="var(--accent-blue)"
            isAdmin={isAdmin}
            onEdit={(t) => { setEditingTask(t); setShowCreate(true); }}
            onDelete={handleDelete}
            onStatusUpdate={(t) => setStatusUpdateTask(t)}
          />
          <KanbanColumn
            title="Done"
            status="done"
            tasks={byStatus('done')}
            color="var(--accent-green)"
            isAdmin={isAdmin}
            onEdit={(t) => { setEditingTask(t); setShowCreate(true); }}
            onDelete={handleDelete}
            onStatusUpdate={(t) => setStatusUpdateTask(t)}
          />
        </div>
      )}

      {/* Modals */}
      <TaskModal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setEditingTask(null); }}
        onSaved={handleTaskSaved}
        editingTask={editingTask}
        projects={projects}
        members={[]}
      />

      <StatusUpdateModal
        isOpen={!!statusUpdateTask}
        onClose={() => setStatusUpdateTask(null)}
        task={statusUpdateTask}
        onUpdated={handleStatusUpdated}
      />
    </div>
  );
};

export default Tasks;
