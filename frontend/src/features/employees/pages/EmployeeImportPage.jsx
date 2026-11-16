/**
 * @file EmployeeImportPage.jsx
 * @description Bulk Employee Ingestion Portal with Template Download & Row-Level Error Reports.
 * 
 * SPECIFICATION & DATAFLOW:
 * - Module: M3 Employee Management (BUILD-GUIDE Section 8 · Row 3.13)
 * - Layer: Frontend Page (Multi-step upload and row error inspection)
 * - Theme: Forest & Emerald Enterprise Craft.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  FileText
} from 'lucide-react';
import { Card } from '../../../components/common/Card.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { useImportEmployeesMutation } from '../employeesApi.js';

export default function EmployeeImportPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const [importEmployees, { isLoading }] = useImportEmployeesMutation();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Invalid file format. Please upload an Excel spreadsheet (.xlsx)');
      return;
    }
    setFile(selectedFile);
    setImportResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent =
      'Employee Code,Full Name,Email,Phone,CNIC,Department Code,Designation Code,Employment Type,Joining Date,Bank Name,Account Title,Account Number,IBAN\n' +
      'EMP-101,Hamza Tariq,hamza.tariq@company.pk,+92 300 1234567,35202-1234567-1,ENG,SWE,Permanent,2026-01-15,Meezan Bank,Hamza Tariq,0101010101,PK36MEZN0001010101010101\n' +
      'EMP-102,Ayesha Malik,ayesha.malik@company.pk,+92 321 7654321,35201-9876543-2,HR,HRG,Probation,2026-02-01,HBL,Ayesha Malik,0202020202,PK42HABB0002020202020202\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'employee_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample import template downloaded');
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select an Excel spreadsheet to upload');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await importEmployees(formData).unwrap();
      setImportResult(res.data);
      if (res.data.succeeded > 0) {
        toast.success(`Successfully imported ${res.data.succeeded} employees`);
      }
      if (res.data.failed > 0) {
        toast.warning(`${res.data.failed} rows failed validation`);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to process spreadsheet upload');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <button
        type="button"
        onClick={() => navigate('/employees')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Employee Directory
      </button>

      <PageHeader
        title="Bulk Employee Ingestion"
        description="Batch onboard staff from structured Excel spreadsheets with automated Pakistani CNIC validation and row-level error reporting."
        actions={
          <button
            type="button"
            onClick={downloadSampleTemplate}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-[#15241C] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Download Template
          </button>
        }
      />

      {/* Upload Zone Card */}
      <Card className="p-8 border-slate-200 dark:border-[#1A3125]">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
            isDragging
              ? 'border-[#00C471] bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-[#1A3125] hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-[#0A110D]/50'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-[#00C471] flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-800/60 shadow-xs">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
            {file ? file.name : 'Drag and drop your spreadsheet here'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Supports Microsoft Excel (.xlsx, .xls) and standard CSV files up to 10MB.
          </p>

          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors">
            <FileSpreadsheet className="w-4 h-4" /> Browse Files
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {file && (
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{file.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {(file.size / 1024).toFixed(1)} KB • Ready for processing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setImportResult(null);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-[#00C471] hover:bg-[#00ad64] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing Spreadsheet...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" /> Process & Ingest
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Import Results Summary */}
      {importResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 border-slate-200 dark:border-[#1A3125]">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Rows Processed
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1 block">
                {importResult.total}
              </span>
            </Card>

            <Card className="p-5 border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  Successfully Ingested
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                {importResult.succeeded}
              </span>
            </Card>

            <Card className="p-5 border-rose-200 dark:border-rose-800/40 bg-rose-50/30 dark:bg-rose-950/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
                  Rejected / Failed
                </span>
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <span className="text-2xl font-bold text-rose-700 dark:text-rose-300 font-mono mt-1 block">
                {importResult.failed}
              </span>
            </Card>
          </div>

          {/* Row-by-Row Error Report */}
          {importResult.errors && importResult.errors.length > 0 && (
            <Card className="p-6 border-slate-200 dark:border-[#1A3125] space-y-4">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Row-Level Ingestion Rejections</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The following rows contained validation errors and were rejected to safeguard data integrity. Valid rows from the same sheet were ingested.
              </p>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#1A3125]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#0A110D] text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-[#1A3125]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold w-16">Row #</th>
                      <th className="py-2.5 px-4 font-semibold w-28">Employee Code</th>
                      <th className="py-2.5 px-4 font-semibold w-40">Candidate Name</th>
                      <th className="py-2.5 px-4 font-semibold">Validation Error Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                    {importResult.errors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-[#15241C]">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {err.row}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-800 dark:text-slate-200 font-medium">
                          {err.employeeCode}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                          {err.name}
                        </td>
                        <td className="py-2.5 px-4 text-rose-600 dark:text-rose-400 font-medium">
                          {err.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
