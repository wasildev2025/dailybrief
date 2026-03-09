"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
  toggleUserActive,
} from "@/actions/user-actions";
import { toast } from "sonner";
import { UserPlus, Edit, KeyRound, Power, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [formOrder, setFormOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data as any);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!formName || !formEmail || !formPassword) { toast.error("All fields are required"); return; }
    setSaving(true);
    try {
      await createUser({ name: formName, email: formEmail, password: formPassword, role: formRole, displayOrder: formOrder });
      toast.success("User created");
      setCreateOpen(false);
      resetForm();
      loadUsers();
    } catch (error: any) { toast.error(error.message || "Failed to create user"); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await updateUser(selectedUser.id, { name: formName, email: formEmail, role: formRole, displayOrder: formOrder });
      toast.success("User updated");
      setEditOpen(false);
      loadUsers();
    } catch (error: any) { toast.error(error.message || "Failed to update user"); }
    finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !formPassword) return;
    setSaving(true);
    try {
      await resetUserPassword(selectedUser.id, formPassword);
      toast.success("Password reset");
      setResetOpen(false);
      setFormPassword("");
    } catch { toast.error("Failed to reset password"); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      const result = await toggleUserActive(userId);
      toast.success(result.isActive ? "User activated" : "User deactivated");
      loadUsers();
    } catch (error: any) { toast.error(error.message || "Failed to toggle user"); }
  };

  const resetForm = () => { setFormName(""); setFormEmail(""); setFormPassword(""); setFormRole("MEMBER"); setFormOrder(0); };
  const openEdit = (user: UserRow) => { setSelectedUser(user); setFormName(user.name); setFormEmail(user.email); setFormRole(user.role as any); setFormOrder(user.displayOrder); setEditOpen(true); };
  const openReset = (user: UserRow) => { setSelectedUser(user); setFormPassword(""); setResetOpen(true); };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Users</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Manage team members and their access</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 text-white" size="sm" />}>
            <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add User
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Mr. John" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="john@oasdev.com" type="email" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Password</Label>
                <Input value={formPassword} onChange={(e) => setFormPassword(e.target.value)} type="password" className="h-9" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Role</Label>
                  <Select value={formRole} onValueChange={(v) => setFormRole(v as any)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Display Order</Label>
                  <Input type="number" value={formOrder} onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)} className="h-9" />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Order</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 text-[12px] text-gray-500 font-mono">{user.displayOrder}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-[13px] font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-gray-500">{user.email}</td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider",
                        user.role === "ADMIN" ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-600"
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider",
                        user.isActive ? "text-emerald-600" : "text-gray-400"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", user.isActive ? "bg-emerald-500" : "bg-gray-300")} />
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)} className="h-7 w-7 text-gray-400 hover:text-gray-700">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openReset(user)} className="h-7 w-7 text-gray-400 hover:text-gray-700">
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToggleActive(user.id)} className="h-7 w-7 text-gray-400 hover:text-gray-700">
                          <Power className={cn("h-3.5 w-3.5", user.isActive ? "text-emerald-500" : "text-gray-400")} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5"><Label className="text-xs">Name</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} type="email" className="h-9" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <Select value={formRole} onValueChange={(v) => setFormRole(v as any)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Display Order</Label><Input type="number" value={formOrder} onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)} className="h-9" /></div>
            </div>
            <Button onClick={handleEdit} disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset Password — {selectedUser?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">New Password</Label>
              <Input value={formPassword} onChange={(e) => setFormPassword(e.target.value)} type="password" placeholder="Enter new password" className="h-9" />
            </div>
            <Button onClick={handleResetPassword} disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Reset Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
