const statusMap = {
  todo: { label: 'To Do', className: 'badge-todo' },
  'in-progress': { label: 'In Progress', className: 'badge-in-progress' },
  done: { label: 'Done', className: 'badge-done' },
};

const priorityMap = {
  low: { label: 'Low', className: 'badge-low' },
  medium: { label: 'Medium', className: 'badge-medium' },
  high: { label: 'High', className: 'badge-high' },
};

const roleMap = {
  admin: { label: 'Admin', className: 'badge-admin' },
  member: { label: 'Member', className: 'badge-member' },
};

export const StatusBadge = ({ status }) => {
  const config = statusMap[status] || { label: status, className: '' };
  return <span className={`badge ${config.className}`}>{config.label}</span>;
};

export const PriorityBadge = ({ priority }) => {
  const config = priorityMap[priority] || { label: priority, className: '' };
  return <span className={`badge ${config.className}`}>{config.label}</span>;
};

export const RoleBadge = ({ role }) => {
  const config = roleMap[role] || { label: role, className: '' };
  return <span className={`badge ${config.className}`}>{config.label}</span>;
};
