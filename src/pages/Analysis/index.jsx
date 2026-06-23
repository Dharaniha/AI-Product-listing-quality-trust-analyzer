import React, { useEffect, useRef, useState } from "react";
import { useAnalysis } from "./context/AnalysisContext";
import { useHistory } from "./context/HistoryContext";

export default function Index() {
  const { runAnalysis, loading } = useAnalysis();
  const { history, fetchHistory } = useHistory();

  const [input, setInput] = useState("");

  // ✅ prevents duplicate calls (VERY IMPORTANT)
  const hasFetchedHistory = useRef(false);

  // ✅ fetch history only ONCE
  useEffect(() => {
    if (hasFetchedHistory.current) return;
    hasFetchedHistory.current = true;

    fetchHistory();
  }, [fetchHistory]);

  // ✅ manual trigger (NOT auto loop)
  const handleRun = async () => {
    if (!input.trim()) return;

    try {
      await runAnalysis(input);

      // refresh history after insert
      fetchHistory();
    } catch (err) {
      console.error("Run failed:", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>TrustLens AI</h2>

      {/* INPUT */}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter product (e.g. airpods, laptop)"
      />

      <button onClick={handleRun} disabled={loading}>
        {loading ? "Analyzing..." : "Run Analysis"}
      </button>

      {/* HISTORY */}
      <h3>History</h3>
      <ul>
        {history?.map((item, idx) => (
          <li key={idx}>
            {item.listing_name} — {item.trust_score} ({item.trust_level})
          </li>
        ))}
      </ul>
    </div>
  );
}