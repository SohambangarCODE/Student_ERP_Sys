import { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { getMyChildren, getChildResults } from "../api/parentApi";
import { generateReportCard } from "../utils/generateReportCard";
import { getMyInstitute } from "../api/instituteApi";

function MyResults() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const [institute, setInstitute] = useState(null);

  useEffect(() => {
    getMyInstitute().then((res) => setInstitute(res.data));
  }, []);

  useEffect(() => {
    getMyChildren().then((res) => {
      setChildren(res.data);
      if (res.data.length > 0) setSelectedChild(res.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    setLoading(true);
    getChildResults(selectedChild)
      .then((res) => setResults(res.data))
      .finally(() => setLoading(false));
  }, [selectedChild]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Exam Results
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View exam performance and marks
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

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : results.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
          No exam results published yet.
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((r) => {
            const total = r.marks.reduce((sum, m) => sum + m.marksObtained, 0);
            return (
              <div
                key={r._id}
                className="bg-white rounded-xl border border-slate-200 p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {r.examId?.name || "Exam"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {r.examId?.examDate
                        ? new Date(r.examId.examDate).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-semibold text-brand-600">
                      {total} marks
                    </p>
                    <button
                      onClick={async () => {
                        const child = children.find(
                          (c) => c._id === selectedChild,
                        );
                        await generateReportCard({
                          institute,
                          student: child,
                          examResult: r,
                        });
                      }}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 border border-brand-200 rounded-lg px-2.5 py-1.5"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {r.marks.map((m) => (
                    <div
                      key={m.subjectName}
                      className="bg-slate-50 rounded-lg p-3 text-center"
                    >
                      <p className="text-xs text-slate-500">{m.subjectName}</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {m.marksObtained}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

export default MyResults;
