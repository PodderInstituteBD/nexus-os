import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react';
import { TeamMember, Role } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const TeamsPage: React.FC = () => {
  const { activeTeam, user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('MEMBER');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, [activeTeam]);

  const loadMembers = async () => {
    if (!activeTeam) return;
    try {
      const data = await apiRequest<{ members: TeamMember[] }>(`/teams/${activeTeam.id}/members`);
      setMembers(data.members || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load team members');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeTeam) return;
    setIsInviting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest(`/teams/${activeTeam.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
      });
      setSuccess(`Added ${inviteEmail} to ${activeTeam.name}`);
      setInviteEmail('');
      loadMembers();
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (!activeTeam) return;
    try {
      await apiRequest(`/teams/${activeTeam.id}/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      });
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeTeam || !window.confirm('Remove this member from the engineering team?')) return;
    try {
      await apiRequest(`/teams/${activeTeam.id}/members/${userId}`, {
        method: 'DELETE'
      });
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Team & Access Control (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage engineering workspace permissions, roles, and collaborator rosters.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Active Workspace Engineers ({members.length})
          </h3>

          <div className="divide-y divide-slate-100">
            {members.map((member) => {
              const isCurrentUser = member.userId === user?.id;

              return (
                <div key={member.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={member.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={member.user?.fullName}
                      className="w-9 h-9 rounded-full border border-slate-200 object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>{member.user?.fullName || member.userId}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{member.user?.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <select
                      value={member.role}
                      disabled={member.role === 'OWNER'}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value as Role)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="OWNER">Owner</option>
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                      <option value="VIEWER">Viewer</option>
                    </select>

                    {member.role !== 'OWNER' && !isCurrentUser && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invite Member Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 h-fit">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Add Team Member</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Invite an engineer or collaborator to <strong>{activeTeam?.name}</strong>. They will immediately gain workspace access.
          </p>

          <form onSubmit={handleAddMember} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="developer@company.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-semibold"
              >
                <option value="ADMIN">Admin (Full Control)</option>
                <option value="MEMBER">Member (Edit Tasks & Projects)</option>
                <option value="VIEWER">Viewer (Read-Only)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isInviting || !inviteEmail.trim()}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              {isInviting ? 'Adding...' : 'Add Member'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
