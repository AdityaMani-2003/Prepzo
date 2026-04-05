"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle, Target, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { parseAIContent } from "@/utils/parseAI";

interface AnalysisResult {
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedText, setParsedText] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isOcrActive, setIsOcrActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setIsSuccess(false);
    setAnalysisResult(null);
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf" || selectedFile.type === "text/plain") {
        setFile(selectedFile);
        setParsedText(""); // reset
      } else {
        setFile(null);
        setError("Only .pdf and .txt files are supported.");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setError(null);
    setIsSuccess(false);
    setAnalysisResult(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" || droppedFile.type === "text/plain") {
        setFile(droppedFile);
        setParsedText("");
      } else {
        setError("Only .pdf and .txt files are supported.");
      }
    }
  };

  const extractTextFromPDF = async (fileData: ArrayBuffer): Promise<string> => {
    try {
      // Dynamically import to prevent SSR DOMMatrix crashes
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const loadingTask = pdfjsLib.getDocument({ data: fileData });
      const pdf = await loadingTask.promise;
      let fullText = "";

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      return fullText.trim();
    } catch (parseError) {
      console.error("PDF Parsing Failure:", parseError);
      throw new Error("Unable to parse this PDF file. Please ensure it is a valid text-based resume (not an image scan) or try uploading a .txt file instead.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setIsOcrActive(false);
    setError(null);
    setIsSuccess(false);

    try {
      let extractedText = "";

      // 1. Text Extraction (Client-Side Fast Path)
      if (file.type === "text/plain") {
        extractedText = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsText(file);
        });
      } else if (file.type === "application/pdf") {
        try {
           const arrayBuffer = await file.arrayBuffer();
           extractedText = await extractTextFromPDF(arrayBuffer);
        } catch (clientFallbackTrigger) {
           // Client parsing failed — escalate to server-side extraction
        }
      }

      // 2. OCR Server Boundary Fallback
      if (!extractedText || extractedText.trim().length < 50) {
        setIsOcrActive(true);


        const formData = new FormData();
        formData.append("file", file);

        const parseRes = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });

        if (!parseRes.ok) {
           const errData = await parseRes.json().catch(() => ({}));
           throw new Error(errData.error || "Advanced parsing engine failed to analyze document.");
        }

        const parseData = await parseRes.json();
        extractedText = parseData.text;
      }

      if (!extractedText || !extractedText.trim()) {
        throw new Error("The Intelligence Engine could not synthesize any meaningful typography from this file.");
      }

      setParsedText(extractedText);

      // 2. Save to database
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          parsedText: extractedText,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to upload parsed resume data to server.");
      }

      setIsSuccess(true);
      setIsAnalyzing(true);

      // 3. AI Analysis
      try {


        const analysisRes = await fetch("/api/resume/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: extractedText }),
        });

        if (!analysisRes.ok) throw new Error("AI Analysis API returned " + analysisRes.status);

        const data = await analysisRes.json();


        setAnalysisResult({
          skills: Array.isArray(data.skills) ? data.skills : [],
          strengths: Array.isArray(data.strengths) ? data.strengths : [],
          weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        });
      } catch (analysisErr: any) {
        console.error("Analysis Pipeline Issue:", analysisErr);
        setError("AI analysis failed. Please verify API key configuration.");
      } finally {
        setIsAnalyzing(false);
      }

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during parsing or uploading.");
    } finally {
      setIsUploading(false);
      setIsOcrActive(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-8 w-full animate-fadeInUp">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
          Resume Intelligence
        </h2>
        <p className="text-[13px] text-gray-500">
          Upload your resume for personalized interview coaching.
        </p>
      </div>

      <Card>
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-14 text-center transition-all duration-300 ${
            file ? "border-indigo-500/40 bg-indigo-500/[0.03]" : "border-white/[0.08] bg-[#0B0F19] hover:border-white/[0.15]"
          }`}
        >
          <input
            type="file"
            accept=".pdf,.txt"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="mb-5 rounded-xl bg-white/[0.04] p-4">
            <UploadCloud className="h-7 w-7 text-gray-500" />
          </div>

          {!file ? (
            <>
              <p className="mb-2 text-[15px] font-medium text-white">Drag & drop your resume here</p>
              <p className="mb-6 text-[13px] text-gray-500">Supports .pdf and .txt files up to 2MB</p>
              <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
                Browse Files
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Ready to upload:</p>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#111827] px-4 py-2 text-white text-[13px] font-medium">
                <FileText className="h-4 w-4 text-gray-400" />
                {file.name}
              </div>
              <div className="pt-2">
                <Button onClick={() => setFile(null)} variant="secondary" className="text-xs">
                  Remove File
                </Button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {isSuccess && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-[13px] text-emerald-500">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <p>Upload mapped successfully to configuration base.</p>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading || isAnalyzing}
            loading={isUploading}
            variant="primary"
          >
            Process Resume
          </Button>
        </div>
      </Card>

      {/* Premium Loading State for AI Analysis */}
      {(isAnalyzing || isOcrActive) && (
         <Card className="animate-in zoom-in-95 duration-500 relative border-indigo-500/20 bg-white dark:bg-[#111827] shadow-xl">
           <div className="absolute inset-0 bg-indigo-500/5 animate-pulse rounded-xl" />
           <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center">
             <div className="relative h-16 w-16 mb-6">
               <svg className="absolute inset-0 w-full h-full text-indigo-500 animate-[spin_1s_linear_infinite]" viewBox="0 0 50 50">
                 <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="60 40" />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center">
                  <Target className="h-5 w-5 text-indigo-400" />
               </div>
             </div>
             <h3 className="text-[18px] font-semibold text-gray-900 dark:text-white mb-2">
                {isOcrActive ? "Activating Neural Recognition..." : "Analyzing Candidate Profile..."}
             </h3>
             <p className="text-[13px] text-gray-500 mb-8">
                Extracting semantic vectors and aligning professional history.
             </p>
             <div className="flex flex-col items-start gap-3 w-48 text-left mx-auto">
               <div className="flex items-center gap-3 text-[13px] font-medium text-gray-400 animate-pulse">
                 <div className="w-2 h-2 rounded-full bg-indigo-500" />
                 Parsing document...
               </div>
               <div className="flex items-center gap-3 text-[13px] font-medium text-gray-400 animate-pulse" style={{ animationDelay: "0.4s" }}>
                 <div className="w-2 h-2 rounded-full bg-indigo-500" />
                 Mapping skills...
               </div>
               <div className="flex items-center gap-3 text-[13px] font-medium text-gray-400 animate-pulse" style={{ animationDelay: "0.8s" }}>
                 <div className="w-2 h-2 rounded-full bg-indigo-500" />
                 Building profile...
               </div>
             </div>
           </div>
         </Card>
      )}

      {/* Render the Preview Card upon successful parsing */}
      {isSuccess && !isAnalyzing && parsedText && (
        <div className="animate-in fade-in duration-500 bg-white dark:bg-[#0c0c10] border border-gray-200 dark:border-white/[0.08] rounded-xl p-5">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">Source Verification</h3>
              <div className="bg-indigo-500/10 text-indigo-500 rounded-full px-3 py-1 text-[11px] font-semibold">
                {parsedText.split(" ").length} words parsed
              </div>
           </div>
           <div className="max-h-[240px] overflow-y-auto rounded-lg bg-gray-50 dark:bg-[#111118] border border-gray-200 dark:border-white/[0.06] p-4 text-[12px] leading-[1.8] text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap">
             {parsedText}
           </div>
        </div>
      )}

      {/* Render AI Analysis Results */}
      {analysisResult && !isAnalyzing && (
        <Card className="animate-in fade-in duration-500">
          <h3 className="mb-6 text-[15px] font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/[0.06] pb-4">
            Context Mapping Analysis
          </h3>
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h4 className="mb-3 font-semibold text-gray-900 dark:text-white text-[13px]">Identified Skills</h4>
              <div className="flex flex-wrap gap-2">
                {(analysisResult?.skills || []).length === 0 ? (
                  <p className="text-[13px] text-gray-500 italic">No skills mapped.</p>
                ) : (
                  (analysisResult?.skills || []).map((skill, i) => (
                    <div key={i} className="rounded-full bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 text-[12px] px-3 py-1 animate-itemIn" style={{ animationDelay: `${i * 30}ms` }}>
                      {skill}
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div>
              <h4 className="mb-3 font-semibold text-emerald-600 dark:text-emerald-400 text-[13px]">Key Strengths</h4>
              <ul className="space-y-3">
                {(analysisResult?.strengths || []).length === 0 ? (
                  <p className="text-[13px] text-gray-500 italic">No strengths mapped.</p>
                ) : (
                  (analysisResult?.strengths || []).map((str, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600 dark:text-gray-400 animate-itemIn" style={{ animationDelay: `${i * 40}ms` }}>
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <div dangerouslySetInnerHTML={{ __html: parseAIContent(str) }} />
                    </li>
                  ))
                )}
              </ul>
            </div>
            
            <div>
              <h4 className="mb-3 font-semibold text-amber-600 dark:text-amber-400 text-[13px]">System Weaknesses</h4>
              <ul className="space-y-3">
                {(analysisResult?.weaknesses || []).length === 0 ? (
                  <p className="text-[13px] text-gray-500 italic">No weaknesses mapped.</p>
                ) : (
                  (analysisResult?.weaknesses || []).map((weak, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600 dark:text-gray-400 animate-itemIn" style={{ animationDelay: `${i * 50}ms` }}>
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <div dangerouslySetInnerHTML={{ __html: parseAIContent(weak) }} />
                    </li>
                  ))
                )}
              </ul>
            </div>
            
            <div>
              <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-300 text-[13px]">Suggestions</h4>
              <ul className="space-y-3">
                {(analysisResult?.suggestions || []).length === 0 ? (
                  <p className="text-[13px] text-gray-500 italic">No suggestions mapped.</p>
                ) : (
                  (analysisResult?.suggestions || []).map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600 dark:text-gray-400 animate-itemIn" style={{ animationDelay: `${i * 60}ms` }}>
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                      <div dangerouslySetInnerHTML={{ __html: parseAIContent(point) }} />
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
