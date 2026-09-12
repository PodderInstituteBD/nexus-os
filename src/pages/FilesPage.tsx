import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Download,
  Trash2,
  Table,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { FileRecord } from '../types';
import { apiRequest } from '../lib/api';

export const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const data = await apiRequest<{ files: FileRecord[] }>('/files');
      setFiles(data.files);
      if (data.files.length > 0 && !selectedFile) {
        setSelectedFile(data.files[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load file records.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem('nexus_auth_token');
      const res = await fetch('/api/v1/files/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Upload failed');
      }

      const uploadedRecord: FileRecord = await res.json();
      setFiles((prev) => [uploadedRecord, ...prev]);
      setSelectedFile(uploadedRecord);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this file from the storage vault?')) return;
    try {
      await apiRequest(`/files/${id}`, { method: 'DELETE' });
      setFiles((prev) => prev.filter((f) => f.id !== id));
      if (selectedFile?.id === id) {
        setSelectedFile(null);
      }
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            <span>Artifact Vault & Python Data Lab</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Store build artifacts, specs, and test data. CSV files are automatically analyzed by our native Python engine.
          </p>
        </div>

        {/* Upload Trigger */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept=".csv,.json,.txt,.md,.png,.jpg,.pdf"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isUploading ? 'Analyzing & Uploading...' : 'Upload File'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Vault Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: File List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-2">
            Uploaded Artifacts ({files.length})
          </h3>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {files.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                No files uploaded. Upload a CSV to see Python data telemetry!
              </div>
            ) : (
              files.map((file) => {
                const isCsv = file.originalName.endsWith('.csv');
                const isSelected = selectedFile?.id === file.id;

                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate mr-2">
                      {isCsv ? (
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {file.originalName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {(file.size / 1024).toFixed(1)} KB &bull; {new Date(file.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <a
                        href={`/api/v1/files/${file.id}/download`}
                        download={file.originalName}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={(e) => handleDeleteFile(file.id, e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: File Telemetry & Python CSV Analytics */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedFile ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center text-xs text-slate-400">
              Select a file on the left to inspect metadata or view Python CSV telemetry.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              {/* File Info Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-slate-900">{selectedFile.originalName}</h2>
                    {selectedFile.csvAnalysis && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Python Analyzed</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-1">
                    MIME: {selectedFile.mimeType} | Size: {selectedFile.size} bytes
                  </div>
                </div>

                <a
                  href={`/api/v1/files/${selectedFile.id}/download`}
                  download={selectedFile.originalName}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>

              {/* If CSV Analysis exists from Python runner */}
              {selectedFile.csvAnalysis ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                      <Table className="w-4 h-4 text-emerald-600" />
                      <span>Python Data Summary</span>
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">
                      {selectedFile.csvAnalysis.rowCount} rows &times; {selectedFile.csvAnalysis.columnCount} columns
                    </span>
                  </div>

                  {/* Columns */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Schema Columns</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedFile.csvAnalysis.columns?.map((col) => (
                        <span
                          key={col}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sample Rows Preview */}
                  {selectedFile.csvAnalysis.sampleRows?.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Sample Preview</span>
                      <div className="mt-1 overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                            <tr>
                              {selectedFile.csvAnalysis.columns?.map((col) => (
                                <th key={col} className="p-2">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedFile.csvAnalysis.sampleRows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                {selectedFile.csvAnalysis!.columns?.map((col) => (
                                  <td key={col} className="p-2 text-slate-700">
                                    {String(row[col] ?? '')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  Standard binary or text file. Upload a <strong>.csv</strong> file to automatically trigger Python statistics extraction.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
