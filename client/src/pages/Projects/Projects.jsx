import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Trash2, FolderKanban, ChevronRight, UserPlus, UserMinus } from 'lucide-react';
import { projectsAPI, authAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import { RoleBadge } from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

// ─── Create Project Modal ─────────────────────────────────────────────────────
const CreateProjectModal = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name is required');
    setLoading(true);
    try {
      const { data } = await projectsAPI.create(form);
      toast.success('Project created!');
      onCreated(data.project);
      onClose();
      setForm({ name: '', description: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Project Name *</label>
          <input
            className="form-input"
            placeholder="e.g. Website Redesign"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
        </div>
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            placeholder="What is this project about?"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ resize: 'vertical' }}
          />
        </div>
        <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <div className="btn-spinner" /> : <Plus size={15} />}
            Create Project
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Manage Members Modal ─────────────────────────────────────────────────────
const ManageMembersModal = ({ isOpen, onClose, project, onUpdated }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      authAPI.getAllUsers().then(({ data }) => setAllUsers(data.users));
    }
  }, [isOpen]);

  const memberIds = project?.members?.map((m) => m._id || m) || [];

  const handleAddMember = async (userId) => {
    setLoading(true);
    try {
      const { data } = await projectsAPI.addMember(project._id, userId);
      toast.success('Member added!');
      onUpdated(data.project);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    setLoading(true);
    try {
      const { data } = await projectsAPI.removeMember(project._id, userId);
      toast.success('Member removed');
      onUpdated(data.project);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const nonMembers = allUsers.filter(
    (u) => !memberIds.includes(u._id) && u._id !== project?.admin?._id && u._id !== project?.admin
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Members" maxWidth="600px">
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {/* Current Members */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current Members ({project?.members?.length || 0})
          </h4>
          {project?.members?.map((member) => (
            <div
              key={member._id || member}
              className="flex items-center justify-between"
              style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <div className="avatar avatar-sm">
                  {(member.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{member.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{member.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RoleBadge role={member.role} />
                {(member._id || member) !== (project?.admin?._id || project?.admin) && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveMember(member._id || member)}
                    disabled={loading}
                    title="Remove Member"
                  >
                    <UserMinus size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Members */}
        {nonMembers.length > 0 && (
          <div>
            <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Add Members
            </h4>
            {nonMembers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between"
                style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2">
                  <div className="avatar avatar-sm">
                    {user.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{user.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user.email}</div>
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleAddMember(user._id)}
                  disabled={loading}
                  title="Add Member"
                >
                  <UserPlus size={13} /> Add
                </button>
              </div>
            ))}
          </div>
        )}

        {nonMembers.length === 0 && (
          <p className="text-sm text-muted" style={{ textAlign: 'center', padding: '1rem' }}>
            All registered users are already members.
          </p>
        )}
      </div>
    </Modal>
  );
};

// ─── Projects Page ────────────────────────────────────────────────────────────
const Projects = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [managingProject, setManagingProject] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      const { data } = await projectsAPI.getAll();
      setProjects(data.projects);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async (e, projectId) => {
    e.stopPropagation();
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await projectsAPI.delete(projectId);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleManageMembers = (e, project) => {
    e.stopPropagation();
    setManagingProject(project);
  };

  const handleProjectUpdated = (updatedProject) => {
    setProjects((prev) =>
      prev.map((p) => (p._id === updatedProject._id ? updatedProject : p))
    );
    setManagingProject(updatedProject);
  };

  const statusColors = {
    active: 'var(--accent-green)',
    completed: 'var(--accent-purple)',
    'on-hold': 'var(--accent-amber)',
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-sm text-muted">Manage your team's projects</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FolderKanban size={32} />
          </div>
          <h3>No projects yet</h3>
          <p className="text-muted">
            {isAdmin ? 'Create your first project to get started.' : "You haven't been added to any projects yet."}
          </p>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {projects.map((project) => (
            <div
              key={project._id}
              className="project-card"
              onClick={() => navigate(`/tasks?projectId=${project._id}`)}
            >
              <div className="project-card-content">
                {/* Header */}
                <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: 'var(--gradient-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FolderKanban size={20} color="white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 999,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: `${statusColors[project.status]}20`,
                        color: statusColors[project.status],
                      }}
                    >
                      {project.status}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 style={{ marginBottom: '0.35rem' }} className="truncate">{project.name}</h3>
                <p
                  className="text-sm text-muted"
                  style={{ marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                  {project.description || 'No description provided.'}
                </p>

                {/* Members */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="members-stack">
                      {project.members.slice(0, 4).map((m, i) => (
                        <div
                          key={m._id || i}
                          className="avatar avatar-sm"
                          title={m.name}
                        >
                          {(m.name || '?')[0].toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-muted">
                      {project.members.length} member{project.members.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {isAdmin && project.admin?._id && (
                      <>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => handleManageMembers(e, project)}
                          title="Manage members"
                        >
                          <Users size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => handleDelete(e, project._id)}
                          title="Delete project"
                          style={{ color: 'var(--accent-red)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                    <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="text-xs text-muted" style={{ marginTop: '0.75rem' }}>
                  Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(p) => setProjects((prev) => [p, ...prev])}
      />

      <ManageMembersModal
        isOpen={!!managingProject}
        onClose={() => setManagingProject(null)}
        project={managingProject}
        onUpdated={handleProjectUpdated}
      />
    </div>
  );
};

export default Projects;
