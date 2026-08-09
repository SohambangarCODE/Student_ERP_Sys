import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import Table from "../components/Table";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Button from "../components/Button";
import { getStudents, createStudent, updateStudent } from "../api/studentApi";
import { getBatches } from "../api/batchApi";
import { createParent } from "../api/parentApi";
import { useLocation } from "react-router-dom";

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

  // Creating a NEW student — form starts empty, no existing student to read from
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

  // Editing an EXISTING student — form pre-fills from the row that was clicked
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

    // Mongoose's batchId field expects either a valid ObjectId or null — never an empty string.
    // The "No batch assigned" option in our dropdown submits "" by default, so we convert it here.
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
      key: "addParent",
      label: "",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openParentModal(row);
          }}
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          + Parent Login
        </button>
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
        isOpen={isParentModalOpen}
        onClose={() => setIsParentModalOpen(false)}
        title={`Add Parent Login for ${parentTargetStudent?.name || ""}`}
      >
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
              Create Parent Login
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

export default Students;
