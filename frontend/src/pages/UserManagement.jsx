import React, { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, Clock, Key, AlertCircle } from 'lucide-react';
import api from '../services/api';
import KpiCard from '../components/KpiCard';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'audit'

  const fetchData = async () => {
    try {
      const [uRes, dRes, aRes] = await Promise.all([
        api.get('/users'),
        api.get('/auth/departments'),
        api.get('/users/audit-logs')
      ]);
      if (uRes.data.success) setUsers(uRes.data.users);
      if (dRes.data.success) setDepartments(dRes.data.departments);
      if (aRes.data.success) setAuditLogs(aRes.data.logs);
    } catch (err) {
      console.error('Failed to load user management data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      fetchData();
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management & Audit Trails</h1>
          <p className="text-xs text-slate-500 mt-1">
            Role-based access control (RBAC) and compliance audit logs for IPRC personnel
          </p>
        </div>

        <div className="flex bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'users' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Authorized Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'audit' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            System Audit Trail ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Personnel Roster & Access Roles</h2>
            <p className="text-xs text-slate-500">Configure administrative and environmental analyst privileges</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-700 font-semibold">
                <tr>
                  <th className="py-3 px-4">Officer / User Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Assigned Department</th>
                  <th className="py-3 px-4">Access Role</th>
                  <th className="py-3 px-4 text-center">Privilege Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {u.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {u.email}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {u.designation || 'Environmental Officer'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {u.department ? `${u.department.name} (${u.department.code})` : 'All Facilities'}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-semibold"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="OFFICER">OFFICER</option>
                        <option value="ANALYST">ANALYST</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-rose-100 text-rose-800' :
                        u.role === 'OFFICER' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">System Audit Trail Log</h2>
            <p className="text-xs text-slate-500">Immutable ledger of authentication, calculations, and data mutations</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-700 font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Initiating Officer</th>
                  <th className="py-3 px-4">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-800 font-sans">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-emerald-700">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {log.entity}
                    </td>
                    <td className="py-2.5 px-4 text-slate-900 font-sans font-medium">
                      {log.user ? `${log.user.name} (${log.user.role})` : 'System Daemon'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

