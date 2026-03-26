"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Award,
  Filter,
  Upload,
  FileText,
  X,
  User,
  Download,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRef } from "react";

const trainingTypes = [
  { code: "AR", name: "Armed Response", validity: "12 months", color: "text-tactical-red" },
  { code: "FA", name: "First Aid", validity: "24 months", color: "text-tactical-green" },
  { code: "FS", name: "Fire Safety", validity: "12 months", color: "text-tactical-amber" },
  { code: "CCTV", name: "CCTV Operation", validity: "24 months", color: "text-tactical-cyan" },
  { code: "AC", name: "Access Control", validity: "12 months", color: "text-[#A78BFA]" },
  { code: "K9", name: "K9 Handling", validity: "12 months", color: "text-tactical-amber" },
  { code: "VIP", name: "VIP Protection", validity: "6 months", color: "text-tactical-red" },
  { code: "BA", name: "Bomb Awareness", validity: "12 months", color: "text-tactical-red" },
];

const initialTrainingRecords = [
  { id: "TR-001", guardId: "G-001", guardName: "Ali Hassan", type: "AR", certNo: "AR-2025-0412", provider: "PSF Academy", completed: "2025-06-15", expiry: "2026-06-15", status: "valid" },
  { id: "TR-002", guardId: "G-001", guardName: "Ali Hassan", type: "FA", certNo: "FA-2025-0413", provider: "Red Crescent", completed: "2025-06-15", expiry: "2027-06-15", status: "valid" },
  { id: "TR-003", guardId: "G-002", guardName: "Bilal Khan", type: "AR", certNo: "AR-2025-0287", provider: "PSF Academy", completed: "2025-03-10", expiry: "2026-03-10", status: "expired" },
  { id: "TR-004", guardId: "G-002", guardName: "Bilal Khan", type: "CCTV", certNo: "CCTV-2025-0101", provider: "TechSec Institute", completed: "2025-08-20", expiry: "2027-08-20", status: "valid" },
  { id: "TR-005", guardId: "G-003", guardName: "Usman Raza", type: "AR", certNo: "AR-2025-0891", provider: "PSF Academy", completed: "2025-05-01", expiry: "2026-05-01", status: "expiring" },
  { id: "TR-006", guardId: "G-003", guardName: "Usman Raza", type: "FA", certNo: "FA-2025-0892", provider: "Red Crescent", completed: "2025-05-01", expiry: "2027-05-01", status: "valid" },
  { id: "TR-007", guardId: "G-003", guardName: "Usman Raza", type: "FS", certNo: "FS-2025-0344", provider: "Civil Defense", completed: "2025-05-01", expiry: "2026-05-01", status: "expiring" },
  { id: "TR-008", guardId: "G-005", guardName: "Imran Malik", type: "AR", certNo: "AR-2025-0634", provider: "PSF Academy", completed: "2025-09-12", expiry: "2026-09-12", status: "valid" },
  { id: "TR-009", guardId: "G-005", guardName: "Imran Malik", type: "K9", certNo: "K9-2025-0077", provider: "K9 Unit Rawalpindi", completed: "2025-09-12", expiry: "2026-09-12", status: "valid" },
  { id: "TR-010", guardId: "G-005", guardName: "Imran Malik", type: "FA", certNo: "FA-2025-0635", provider: "Red Crescent", completed: "2025-09-12", expiry: "2027-09-12", status: "valid" },
  { id: "TR-011", guardId: "G-009", guardName: "Kamran Yousuf", type: "VIP", certNo: "VIP-2025-0099", provider: "Elite Protection Academy", completed: "2025-10-01", expiry: "2026-04-01", status: "expiring" },
  { id: "TR-012", guardId: "G-009", guardName: "Kamran Yousuf", type: "AR", certNo: "AR-2025-0512", provider: "PSF Academy", completed: "2025-08-15", expiry: "2026-08-15", status: "valid" },
];

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  valid: { color: "text-tactical-green", bg: "bg-tactical-green/10", border: "border-tactical-green/30", label: "VALID" },
  expiring: { color: "text-tactical-amber", bg: "bg-tactical-amber/10", border: "border-tactical-amber/30", label: "EXPIRING" },
  expired: { color: "text-tactical-red", bg: "bg-tactical-red/10", border: "border-tactical-red/30", label: "EXPIRED" },
};

export default function TrainingPage() {
  const [mounted, setMounted] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [records, setRecords] = useState(initialTrainingRecords);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => setMounted(true), []);

  const handleVerifyCert = (recordId: string) => {
    setRecords(records.map(r => {
      if (r.id === recordId) {
        return {
          ...r,
          status: "valid",
          expiry: "2028-04-15",
          completed: "2026-04-15",
        };
      }
      return r;
    }));
    // immediately reflect changes in the selected record panel
    setSelectedRecord((prev: any) => ({
      ...prev,
      status: "valid",
      expiry: "2028-04-15",
      completed: "2026-04-15",
    }));
  };

  const filtered = records.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const counts = {
    valid: records.filter((r) => r.status === "valid").length,
    expiring: records.filter((r) => r.status === "expiring").length,
    expired: records.filter((r) => r.status === "expired").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-tactical-amber/10 border border-tactical-amber/30">
            <GraduationCap className="h-5 w-5 text-tactical-amber" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Training Management</h1>
            <p className="text-xs text-muted-foreground font-mono">MOD-03 — Certification Tracking & Eligibility</p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-tactical-amber hover:bg-tactical-amber/90 text-black font-mono text-[10px] font-bold tracking-wide transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,170,0,0.2)] cursor-pointer">
              <Upload className="h-4 w-4" />
              BULK UPLOAD
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-black border border-tactical-amber/30 text-foreground">
            <DialogHeader>
              <DialogTitle className="font-mono text-tactical-amber uppercase tracking-wider text-sm flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Bulk Training Records
              </DialogTitle>
              <DialogDescription className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                Upload CSV or Excel data to synchronize training registry.
              </DialogDescription>
            </DialogHeader>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer group my-4 ${
                selectedFile ? 'border-tactical-amber bg-tactical-amber/5' : 'border-border/40 hover:border-tactical-amber/50 hover:bg-tactical-amber/5'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files && e.target.files.length > 0 && setSelectedFile(e.target.files[0])} 
                className="hidden" 
                accept=".csv, .xlsx, .xls"
              />
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText className={`h-6 w-6 transition-colors ${selectedFile ? 'text-tactical-amber' : 'text-muted-foreground group-hover:text-tactical-amber'}`} />
              </div>
              {selectedFile ? (
                <>
                  <span className="font-mono text-xs font-bold mb-1 text-tactical-amber">{selectedFile.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">Ready for processing</span>
                </>
              ) : (
                <>
                  <span className="font-mono text-xs font-bold mb-1">DRAG & DROP FILES</span>
                  <span className="font-mono text-[10px] text-muted-foreground">or click to browse systems</span>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button className="px-4 py-2 font-mono text-[10px] bg-secondary hover:bg-secondary/80 rounded transition-colors uppercase tracking-widest border border-border">
                Template
              </button>
              <button 
                onClick={() => {
                  if (selectedFile) {
                    alert('Simulating CSV processing for: ' + selectedFile.name);
                    setSelectedFile(null);
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className={`px-4 py-2 font-mono text-[10px] font-bold rounded transition-colors uppercase tracking-widest shadow-[0_0_10px_rgba(255,170,0,0.3)] ${
                  selectedFile 
                    ? 'bg-tactical-amber hover:bg-tactical-amber/90 text-black' 
                    : 'bg-tactical-amber/50 text-black/50 cursor-pointer'
                }`}
              >
                {selectedFile ? "Process CSV" : "Select CSV"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Valid Certs", value: counts.valid, color: "text-tactical-green", bg: "bg-tactical-green-dim" },
          { label: "Expiring (45d)", value: counts.expiring, color: "text-tactical-amber", bg: "bg-tactical-amber-dim" },
          { label: "Expired", value: counts.expired, color: "text-tactical-red", bg: "bg-tactical-red-dim" },
        ].map((s, i) => (
          <div key={s.label} className={`glow-border rounded-lg p-4 bg-card noise-texture ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: `${i * 60}ms` }}>
            <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase block">{s.label}</span>
            <p className={`text-2xl font-bold font-mono mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Training Types Grid */}
      <div className={`${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "200ms" }}>
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase block mb-2">Training Types</span>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setTypeFilter("all")} className={`font-mono text-[9px] tracking-wider px-2.5 py-1.5 rounded transition-colors ${typeFilter === "all" ? "bg-tactical-amber/15 text-tactical-amber border border-tactical-amber/30" : "text-muted-foreground hover:text-foreground border border-border/50"}`}>ALL</button>
          {trainingTypes.map((t) => (
            <button key={t.code} onClick={() => setTypeFilter(t.code)} className={`font-mono text-[9px] tracking-wider px-2.5 py-1.5 rounded transition-colors ${typeFilter === t.code ? "bg-tactical-amber/15 text-tactical-amber border border-tactical-amber/30" : "text-muted-foreground hover:text-foreground border border-border/50"}`}>
              {t.code}
            </button>
          ))}
        </div>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {["all", "valid", "expiring", "expired"].map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)} className={`font-mono text-[9px] tracking-wider px-2.5 py-1.5 rounded transition-colors uppercase ${statusFilter === f ? "bg-accent text-foreground border border-border" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>{f}</button>
        ))}
      </div>

      {/* Records Table and Sidebar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start pb-6">
        
        {/* Main Table */}
        <div className={`flex-1 w-full min-w-0 glow-border rounded-lg bg-card noise-texture overflow-hidden ${mounted ? "fade-in-up" : "opacity-0"}`} style={{ animationDelay: "300ms" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60">
                  {["Record", "Guard", "Type", "Certificate", "Provider", "Completed", "Expiry", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] tracking-[0.15em] text-muted-foreground uppercase font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => {
                  const sc = statusConfig[record.status];
                  const typeInfo = trainingTypes.find((t) => t.code === record.type);
                  return (
                    <tr 
                      key={record.id} 
                      onClick={() => setSelectedRecord(record)}
                      className={`border-b border-border/20 transition-colors group cursor-pointer ${selectedRecord?.id === record.id ? "bg-accent/20 border-l-2 border-l-tactical-amber" : "hover:bg-accent/10 border-l-2 border-l-transparent"}`}
                    >
                      <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{record.id}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] font-medium block">{record.guardName}</span>
                        <span className="font-mono text-[9px] text-muted-foreground">{record.guardId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-[10px] font-bold ${typeInfo?.color || "text-foreground"}`}>{record.type}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-tactical-cyan">{record.certNo}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{record.provider}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground tabular-nums">{record.completed}</td>
                      <td className={`px-4 py-3 font-mono text-[10px] tabular-nums ${sc.color}`}>{record.expiry}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 font-mono text-[9px] tracking-wider px-2 py-0.5 rounded ${sc.bg} ${sc.color} border ${sc.border}`}>
                          {record.status === "valid" ? <CheckCircle2 className="h-2.5 w-2.5" /> : record.status === "expiring" ? <Clock className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
                          {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="font-mono text-xs text-muted-foreground">No training records match the current filter.</p>
            </div>
          )}
        </div>

        {/* Details Sidebar container */}
        {selectedRecord && (
          <div className="w-full lg:w-[350px] shrink-0 space-y-4 fade-in-up animate-in slide-in-from-right-4">
            <div className="glow-border rounded-lg bg-black border border-tactical-amber/30 overflow-hidden relative shadow-[0_0_20px_rgba(255,170,0,0.05)]">
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-tactical-amber/20 to-transparent flex items-start justify-between border-b border-tactical-amber/20">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-tactical-amber/20 flex items-center justify-center border border-tactical-amber/40">
                    <GraduationCap className="h-4 w-4 text-tactical-amber" />
                  </div>
                  <div>
                    <h3 className="font-mono text-xs font-bold tracking-wider">{selectedRecord.type} Cert</h3>
                    <span className="font-mono text-[9px] text-tactical-amber tracking-[0.15em]">{selectedRecord.id}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-white" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4">
                {/* ID Card Display */}
                <div className="flex items-center gap-4 p-3 bg-secondary/30 rounded border border-border/40">
                  <div className="h-16 w-12 bg-muted/30 rounded border border-border/50 flex flex-col items-center justify-center shrink-0">
                     <User className="h-6 w-6 text-muted-foreground/50 mb-1" />
                  </div>
                  <div className="flex-1 space-y-2 overflow-hidden">
                    <div>
                      <span className="block font-mono text-[8px] text-muted-foreground uppercase">Trainee Name</span>
                      <span className="font-mono text-[10px] font-bold truncate block">{selectedRecord.guardName}</span>
                    </div>
                    <div>
                      <span className="block font-mono text-[8px] text-muted-foreground uppercase">Registry ID</span>
                      <span className="font-mono text-[10px] tabular-nums tracking-widest">{selectedRecord.guardId}</span>
                    </div>
                  </div>
                </div>

                {/* Training Details */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                    <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Certificate No</span>
                    <span className="font-mono text-[10px] text-tactical-cyan font-bold">{selectedRecord.certNo}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                    <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Provider</span>
                    <span className="font-mono text-[10px] font-bold text-right truncate max-w-[140px]">{selectedRecord.provider}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                    <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Valid From</span>
                    <span className="font-mono text-[10px] tabular-nums">
                      {selectedRecord.completed}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                    <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Expiry Date</span>
                    <span className={`font-mono text-[10px] tabular-nums font-bold ${
                      selectedRecord.status === 'expired' ? 'text-tactical-red' : 
                      selectedRecord.status === 'expiring' ? 'text-tactical-amber' : 
                      'text-tactical-green'
                    }`}>
                      {selectedRecord.expiry}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/20">
                    <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">Status</span>
                    <span className={`font-mono text-[10px] font-bold tracking-widest uppercase ${
                      statusConfig[selectedRecord.status]?.color || "text-muted-foreground"
                    }`}>
                      {statusConfig[selectedRecord.status]?.label || selectedRecord.status}
                    </span>
                  </div>
                </div>

                {/* Tactical Actions */}
                <div className="pt-2 flex gap-2">
                  <button 
                    onClick={() => handleVerifyCert(selectedRecord.id)}
                    className="flex-1 bg-tactical-amber/10 hover:bg-tactical-amber/20 border border-tactical-amber/30 text-tactical-amber font-mono text-[9px] py-2 rounded transition-colors tracking-widest uppercase text-center cursor-pointer"
                  >
                    Verify Cert
                  </button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="flex-1 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-mono text-[9px] py-2 rounded transition-colors tracking-widest uppercase text-center cursor-pointer">
                        View Scan
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-black border border-tactical-amber/40 text-foreground">
                      <DialogHeader>
                        <DialogTitle className="font-mono text-tactical-amber uppercase tracking-wider text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Document Scan: {selectedRecord.certNo}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="mt-4 flex flex-col items-center justify-center p-4 border border-border/40 bg-zinc-950 rounded-lg h-[400px] relative overflow-hidden group">
                        {/* Mock Document Render */}
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-tactical-amber/20 via-tactical-amber to-tactical-amber/20 opacity-50 blur-[1px]"></div>
                        <div className="w-full max-w-[400px] h-[320px] bg-white rounded shadow-md relative p-6 text-black border-2 border-slate-200 perspective-1000 rotate-x-2 border-b-8 border-b-slate-300 transform scale-95 group-hover:scale-100 transition-transform duration-500">
                          <div className="border-b-2 border-slate-300 pb-4 mb-4 text-center">
                            <h2 className="font-serif text-2xl font-bold tracking-tight text-slate-800 uppercase line-clamp-1">{selectedRecord.provider}</h2>
                            <p className="font-sans text-[10px] text-slate-500 tracking-widest mt-1">CERTIFICATE OF COMPLETION</p>
                          </div>
                          <div className="text-center space-y-4">
                            <p className="font-sans text-xs text-slate-600">This is to certify that</p>
                            <p className="font-serif text-xl font-bold text-slate-900 border-b border-slate-400 inline-block px-4 pb-1">{selectedRecord.guardName}</p>
                            <p className="font-sans text-xs text-slate-600">has successfully completed the training course for</p>
                            <p className="font-serif text-lg font-bold text-slate-800 line-clamp-1">{selectedRecord.type} Training</p>
                          </div>
                          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end border-t border-slate-300 pt-4">
                            <div className="text-center">
                              <div className="w-16 h-8 border-b border-slate-800 mb-1 mx-auto" style={{ fontFamily: 'cursive', color: '#1e293b' }}>Dr. A. Khan</div>
                              <p className="text-[8px] uppercase tracking-widest text-slate-500">Director</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-mono text-slate-500">Cert #: {selectedRecord.certNo}</p>
                              <p className="text-[10px] font-mono text-slate-500">Issued: {selectedRecord.completed}</p>
                            </div>
                          </div>
                          {/* "Valid" Tactical Stamp */}
                          {selectedRecord.status === 'valid' && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-tactical-green/30 rounded-full flex flex-col items-center justify-center rotate-[-15deg] opacity-60 mix-blend-multiply pointer-events-none">
                              <span className="font-mono text-3xl font-bold text-tactical-green">VERIFIED</span>
                              <span className="font-mono text-[10px] text-tactical-green mt-1">{selectedRecord.expiry}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center text-xs font-mono text-muted-foreground">
                        <span>SCAN_ID: TS-{Math.floor(Math.random() * 10000) + 1000}-{selectedRecord.guardId}</span>
                        <button className="text-tactical-amber hover:text-tactical-amber/80 flex items-center gap-1">
                          <Download className="h-3 w-3" /> Export PDF
                        </button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
