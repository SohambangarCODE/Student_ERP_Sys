import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../components/DashboardLayout";
import Table from "../components/Table";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Button from "../components/Button";
import {
  getStudents,
  createStudent,
  updateStudent,
  removeFromBatch,
  updateStudentStatus,
  permanentlyDeleteStudent,
  unlinkParent,
} from "../api/studentApi";
import { getBatches } from "../api/batchApi";
import { createParent } from "../api/parentApi";
import { useLocation } from "react-router-dom";
import { MoreVertical, UserMinus, UserX, Trash2, Check } from "lucide-react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";

function Students() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    admissionNumber: "",
    name: "",
    dateOfBirth: "",
    gender: "male",
    batchId: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [parentTargetStudent, setParentTargetStudent] = useState(null);
  const [parentFormData, setParentFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [parentSaving, setParentSaving] = useState(false);
  const [parentError, setParentError] = useState("");

  const { user } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const showMessage = (type, text) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleRemoveFromBatch = async (student) => {
    if (
      !window.confirm(
        `Remove ${student.name} from their batch? Their record and history stay intact.`,
      )
    )
      return;
    try {
      await removeFromBatch(student._id);
      showMessage("success", `${student.name} removed from their batch.`);
      fetchStudents();
    } catch (err) {
      showMessage("error", "Failed to remove from batch");
    }
  };

  const handleUnlinkParent = async (student, parent) => {
  if (
    !window.confirm(
      `Unlink ${parent.name} from ${student.name}? They will lose access to this student's data.`,
    )
  )
    return;
  try {
    await unlinkParent(student._id, parent._id);
    showMessage(
      "success",
      `${parent.name} has been unlinked from ${student.name}.`,
    );
    // Update local state immediately, instead of waiting for a full refetch —
    // removes any lag between "unlink succeeded" and "the UI actually shows it."
    setStudents((prev) =>
      prev.map((s) =>
        s._id === student._id
          ? { ...s, parentIds: s.parentIds.filter((p) => p._id !== parent._id) }
          : s
      )
    );
  } catch (err) {
    showMessage(
      "error",
      err.response?.data?.message || "Failed to unlink parent",
    );
  }
};

  const handleMarkDropped = async (student) => {
    if (
      !window.confirm(
        `Mark ${student.name} as dropped? They'll be hidden from active lists but all history is kept.`,
      )
    )
      return;
    try {
      await updateStudentStatus(student._id, "dropped");
      showMessage("success", `${student.name} marked as dropped.`);
      fetchStudents();
    } catch (err) {
      showMessage("error", "Failed to update status");
    }
  };

  const handlePermanentDelete = async () => {
    if (confirmText !== deleteTarget.name) return;
    setDeleting(true);
    try {
      await permanentlyDeleteStudent(deleteTarget._id);
      showMessage("success", `${deleteTarget.name} was permanently deleted.`);
      setDeleteTarget(null);
      setConfirmText("");
      fetchStudents();
    } catch (err) {
      showMessage(
        "error",
        err.response?.data?.message || "Failed to delete student",
      );
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    getBatches().then((res) => setBatches(res.data));
  }, []);

  const location = useLocation();

  useEffect(() => {
    if (location.state?.openStudentId && students.length > 0) {
      const target = students.find(
        (s) => s._id === location.state.openStudentId,
      );
      if (target) openEditModal(target);
    }
  }, [location.state, students]);

  const openParentModal = (student) => {
    setParentTargetStudent(student);
    setParentFormData({ name: "", email: "", password: "", phone: "" });
    setParentError("");
    setIsParentModalOpen(true);
  };

  const handleParentSubmit = async (e) => {
    e.preventDefault();
    setParentSaving(true);
    setParentError("");
    try {
      await createParent({
        ...parentFormData,
        studentIds: [parentTargetStudent._id],
      });
      setIsParentModalOpen(false);
      showMessage(
        "success",
        `Parent login created for ${parentTargetStudent.name}.`,
      );
      fetchStudents();
    } catch (err) {
      setParentError(
        err.response?.data?.message || "Failed to create parent account",
      );
    } finally {
      setParentSaving(false);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await getStudents();
      setStudents(res.data);
    } catch (err) {
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setFormData({
      admissionNumber: "",
      name: "",
      dateOfBirth: "",
      gender: "male",
      batchId: "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      admissionNumber: student.admissionNumber,
      name: student.name,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
      gender: student.gender || "male",
      batchId: student.batchId?._id || student.batchId || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    const payload = { ...formData, batchId: formData.batchId || null };

    try {
      if (editingStudent) {
        await updateStudent(editingStudent._id, payload);
      } else {
        await createStudent(payload);
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save student");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "admissionNumber", label: "Admission No." },
    { key: "name", label: "Name" },
    { key: "gender", label: "Gender" },
    {
      key: "batchId",
      label: "Batch",
      render: (row) =>
        row.batchId?.name || <span className="text-slate-400">Unassigned</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
            row.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "parentLinked",
      label: "Parent",
      render: (row) =>
        row.parentIds?.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-700">
            <Check size={12} /> Linked
          </span>
        ) : (
          <span className="text-xs text-slate-400">Not linked</span>
        ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <RowActionsMenu
          row={row}
          onAddParent={openParentModal}
          onRemoveFromBatch={handleRemoveFromBatch}
          onMarkDropped={handleMarkDropped}
          onDelete={setDeleteTarget}
          onUnlinkParent={handleUnlinkParent}
          canDelete={user?.role === "super_admin"}
        />
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage student admissions and records
          </p>
        </div>
        <Button onClick={openCreateModal}>+ Add Student</Button>
      </div>

      {actionMessage && (
        <div
          className={`rounded-lg px-3 py-2 text-sm border mb-4 ${
            actionMessage.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading students...</p>
      ) : (
        <Table
          columns={columns}
          data={students}
          onRowClick={openEditModal}
          emptyMessage="No students yet. Click 'Add Student' to admit your first one."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? "Edit Student" : "Add Student"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Admission Number"
            value={formData.admissionNumber}
            onChange={(e) =>
              setFormData({ ...formData, admissionNumber: e.target.value })
            }
            required
          />
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) =>
              setFormData({ ...formData, dateOfBirth: e.target.value })
            }
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Batch
            </label>
            <select
              value={formData.batchId}
              onChange={(e) =>
                setFormData({ ...formData, batchId: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">No batch assigned</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {formError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} className="flex-1">
              {editingStudent ? "Save Changes" : "Add Student"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setConfirmText("");
        }}
        title="Permanently delete student"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-3 text-sm text-red-700">
              This will permanently delete <strong>{deleteTarget.name}</strong>{" "}
              and all related records: attendance history, exam results, fee
              payments, and messages. This cannot be undone.
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Type <span className="font-mono">{deleteTarget.name}</span> to
                confirm
              </label>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="danger"
                onClick={handlePermanentDelete}
                disabled={confirmText !== deleteTarget.name}
                loading={deleting}
                className="flex-1"
              >
                Delete permanently
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDeleteTarget(null);
                  setConfirmText("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isParentModalOpen}
        onClose={() => setIsParentModalOpen(false)}
        title={`Add Parent Login for ${parentTargetStudent?.name || ""}`}
      >
        {parentTargetStudent?.parentIds?.length > 0 && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-sm text-slate-700 mb-4">
            <p className="font-medium mb-1">Already linked:</p>
            {parentTargetStudent.parentIds.map((p) => (
              <p key={p._id} className="flex items-center gap-1.5">
                <Check size={13} className="text-green-600" />
                {p.name} <span className="text-slate-400">({p.email})</span>
              </p>
            ))}
            <p className="text-xs text-slate-500 mt-2">
              You can still add another parent below (e.g. the other guardian).
            </p>
          </div>
        )}

        <form onSubmit={handleParentSubmit} className="space-y-4">
          <Input
            label="Parent's Full Name"
            value={parentFormData.name}
            onChange={(e) =>
              setParentFormData({ ...parentFormData, name: e.target.value })
            }
            required
          />
          <Input
            label="Email"
            type="email"
            value={parentFormData.email}
            onChange={(e) =>
              setParentFormData({ ...parentFormData, email: e.target.value })
            }
            required
          />
          <Input
            label="Temporary Password"
            type="password"
            value={parentFormData.password}
            onChange={(e) =>
              setParentFormData({ ...parentFormData, password: e.target.value })
            }
            required
          />
          <Input
            label="Phone"
            value={parentFormData.phone}
            onChange={(e) =>
              setParentFormData({ ...parentFormData, phone: e.target.value })
            }
          />

          {parentError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {parentError}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={parentSaving} className="flex-1">
              {parentTargetStudent?.parentIds?.length > 0
                ? "Add Another Parent Login"
                : "Create Parent Login"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsParentModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

function RowActionsMenu({
  row,
  onAddParent,
  onRemoveFromBatch,
  onMarkDropped,
  onDelete,
  onUnlinkParent,
  canDelete,
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOpen = (e) => {
    e.stopPropagation();
    if (!open) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.right - 224 });
    }
    setOpen(!open);
  };

  const wrap = (fn) => (e) => {
    e.stopPropagation();
    setOpen(false);
    fn(row);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        aria-label="Row actions"
      >
        <MoreVertical size={16} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: coords.top, left: coords.left }}
            className="w-56 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50"
          >
            {row.parentIds?.length > 0 && (
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Linked parent{row.parentIds.length > 1 ? "s" : ""}
                </p>
                {row.parentIds.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between gap-2 py-0.5"
                  >
                    <span className="text-sm text-slate-900 flex items-center gap-1 truncate">
                      <Check size={13} className="text-green-600 shrink-0" />{" "}
                      {p.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpen(false);
                        onUnlinkParent(row, p);
                      }}
                      className="text-xs text-red-500 hover:text-red-700 shrink-0"
                    >
                      Unlink
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={wrap(onAddParent)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <span className="text-brand-600 font-medium">+</span>
              {row.parentIds?.length > 0
                ? "Add another parent login"
                : "Add parent login"}
            </button>

            {row.batchId && (
              <button
                onClick={wrap(onRemoveFromBatch)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserMinus size={14} className="text-slate-400" /> Remove from
                batch
              </button>
            )}

            {row.status !== "dropped" && (
              <button
                onClick={wrap(onMarkDropped)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserX size={14} className="text-amber-500" /> Mark as dropped
              </button>
            )}

            {canDelete && (
              <>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={wrap(onDelete)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} /> Delete permanently
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

export default Students;