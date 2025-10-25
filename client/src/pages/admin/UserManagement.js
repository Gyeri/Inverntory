import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User,
  Mail,
  Shield,
  Calendar
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'cashier',
    password: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };



  const filteredUsers = users.filter(user =>
    (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (selectedUser) {
        await api.patch(`/users/${selectedUser._id}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        });
        toast.success('User updated successfully');
      } else {
        await api.post('/users', {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password,
        });
        toast.success('User created successfully');
      }

      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      toast.error(error.response?.data?.error || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/users/${user._id}`);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };




  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'cashier',
      password: ''
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'cashier': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👑';
      case 'manager': return '👔';
      case 'cashier': return '💳';
      default: return '👤';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage user accounts and permissions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-body">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">
            Users ({filteredUsers.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">User</th>
                <th className="table-header-cell">Role</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Created</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-lg">{getRoleIcon(user.role)}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${getRoleColor(user.role)}`}>
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`badge badge-success`}>
                      Active
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">

                      <button
                        onClick={() => handleEdit(user)}
                        className="text-green-600 hover:text-green-800"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No users found</p>
              <p className="text-sm">Try adjusting your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {selectedUser ? 'Edit User' : 'Add New User'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Name *</label>
                        <input
                          type="text"
                          name="name"
                          required
                          className="input"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label className="label">Email *</label>
                        <input
                          type="email"
                          name="email"
                          required
                          className="input"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Role *</label>
                      <select
                        name="role"
                        required
                        className="input"
                        value={formData.role}
                        onChange={handleInputChange}
                      >
                        <option value="cashier">Cashier</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    {!selectedUser && (
                      <div>
                        <label className="label">Password *</label>
                        <input
                          type="password"
                          name="password"
                          required
                          className="input"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Enter initial password"
                        />
                      </div>
                    )}


                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary sm:ml-3 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (selectedUser ? 'Update User' : 'Create User')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedUser(null);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default UserManagement;
