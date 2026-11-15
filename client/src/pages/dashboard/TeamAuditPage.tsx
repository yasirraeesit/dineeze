import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ChefHat,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Trash2,
  Power,
  Search,
  RotateCw,
} from "lucide-react";
import useAuthStore from "../../stores/authStore";
import api from "../../utils/api";
import useSocket from "../../hooks/useSocket";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "MANAGER" | "KITCHEN" | "WAITER";
  isActive: boolean;
  restaurantId: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  actorName: string;
  actorRole: string;
  details: string | null;
  orderId: string;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    table?: {
      tableNumber: number;
      label: string;
    };
  };
}

export const TeamAuditPage: React.FC = () => {
  const { activeRestaurant, user } = useAuthStore();
  const socket = useSocket("restaurant", activeRestaurant?.id);

  const [activeTab, setActiveTab] = useState<"staff" | "audit">("staff");
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Invite Staff Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePin, setInvitePin] = useState("");
  const [inviteRole, setInviteRole] = useState<"MANAGER" | "KITCHEN" | "WAITER">("WAITER");
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Search & Filters
  const [staffSearch, setStaffSearch] = useState("");
  const [auditFilter, setAuditFilter] = useState<string>("ALL");
  const [copiedLink, setCopiedLink] = useState(false);

  const staffPortalUrl = activeRestaurant?.slug
    ? `${window.location.origin}/staff-login?restaurant=${activeRestaurant.slug}`
    : `${window.location.origin}/staff-login`;

  const copyPortalLink = () => {
    navigator.clipboard.writeText(staffPortalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Fetch Staff List
  const fetchStaff = async () => {
    if (!activeRestaurant?.id) return;
    setLoadingStaff(true);
    try {
      const res = await api.get(`/api/staff?restaurantId=${activeRestaurant.id}`);
      setStaffList(res.data.staff || []);
    } catch (err) {
      console.error("Failed to load staff:", err);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Fetch Chronological Audit Logs
  const fetchAuditLogs = async () => {
    if (!activeRestaurant?.id) return;
    setLoadingAudit(true);
    try {
      const res = await api.get(`/api/orders/audit-logs?restaurantId=${activeRestaurant.id}`);
      setAuditLogs(res.data.auditLogs || []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchAuditLogs();
  }, [activeRestaurant?.id]);

  // Real-time socket updates for audit events
  useEffect(() => {
    if (!socket || !activeRestaurant?.id) return;
    const handleOrderEvent = () => {
      fetchAuditLogs();
    };
    socket.on("order_status_updated", handleOrderEvent);
    socket.on("order_item_updated", handleOrderEvent);
    return () => {
      socket.off("order_status_updated", handleOrderEvent);
      socket.off("order_item_updated", handleOrderEvent);
    };
  }, [socket, activeRestaurant?.id]);

  // Handle Invite Staff Submit
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRestaurant?.id) return;
    if (!inviteName.trim() || !inviteEmail.trim() || !invitePin) {
      setInviteError("Please fill out all staff fields");
      return;
    }

    setSubmittingInvite(true);
    setInviteError(null);

    try {
      const res = await api.post("/api/staff", {
        restaurantId: activeRestaurant.id,
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        pinOrPassword: invitePin,
        role: inviteRole,
      });

      setStaffList([res.data.staff, ...staffList]);
      setInviteModalOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInvitePin("");
      setInviteRole("WAITER");
    } catch (err: any) {
      console.error("Staff invite error:", err);
      setInviteError(err.response?.data?.error || "Failed to create staff member");
    } finally {
      setSubmittingInvite(false);
    }
  };

  // Handle Toggle Active/Inactive
  const handleToggleStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      const res = await api.patch(`/api/staff/${staffId}/status`, {
        isActive: !currentStatus,
      });
      setStaffList((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, isActive: res.data.staff.isActive } : s))
      );
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update staff status");
    }
  };

  // Handle Delete Staff
  const handleDeleteStaff = async (staffId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from this restaurant branch?`)) {
      return;
    }
    try {
      await api.delete(`/api/staff/${staffId}`);
      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to remove staff member");
    }
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.role.toLowerCase().includes(staffSearch.toLowerCase())
  );

  const filteredAudit = auditLogs.filter((log) => {
    if (auditFilter === "ALL") return true;
    if (auditFilter === "STATUS") return ["ACCEPTED", "MARKED_READY", "CANCELLED", "MARKED_SERVED"].includes(log.action);
    if (auditFilter === "PREP") return ["ITEM_PREPARED", "ITEM_UNPREPARED"].includes(log.action);
    if (auditFilter === "PAYMENT") return log.action === "SETTLED_PAYMENT";
    return true;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "KITCHEN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <ChefHat className="w-3 h-3" />
            <span>Kitchen</span>
          </span>
        );
      case "WAITER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Users className="w-3 h-3" />
            <span>Waiter</span>
          </span>
        );
      case "MANAGER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3 h-3" />
            <span>Manager</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            <span>{role}</span>
          </span>
        );
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "ACCEPTED":
      case "PREPARING":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">Accepted</span>;
      case "MARKED_READY":
      case "READY":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">Ready</span>;
      case "MARKED_SERVED":
      case "SERVED":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800">Served</span>;
      case "SETTLED_PAYMENT":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800 font-mono">Paid</span>;
      case "ITEM_PREPARED":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800">Item Prepped</span>;
      case "ITEM_UNPREPARED":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800">Item Reset</span>;
      case "CANCELLED":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">{action}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              Team & Operational Audit
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {activeRestaurant?.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Provision staff roles with scoped permissions and inspect chronological kitchen/floor activity logs.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-200/70 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("staff")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "staff"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Staff Members ({staffList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "audit"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Order Audit Log ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Staff Tab */}
      {activeTab === "staff" && (
        <div className="space-y-6">
          {/* Quick Staff Portal Invitation Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 border border-slate-700/60 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Dedicated Staff Station Portal</span>
              </div>
              <h3 className="font-display font-bold text-base text-white">
                Share login link with kitchen and floor staff
              </h3>
              <p className="text-xs text-slate-400">
                Staff log in with their assigned venue slug and PIN—bypassing owner credentials and landing directly on their authorized station.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="bg-slate-950/80 px-3.5 py-2 rounded-xl text-xs font-mono text-slate-300 border border-slate-800 truncate max-w-xs select-all">
                {staffPortalUrl}
              </div>
              <button
                onClick={copyPortalLink}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </div>

          {/* Controls Bar: Search & Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, email, role..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {(!user?.isStaff || user?.role === "OWNER") && (
              <button
                onClick={() => setInviteModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Staff Member</span>
              </button>
            )}
          </div>

          {/* Staff Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loadingStaff ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading team members...</div>
            ) : filteredStaff.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">No staff members found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add kitchen chefs and floor waiters to give them station access without sharing your owner account.
                </p>
                {(!user?.isStaff || user?.role === "OWNER") && (
                  <button
                    onClick={() => setInviteModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add First Staff Member</span>
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left text-xs divide-y divide-slate-100">
                <thead className="bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Added On</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{staff.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{staff.email}</div>
                      </td>
                      <td className="py-3.5 px-4">{getRoleBadge(staff.role)}</td>
                      <td className="py-3.5 px-4">
                        {staff.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(staff.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(staff.id, staff.isActive)}
                            className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                              staff.isActive
                                ? "border-slate-200 text-slate-600 hover:bg-slate-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                            title={staff.isActive ? "Deactivate staff" : "Activate staff"}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(staff.id, staff.name)}
                            className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                            title="Remove staff"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
              {[
                { label: "All Activity", value: "ALL" },
                { label: "Order Status", value: "STATUS" },
                { label: "Item Prep", value: "PREP" },
                { label: "Billing & Settlement", value: "PAYMENT" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setAuditFilter(f.value)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    auditFilter === f.value
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchAuditLogs}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loadingAudit ? "animate-spin" : ""}`} />
              <span>Refresh Log</span>
            </button>
          </div>

          {/* Audit Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loadingAudit ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading audit history...</div>
            ) : filteredAudit.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-900 text-sm">No audit activity recorded yet</h3>
                <p className="text-xs text-slate-500">
                  Order status updates, kitchen prep toggles, and payment settlements will appear here in real-time.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs divide-y divide-slate-100">
                <thead className="bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Order</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredAudit.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900">
                          {log.order?.orderNumber || log.orderId.slice(0, 8)}
                        </span>
                        {log.order?.table && (
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            ({log.order.table.label || `T${log.order.table.tableNumber}`})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{getActionBadge(log.action)}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800">{log.actorName}</span>
                        <span className="text-[10px] text-slate-400 ml-1 font-mono">
                          [{log.actorRole}]
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {log.details || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Invite Staff Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-display font-bold text-base text-slate-900">
                  Add Staff Member
                </h3>
              </div>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {inviteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marco Rossi"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@restaurant.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Station Login PIN or Password (min 4 characters)
                </label>
                <input
                  type="password"
                  required
                  placeholder="e.g. 4-digit PIN (4321)"
                  value={invitePin}
                  onChange={(e) => setInvitePin(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono tracking-widest focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Station Role & Scoped Permissions
                </label>
                <div className="space-y-2">
                  {[
                    {
                      role: "KITCHEN",
                      title: "Kitchen Station",
                      desc: "Direct access to Live KDS order board and dish preparation checklists.",
                      icon: ChefHat,
                    },
                    {
                      role: "WAITER",
                      title: "Floor & Dining",
                      desc: "Direct access to Live Table status, split bills, and payment settlement.",
                      icon: Users,
                    },
                    {
                      role: "MANAGER",
                      title: "Station Manager",
                      desc: "Operational access across KDS, floor, menu, and performance analytics.",
                      icon: ShieldCheck,
                    },
                  ].map((item) => {
                    const isSelected = inviteRole === item.role;
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.role}
                        onClick={() => setInviteRole(item.role as any)}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                          <span className="font-bold text-xs text-slate-900">{item.title}</span>
                          {isSelected && (
                            <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.2 rounded">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submittingInvite ? "Adding..." : "Add to Staff Roster"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamAuditPage;
