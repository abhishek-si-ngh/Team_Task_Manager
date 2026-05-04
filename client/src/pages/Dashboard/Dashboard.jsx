import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  FolderKanban,
  ListTodo,
  TrendingUp,
  ArrowRight,
  Circle,
} from 'lucide-react';
import { tasksAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { formatDistanceToNow, isPast, isWithinInterval, addDays } from 'date-fns';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, color, bgColor, onClick }) => (
  <div className="stat-card" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
    <div className="flex items-center justify-between">
      <div className="stat-icon" style={{ background: bgColor }}>
        <Icon size={20} color={color} />
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
    </div>
    <div className="stat-label">{label}</div>
  </div>
);

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: res } = await tasksAPI.getDashboard();
        setData(res);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const { stats, recentTasks, tasksPerUser } = data || {};

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  const completionRate = stats?.total > 0
    ? Math.round((stats.done / stats.total) * 100)
    : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">
          Dashboard
        </h1>
        <p className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>
          Overview of your team's tasks and projects.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          icon={ListTodo}
          label="Total Tasks"
          value={stats?.total ?? 0}
          color="var(--accent-purple-light)"
          bgColor="rgba(124,106,247,0.12)"
          onClick={() => navigate('/tasks')}
        />
        <StatCard
          icon={Circle}
          label="To Do"
          value={stats?.todo ?? 0}
          color="var(--text-secondary)"
          bgColor="rgba(107,114,128,0.12)"
          onClick={() => navigate('/tasks?status=todo')}
        />
        <StatCard
          icon={TrendingUp}
          label="In Progress"
          value={stats?.inProgress ?? 0}
          color="var(--accent-blue)"
          bgColor="rgba(79,156,249,0.12)"
          onClick={() => navigate('/tasks?status=in-progress')}
        />
        <StatCard
          icon={CheckSquare}
          label="Completed"
          value={stats?.done ?? 0}
          color="var(--accent-green)"
          bgColor="rgba(34,197,94,0.12)"
          onClick={() => navigate('/tasks?status=done')}
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={stats?.overdue ?? 0}
          color="var(--accent-red)"
          bgColor="rgba(239,68,68,0.12)"
        />
        <StatCard
          icon={FolderKanban}
          label="Projects"
          value={stats?.projectCount ?? 0}
          color="var(--accent-teal)"
          bgColor="rgba(45,212,191,0.12)"
          onClick={() => navigate('/projects')}
        />
      </div>

      {/* Bottom Section - Side by Side on Desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Completion Rate */}
          <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: '0.75rem' }}>
              <h3>Overall Completion</h3>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                {completionRate}%
              </span>
            </div>
            <div
              style={{
                height: 10,
                background: 'var(--bg-input)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${completionRate}%`,
                  background: 'var(--gradient-primary)',
                  borderRadius: 999,
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted" style={{ marginTop: '0.5rem' }}>
              <span>{stats?.done ?? 0} done</span>
              <span>{stats?.total ?? 0} total</span>
            </div>
          </div>

          {/* Tasks Per User */}
          {tasksPerUser && tasksPerUser.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '1.25rem' }}>Tasks Per User</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tasksPerUser.map((userStats, index) => (
                  <div key={index} className="flex items-center justify-between" style={{ padding: '0.5rem 0', borderBottom: index !== tasksPerUser.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div className="flex items-center gap-2">
                      <div className="avatar avatar-sm">{userStats.name !== 'Unassigned' ? userStats.name.substring(0, 2).toUpperCase() : '?'}</div>
                      <span className="text-sm font-medium">{userStats.name}</span>
                    </div>
                    <div className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                      {userStats.count} {userStats.count === 1 ? 'task' : 'tasks'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
            <h3>Recent Tasks</h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/tasks')}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          {!recentTasks || recentTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p className="text-muted">No tasks yet. Start by creating a project!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentTasks.map((task) => {
                const isOverdue =
                  task.dueDate && task.status !== 'done' && isPast(new Date(task.dueDate));
                return (
                  <div
                    key={task._id}
                    className="task-card"
                    onClick={() => navigate('/tasks')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="task-card-title truncate">{task.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted" style={{ marginTop: '0.25rem' }}>
                          <span>{task.projectId?.name}</span>
                          {task.assignedTo && (
                            <>
                              <span>·</span>
                              <span>{task.assignedTo.name}</span>
                            </>
                          )}
                          {task.dueDate && (
                            <>
                              <span>·</span>
                              <span className={isOverdue ? 'overdue' : ''}>
                                <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
                                {isOverdue
                                  ? 'Overdue'
                                  : formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
