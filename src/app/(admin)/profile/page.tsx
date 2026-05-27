'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { UserCircle } from 'lucide-react';
import dayjs from 'dayjs';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
          <p className="text-slate-500 mt-1">Manage your account settings</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-200 flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <UserCircle className="h-16 w-16" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{user?.first_name} {user?.last_name}</h2>
            <p className="text-slate-500">{user?.email}</p>
            <div className="mt-2 flex gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                {user?.is_superuser ? 'Super Admin' : 'Admin'}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                user?.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {user?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">First Name</p>
              <p className="text-base text-slate-900">{user?.first_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Last Name</p>
              <p className="text-base text-slate-900">{user?.last_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Email Address</p>
              <p className="text-base text-slate-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Phone Number</p>
              <p className="text-base text-slate-900">{user?.phone_number || '-'}</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Edit Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
