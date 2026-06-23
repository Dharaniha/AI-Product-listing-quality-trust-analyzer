import { createContext, useContext, useState, useCallback, useRef } from 'react';

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const inFlight = useRef(false);

  const runAnalysis = useCallback(async (formData) => {
    console.log('runAnalysis CALLED at', performance.now());

    if (inFlight.current) {
      console.warn("runAnalysis already in progress — ignoring duplicate call");
      return null;
    }

    if (!formData || Object.keys(formData).length === 0) {
      console.error("Analysis error: Empty form data");
      return null;
    }

    inFlight.current = true;
    setIsAnalysing(true);

    try {
      const token = sessionStorage.getItem('tl_token');

      // Build multipart FormData so real image files get uploaded
      const body = new FormData();

      // Append all text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'images') {
          body.append(key, value ?? '');
        }
      });

      // Append real image files
      (formData.images || []).forEach((file) => {
        if (file instanceof File) {
          body.append('images', file, file.name);
        }
      });

      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${apiBase}/analysis/run`, {
        method: 'POST',
        headers: {
          // DO NOT set Content-Type — browser sets it automatically
          // with the correct multipart boundary for FormData
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");

      const result = data.data ?? data;
      setAnalysisResult(result);
      return result;

    } catch (err) {
      console.error("Analysis error:", err);
      setAnalysisResult(null);
      return null;
    } finally {
      setIsAnalysing(false);
      inFlight.current = false;
    }
  }, []);

  const clearResult = useCallback(() => setAnalysisResult(null), []);

  return (
    <AnalysisContext.Provider value={{
      analysisResult, setAnalysisResult, isAnalysing, runAnalysis, clearResult,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  return useContext(AnalysisContext);
}