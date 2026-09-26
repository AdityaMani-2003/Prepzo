"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  RefreshCw,
  Sparkles,
  Award,
  Layers,
  Briefcase,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumeRecord {
  id: string;
  file_name: string;
  parsed_text: string;
  created_at: string;
}

interface ResumeAnalysis {
  skills: string[];
  suggestedRoles: string[];
  summary: string;
  experienceLevel: string;
}

export default function ResumePage() {
  const [existingResume, setExistingResume] = useState<ResumeRecord | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showFullText, setShowFullText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing resume
  const fetchResume = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/resume");
      const data = await res.json();
      if (data.resume) {
        setExistingResume(data.resume);
        // Analyze text if available
        analyzeResume(data.resume.parsed_text);
      } else {
        setExistingResume(null);
      }
    } catch (err: any) {
      console.warn("Failed to load resume:", err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeResume = async (text: string) => {
    try {
      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch {
      // Best-effort
    }
  };

  useEffect(() => {
    fetchResume();
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate type & size
    const validExtensions = [".pdf", ".txt"];
    const hasValidExt = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setError("Please upload a PDF (.pdf) or text (.txt) file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("File size exceeds 8MB limit.");
      return;
    }

    setError(null);
    setSuccess(null);
    setUploading(true);

    try {
      // Step 1: Parse Text (with OCR fallback on server)
      setProcessingStep("Extracting text and structure (with OCR fallback)...");
      const formData = new FormData();
      formData.append("file", file);

      const parseRes = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      if (!parseRes.ok) {
        const pErr = await parseRes.json().catch(() => ({}));
        throw new Error(pErr.error || "Could not parse document content.");
      }

      const { text, fileName } = await parseRes.json();

      // Step 2: Store & Vectorize for RAG
      setProcessingStep("Generating 768-dim embeddings with Gemini pgvector...");
      const saveRes = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          parsedText: text,
        }),
      });

      if (!saveRes.ok) {
        throw new Error("Failed to vectorize and save resume.");
      }

      // Step 3: Extract Skills & Roles
      setProcessingStep("Extracting core skills & interview domains...");
      await analyzeResume(text);

      setSuccess("Resume processed and vectorized for RAG interview generation!");
      await fetchResume();
    } catch (err: any) {
      setError(err?.message || "Failed to process resume.");
    } finally {
      setUploading(false);
      setProcessingStep("");
    }
  };

  const handleDeleteResume = async () => {
    if (!confirm("Are you sure you want to delete your resume and vector embeddings?")) return;

    try {
      setLoading(true);
      await fetch("/api/resume", { method: "DELETE" });
      setExistingResume(null);
      setAnalysis(null);
      setSuccess("Resume removed.");
    } catch (err: any) {
      setError("Failed to delete resume.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
          <FileText className="h-4 w-4" />
          Candidate Knowledge Base
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Resume Intelligence & RAG Context
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Upload your resume to calibrate interview difficulty and enable AI to cross-examine your claims against your verified project history.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-[var(--red-subtle)] border border-red-500/20 text-xs text-[var(--red)] flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-[var(--green-subtle)] border border-green-500/20 text-xs text-[var(--green)] flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Upload Box */}
      <div
        className="rounded-2xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--bg-card)] p-8 text-center hover:border-[var(--accent)] transition-all cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
          }}
        />

        <div className="flex flex-col items-center justify-center">
          <div className="rounded-2xl bg-[var(--accent-subtle)] p-4 text-[var(--accent)] mb-4 transition-transform group-hover:scale-110">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Upload className="h-8 w-8" />
            )}
          </div>

          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {uploading ? "Processing Document..." : "Click or Drag & Drop Resume"}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm">
            Supported formats: PDF (.pdf) and plain text (.txt). Scanned PDFs are automatically processed via Gemini Vision OCR. Max 8MB.
          </p>

          {processingStep && (
            <div className="mt-4 flex items-center gap-2 rounded-full bg-[var(--bg-surface)] px-4 py-1.5 text-xs text-[var(--accent)] font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{processingStep}</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Resume Details Card */}
      {existingResume && (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6 shadow-sm space-y-6 animate-fadeIn">
          {/* File Meta Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {existingResume.file_name}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Vectorized on{" "}
                  {new Date(existingResume.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Replace
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteResume}
                className="h-8 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
            </div>
          </div>

          {/* AI Intelligence Snapshot */}
          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Profile Summary */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Executive Summary
                </span>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {analysis.summary}
                </p>
                <div className="pt-2 text-[11px] font-semibold text-[var(--text-muted)]">
                  Experience Tier: <span className="text-[var(--text-primary)]">{analysis.experienceLevel}</span>
                </div>
              </div>

              {/* Detected Skills */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  Extracted Skills & Technologies
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {analysis.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-[var(--accent-subtle)] border border-[var(--border-strong)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Expandable Raw Text View */}
          <div className="border-t border-[var(--border-subtle)] pt-4">
            <button
              type="button"
              onClick={() => setShowFullText(!showFullText)}
              className="flex w-full items-center justify-between text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <span>View Extracted Plain Text ({existingResume.parsed_text.length} chars)</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  showFullText ? "rotate-180" : ""
                }`}
              />
            </button>

            {showFullText && (
              <div className="mt-3 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
                {existingResume.parsed_text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
