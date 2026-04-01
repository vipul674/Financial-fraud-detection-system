import React, { useState } from "react";
import { useListTransactions, useGetTransaction, useSimulateTransaction } from "@workspace/api-client-react";
import type { ListTransactionsRiskLevel, ListTransactionsStatus } from "@workspace/api-client-react/src/generated/api.schemas";
import { Card, Badge, Button, Input, Select, Dialog, RiskScoreBar } from "@/components/ui-elements";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Search, Filter, Eye, ChevronLeft, ChevronRight, ShieldAlert, CheckCircle, Clock, FlaskConical, AlertTriangle, ShieldCheck, ShieldX, Zap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const MERCHANTS = [
  { name: "Amazon", category: "E-commerce" },
  { name: "Walmart", category: "Retail" },
  { name: "Shell Gas Station", category: "Fuel" },
  { name: "Netflix", category: "Subscription" },
  { name: "Marriott Hotels", category: "Travel" },
  { name: "Delta Airlines", category: "Travel" },
  { name: "Casino Royale", category: "Gambling" },
  { name: "CryptoExchange Pro", category: "Cryptocurrency" },
  { name: "Wire Transfer Service", category: "Financial" },
  { name: "Luxury Watches NYC", category: "Jewelry" },
  { name: "ATM Withdrawal", category: "ATM" },
  { name: "Offshore Bank Ltd", category: "Financial" },
];

const LOCATIONS = [
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Lagos, Nigeria",
  "Moscow, Russia",
  "Unknown Location",
  "Cayman Islands",
  "Singapore",
];

const PRESETS = [
  {
    label: "Low-Risk Purchase",
    icon: ShieldCheck,
    color: "text-emerald-400",
    data: { amount: 49.99, merchantName: "Amazon", merchantCategory: "E-commerce", location: "New York, NY", deviceType: "Mobile" as const, userName: "Alice Johnson" },
  },
  {
    label: "Medium-Risk Travel",
    icon: AlertTriangle,
    color: "text-yellow-400",
    data: { amount: 2400, merchantName: "Delta Airlines", merchantCategory: "Travel", location: "Singapore", deviceType: "Desktop" as const, userName: "Bob Martinez" },
  },
  {
    label: "High-Risk Crypto",
    icon: ShieldX,
    color: "text-orange-400",
    data: { amount: 8500, merchantName: "CryptoExchange Pro", merchantCategory: "Cryptocurrency", location: "Cayman Islands", deviceType: "Unknown" as const, userName: "Demo User" },
  },
  {
    label: "Critical Fraud",
    icon: ShieldX,
    color: "text-red-400",
    data: { amount: 12000, merchantName: "Offshore Bank Ltd", merchantCategory: "Financial", location: "Lagos, Nigeria", deviceType: "Unknown" as const, userName: "Demo User" },
  },
];

export default function Transactions() {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [riskLevel, setRiskLevel] = useState<ListTransactionsRiskLevel | "">("");
  const [status, setStatus] = useState<ListTransactionsStatus | "">("");
  const [selectedTxId, setSelectedTxId] = useState<number | null>(null);
  const [showSimulate, setShowSimulate] = useState(false);

  const { data, isLoading } = useListTransactions({
    page,
    limit,
    riskLevel: riskLevel || undefined,
    status: status || undefined,
  });

  const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
  const total = typeof data?.total === "number" ? data.total : 0;
  const totalPages = typeof data?.totalPages === "number" ? data.totalPages : 0;

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "critical": return <Badge variant="destructive" className="animate-pulse">Critical</Badge>;
      case "high": return <Badge variant="warning">High</Badge>;
      case "medium": return <Badge variant="outline" className="text-blue-400 border-blue-400/30 bg-blue-400/10">Medium</Badge>;
      default: return <Badge variant="success">Low</Badge>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "blocked": return <Badge variant="destructive"><ShieldAlert className="w-3 h-3 mr-1" /> Blocked</Badge>;
      case "flagged": return <Badge variant="warning"><ShieldAlert className="w-3 h-3 mr-1" /> Flagged</Badge>;
      case "approved": return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      default: return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Transaction Log</h1>
          <p className="text-muted-foreground text-sm">Monitor and review all payment network activity.</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowSimulate(true)}
          className="shrink-0"
        >
          <FlaskConical className="w-4 h-4 mr-2" />
          Simulate Transaction
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border/50 bg-background/20 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex w-full md:w-auto items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input placeholder="Search transaction ID..." className="pl-9" />
            </div>
            <Button variant="outline" size="md" className="shrink-0">
              <Filter className="w-4 h-4 mr-2" /> Filters
            </Button>
          </div>

          <div className="flex w-full md:w-auto items-center gap-3">
            <Select
              value={riskLevel}
              onChange={(e) => { setRiskLevel(e.target.value as any); setPage(1); }}
              className="w-full md:w-40"
            >
              <option value="">All Risks</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical Risk</option>
            </Select>
            <Select
              value={status}
              onChange={(e) => { setStatus(e.target.value as any); setPage(1); }}
              className="w-full md:w-40"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="flagged">Flagged</option>
              <option value="blocked">Blocked</option>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-muted-foreground uppercase bg-background/50 sticky top-0 z-10 backdrop-blur-md border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Transaction ID</th>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Risk Score</th>
                <th className="px-6 py-4 font-semibold">Risk Level</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-20" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 bg-muted rounded w-8 inline-block" /></td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    No transactions found matching criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-accent/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedTxId(tx.id)}
                  >
                    <td className="px-6 py-4 font-mono text-primary group-hover:underline">
                      {tx.transactionId.startsWith("DEMO-") && (
                        <span className="mr-1 text-[10px] bg-primary/20 text-primary border border-primary/30 px-1 py-0.5 rounded font-semibold">DEMO</span>
                      )}
                      {tx.transactionId.substring(0, 12)}...
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{format(parseISO(tx.createdAt), "MMM dd, yyyy HH:mm")}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{formatCurrency(tx.amount, tx.currency)}</td>
                    <td className="px-6 py-4 w-48"><RiskScoreBar score={tx.riskScore} /></td>
                    <td className="px-6 py-4">{getRiskBadge(tx.riskLevel)}</td>
                    <td className="px-6 py-4">{getStatusBadge(tx.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => { e.stopPropagation(); setSelectedTxId(tx.id); }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="p-4 border-t border-border/50 bg-background/20 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> of{" "}
              <span className="font-medium text-foreground">{total}</span> entries
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <TransactionDetailModal
        id={selectedTxId}
        onClose={() => setSelectedTxId(null)}
        getRiskBadge={getRiskBadge}
        getStatusBadge={getStatusBadge}
      />

      <SimulateTransactionModal
        isOpen={showSimulate}
        onClose={() => setShowSimulate(false)}
        onTransactionCreated={(id) => { setShowSimulate(false); setSelectedTxId(id); }}
      />
    </div>
  );
}

// ─── Simulate Modal ─────────────────────────────────────────────────────────

function SimulateTransactionModal({
  isOpen,
  onClose,
  onTransactionCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onTransactionCreated: (id: number) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useSimulateTransaction();

  const [form, setForm] = useState({
    amount: "",
    merchantName: "Amazon",
    merchantCategory: "E-commerce",
    location: "New York, NY",
    deviceType: "Mobile" as "Mobile" | "Desktop" | "Tablet" | "Unknown",
    userName: "Demo User",
  });

  const [result, setResult] = useState<{
    transaction: any;
    alertCreated: boolean;
    explanation: string;
  } | null>(null);

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setForm({ ...preset.data });
    setResult(null);
  };

  const handleMerchantChange = (name: string) => {
    const found = MERCHANTS.find((m) => m.name === name);
    setForm((f) => ({ ...f, merchantName: name, merchantCategory: found?.category ?? f.merchantCategory }));
    setResult(null);
  };

  const handleSubmit = async () => {
    setResult(null);
    try {
      const res = await mutation.mutateAsync({
        data: {
          amount: Number(form.amount),
          merchantName: form.merchantName,
          merchantCategory: form.merchantCategory,
          location: form.location,
          deviceType: form.deviceType,
          userName: form.userName || "Demo User",
        },
      });
      setResult(res);
      queryClient.invalidateQueries({ queryKey: ["/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/analytics/summary"] });
    } catch {
      // error handled by mutation.isError
    }
  };

  const handleClose = () => {
    setResult(null);
    mutation.reset();
    onClose();
  };

  const riskColors: Record<string, string> = {
    low: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    high: "text-orange-400 border-orange-400/30 bg-orange-400/10",
    critical: "text-red-400 border-red-400/30 bg-red-400/10",
  };

  const statusColors: Record<string, string> = {
    approved: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    flagged: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    blocked: "text-red-400 border-red-400/30 bg-red-400/10",
    pending: "text-muted-foreground border-border bg-muted/10",
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Simulate Transaction" maxWidth="max-w-2xl">
      <div className="space-y-5">
        {/* Intro */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <FlaskConical className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Create a test transaction to see how the fraud detection engine scores and classifies it in real time. Choose a preset or fill in custom values.
          </p>
        </div>

        {/* Presets */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Presets</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset)}
                className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-background/40 hover:bg-accent/40 hover:border-primary/30 transition-all text-left group"
              >
                <preset.icon className={`w-4 h-4 shrink-0 ${preset.color}`} />
                <span className="text-sm font-medium text-foreground">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border/40" />

        {/* Form */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Amount (USD)</label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 1500.00"
              value={form.amount}
              onChange={(e) => { setForm((f) => ({ ...f, amount: e.target.value })); setResult(null); }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Merchant</label>
            <Select value={form.merchantName} onChange={(e) => handleMerchantChange(e.target.value)}>
              {MERCHANTS.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Category</label>
            <Input
              value={form.merchantCategory}
              onChange={(e) => { setForm((f) => ({ ...f, merchantCategory: e.target.value })); setResult(null); }}
              placeholder="e.g. E-commerce"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Location</label>
            <Select value={form.location} onChange={(e) => { setForm((f) => ({ ...f, location: e.target.value })); setResult(null); }}>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Device Type</label>
            <Select value={form.deviceType} onChange={(e) => { setForm((f) => ({ ...f, deviceType: e.target.value as any })); setResult(null); }}>
              <option value="Mobile">Mobile</option>
              <option value="Desktop">Desktop</option>
              <option value="Tablet">Tablet</option>
              <option value="Unknown">Unknown</option>
            </Select>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">User Name (optional)</label>
            <Input
              value={form.userName}
              onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
              placeholder="Demo User"
            />
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-background/60 border-b border-border/40">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Fraud Engine Result</span>
            </div>
            <div className="p-4 space-y-4 bg-background/30">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Transaction ID</div>
                  <div className="font-mono text-sm text-primary font-bold">{result.transaction.transactionId}</div>
                </div>
                <div className="flex gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${riskColors[result.transaction.riskLevel]}`}>
                    {result.transaction.riskLevel} risk
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${statusColors[result.transaction.status]}`}>
                    {result.transaction.status}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Risk Score</span>
                  <span className="font-bold text-foreground">{result.transaction.riskScore} / 100</span>
                </div>
                <RiskScoreBar score={result.transaction.riskScore} />
              </div>

              <div className="p-3 rounded-lg bg-card/60 border border-border/40 text-sm text-muted-foreground leading-relaxed">
                {result.explanation}
              </div>

              {result.alertCreated && (
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  A fraud alert has been created and added to the Alert Review Queue.
                </div>
              )}

              {result.transaction.flagReasons?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Triggered Rules</div>
                  <ul className="space-y-1">
                    {result.transaction.flagReasons.map((r: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-destructive">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {mutation.isError && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            Something went wrong. Please try again.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2 border-t border-border/40">
          <Button variant="outline" onClick={handleClose}>Close</Button>
          {result ? (
            <Button variant="primary" onClick={() => { onTransactionCreated(result.transaction.id); }}>
              <Eye className="w-4 h-4 mr-2" /> View Full Details
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!form.amount || Number(form.amount) <= 0 || mutation.isPending}
              isLoading={mutation.isPending}
            >
              <Zap className="w-4 h-4 mr-2" />
              Run Detection
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}

// ─── Transaction Detail Modal ─────────────────────────────────────────────────

function TransactionDetailModal({
  id,
  onClose,
  getRiskBadge,
  getStatusBadge,
}: {
  id: number | null;
  onClose: () => void;
  getRiskBadge: (l: string) => React.ReactNode;
  getStatusBadge: (s: string) => React.ReactNode;
}) {
  const { data: tx, isLoading } = useGetTransaction(id as number, { query: { enabled: !!id } });

  return (
    <Dialog isOpen={!!id} onClose={onClose} title="Transaction Details" maxWidth="max-w-2xl">
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-muted rounded w-full" />
          <div className="h-32 bg-muted rounded w-full" />
          <div className="h-32 bg-muted rounded w-full" />
        </div>
      ) : tx ? (
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Transaction ID</div>
              <div className="flex items-center gap-2">
                {tx.transactionId.startsWith("DEMO-") && (
                  <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded font-bold tracking-wider">DEMO</span>
                )}
                <div className="font-mono text-lg font-bold text-primary tracking-tight">{tx.transactionId}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-foreground">{formatCurrency(tx.amount, tx.currency)}</div>
              <div className="mt-2 flex gap-2 justify-end">
                {getStatusBadge(tx.status)}
                {getRiskBadge(tx.riskLevel)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-background/50 rounded-lg border border-border/50">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Customer Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name:</span> <span className="font-medium text-foreground">{tx.userName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">User ID:</span> <span className="font-mono text-xs">{tx.userId}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Location:</span> <span>{tx.location}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IP Address:</span> <span className="font-mono text-xs">{tx.ipAddress || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Device:</span> <span>{tx.deviceType || "Unknown"}</span></div>
              </div>
            </div>
            <div className="p-4 bg-background/50 rounded-lg border border-border/50">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Merchant Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name:</span> <span className="font-medium text-foreground">{tx.merchantName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Category:</span> <span>{tx.merchantCategory}</span></div>
                <div className="flex justify-between mt-4"><span className="text-muted-foreground">Date:</span> <span>{format(parseISO(tx.createdAt), "MMM dd, yyyy")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Time:</span> <span>{format(parseISO(tx.createdAt), "HH:mm:ss")}</span></div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Risk Assessment</h4>
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-medium">Risk Score:</span>
                <div className="flex-1"><RiskScoreBar score={tx.riskScore} /></div>
              </div>

              {tx.flagReasons && tx.flagReasons.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-destructive flex items-center mb-2">
                    <AlertTriangle className="w-4 h-4 mr-1" /> Flag Reasons
                  </span>
                  <ul className="list-disc list-inside space-y-1 ml-5 text-sm text-muted-foreground">
                    {tx.flagReasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">Transaction not found.</div>
      )}
    </Dialog>
  );
}
