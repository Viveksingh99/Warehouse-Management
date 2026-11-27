import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { KeyRound, Trash2, UserPlus, X } from 'lucide-react';
import { ApiError } from '../api/client';
import {
  createUser,
  deleteUser,
  fetchUsers,
  resetUserPassword,
  updateUser,
} from '../api/warehouse';
import { useAuth } from '../context/AuthContext';
import type { User, UserRole } from '../types/warehouse';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null,
  );

  // Create user modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('technician');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Reset password modal state
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const list = await fetchUsers();
      setUsers(list);
    } catch (err) {
      setFeedback({
        kind: 'error',
        text: err instanceof ApiError ? err.message : 'Failed to load users.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const created = await createUser({
        username: newUsername.trim(),
        password: newPassword,
        role: newRole,
      });
      setUsers((prev) => [...prev, created].sort((a, b) => a.username.localeCompare(b.username)));
      setCreateOpen(false);
      setNewUsername('');
      setNewPassword('');
      setNewRole('technician');
      setFeedback({ kind: 'success', text: `Created user '${created.username}' (${created.role}).` });
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Unable to create user.');
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (target: User, role: UserRole) => {
    setFeedback(null);
    try {
      const updated = await updateUser(target.id, { role });
      setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));
      setFeedback({ kind: 'success', text: `Updated '${target.username}' role to ${role}.` });
    } catch (err) {
      setFeedback({
        kind: 'error',
        text: err instanceof ApiError ? err.message : 'Unable to update role.',
      });
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError(null);
    setResetting(true);
    try {
      const res = await resetUserPassword(resetTarget.id, resetPassword);
      setFeedback({ kind: 'success', text: res.message });
      setResetTarget(null);
      setResetPassword('');
    } catch (err) {
      setResetError(err instanceof ApiError ? err.message : 'Unable to reset password.');
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteUser = async (target: User) => {
    setFeedback(null);
    try {
      const res = await deleteUser(target.id);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      setFeedback({ kind: 'success', text: res.message });
    } catch (err) {
      setFeedback({
        kind: 'error',
        text: err instanceof ApiError ? err.message : 'Unable to remove user.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Administration</h1>
          <p className="text-sm text-slate-500">
            Create accounts, assign roles, reset passwords, and remove user access.
          </p>
        </div>

        <button
          type="button"
          data-testid="open-create-user-btn"
          onClick={() => {
            setCreateError(null);
            setCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Create User
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          data-testid="users-feedback"
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${
            feedback.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  Loading users...
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <tr key={u.id} data-testid={`user-row-${u.username}`}>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {u.username}{' '}
                      {isSelf && <span className="text-xs font-normal text-slate-500">(you)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Role for ${u.username}`}
                        disabled={isSelf}
                        value={u.role}
                        onChange={(e) => void handleRoleChange(u, e.target.value as UserRole)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="auditor">Auditor</option>
                        <option value="technician">Technician</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setResetError(null);
                            setResetPassword('');
                            setResetTarget(u);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                          Reset Password
                        </button>
                        <button
                          type="button"
                          disabled={isSelf}
                          data-testid={`delete-user-${u.username}`}
                          onClick={() => void handleDeleteUser(u)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-40 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-user-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 id="create-user-title" className="text-lg font-bold text-slate-900">
                Create Warehouse User
              </h2>
              <button
                type="button"
                aria-label="Close create user dialog"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              {createError && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
                >
                  {createError}
                </div>
              )}

              <div>
                <label htmlFor="new-username" className="block text-sm font-medium text-slate-700">
                  Username
                </label>
                <input
                  id="new-username"
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">
                  Password (min 8 chars, no spaces)
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="new-role" className="block text-sm font-medium text-slate-700">
                  Role
                </label>
                <select
                  id="new-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value="technician">Technician</option>
                  <option value="auditor">Auditor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="create-user-submit"
                  disabled={creating}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 id="reset-password-title" className="text-lg font-bold text-slate-900">
                Reset Password: {resetTarget.username}
              </h2>
              <button
                type="button"
                aria-label="Close reset password dialog"
                onClick={() => setResetTarget(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              {resetError && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
                >
                  {resetError}
                </div>
              )}

              <div>
                <label htmlFor="reset-password-input" className="block text-sm font-medium text-slate-700">
                  New password
                </label>
                <input
                  id="reset-password-input"
                  type="password"
                  required
                  minLength={8}
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {resetting ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
