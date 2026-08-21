import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import Button from "../components/Button";
import { getMyChildren, getChildFeeDetails } from "../api/parentApi";
import { createRazorpayOrder, verifyRazorpayPayment } from "../api/razorpayApi";
import { useAuth } from "../context/AuthContext";
import { generateFeeReceipt } from "../utils/generateFeeReceipt";
import { getMyInstitute } from "../api/instituteApi";

function MyFees() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState("");
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [institute, setInstitute] = useState(null);

  useEffect(() => {
    getMyChildren().then((res) => {
      setChildren(res.data);
      if (res.data.length > 0) setSelectedChild(res.data[0]._id);
    });
  }, []);

  useEffect(() => {
    getMyInstitute().then((res) => setInstitute(res.data));
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    loadFees();
  }, [selectedChild]);

  const loadFees = async () => {
    setLoading(true);
    try {
      const res = await getChildFeeDetails(selectedChild);
      setStructures(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (structure) => {
    setPayingId(structure._id);
    setMessage(null);
    try {
      const { data: order } = await createRazorpayOrder(structure.balanceDue);

      const options = {
        key: order.key,  // served from backend env — never hardcoded in source
        amount: order.amount,
        currency: order.currency,
        name: "Institute Fee Payment",
        order_id: order.id,
        handler: async (response) => {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              studentId: selectedChild,
              feeStructureId: structure._id,
              amountPaid: structure.balanceDue,
            });
            setMessage({
              type: "success",
              text: "Payment successful! Your balance has been updated.",
            });
            // Fetch this student's fresh totals so the receipt shows the UPDATED balance, not the stale pre-payment one
            const updatedStructures = await getChildFeeDetails(selectedChild);
            const updatedStructure = updatedStructures.data.find(
              (s) => s._id === structure._id,
            );
            const child = children.find((c) => c._id === selectedChild);

            await generateFeeReceipt({
              institute,
              student: child,
              payment: res.data,
              feeStructure: updatedStructure,
            });
            loadFees();
          } catch (err) {
            setMessage({
              type: "error",
              text: "Payment succeeded but recording it failed — contact your institute.",
            });
          }
        },
        prefill: { name: user?.name },
        theme: { color: "#4f46e5" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to start payment" });
    } finally {
      setPayingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pay Fees</h1>
          <p className="text-sm text-slate-500 mt-1">
            View and pay outstanding fees
          </p>
        </div>
        {children.length > 1 && (
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            {children.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {message && (
        <div
          className={`rounded-lg px-3 py-2 text-sm border mb-4 ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : structures.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
          No fee structure set up for this student's batch yet.
        </div>
      ) : (
        <div className="space-y-4">
          {structures.map((s) => (
            <div
              key={s._id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between flex-wrap gap-4"
            >
              <div>
                <p className="text-sm text-slate-500">Total Fee</p>
                <p className="text-lg font-semibold text-slate-900">
                  ₹{s.totalAmount.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  ₹{s.totalPaid.toLocaleString()} paid so far
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Balance Due</p>
                <p
                  className={`text-lg font-semibold ${s.balanceDue > 0 ? "text-red-600" : "text-green-600"}`}
                >
                  ₹{s.balanceDue.toLocaleString()}
                </p>
              </div>
              {s.balanceDue > 0 ? (
                <Button
                  onClick={() => handlePay(s)}
                  loading={payingId === s._id}
                >
                  Pay Now
                </Button>
              ) : (
                <span className="text-sm font-medium text-green-600">
                  Fully Paid ✓
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default MyFees;
