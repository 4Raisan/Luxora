import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalProviders: 0, totalBookings: 0, totalRevenue: 0 });
  const [providers, setProviders] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('luxora_token') || '');

  useEffect(() => {
    if (token) {
      loadAdminData();
    }
  }, [token]);

  const loadAdminData = async () => {
    try {
      const s = await apiRequest('/admin/stats', 'GET', null, token);
      setStats(s);

      const p = await apiRequest('/admin/providers', 'GET', null, token);
      setProviders(p);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKycUpdate = async (id, status) => {
    try {
      await apiRequest(`/admin/providers/${id}/kyc`, 'PUT', { status }, token);
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-container">
      <h2>Luxora Administrator Operations Center</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Customers</h3>
          <p>{stats.totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>Active Providers</h3>
          <p>{stats.totalProviders}</p>
        </div>
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p>{stats.totalBookings}</p>
        </div>
        <div className="stat-card">
          <h3>Revenue (LKR)</h3>
          <p>LKR {stats.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <h3>Provider KYC Verification & Approvals</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Category</th>
            <th>NIC</th>
            <th>KYC Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {providers.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.email}</td>
              <td>{p.category}</td>
              <td>{p.nic || 'N/A'}</td>
              <td><span className={`status-badge ${p.kyc_status}`}>{p.kyc_status}</span></td>
              <td>
                {p.kyc_status === 'pending' && (
                  <>
                    <button className="btn-approve" onClick={() => handleKycUpdate(p.id, 'approved')}>Approve</button>
                    <button className="btn-reject" onClick={() => handleKycUpdate(p.id, 'rejected')}>Reject</button>
                  </>
                )}
                {p.kyc_status === 'approved' && <span className="text-verified">Verified</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
