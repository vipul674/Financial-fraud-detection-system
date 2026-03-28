import React, { useState } from "react";
import { useListTransactions, useGetTransaction } from "@workspace/api-client-react";
import type { ListTransactionsRiskLevel, ListTransactionsStatus, Transaction } from "@workspace/api-client-react/src/generated/api.schemas";
import { Card, Badge, Button, Input, Select, Dialog, RiskScoreBar } from "@/components/ui-elements";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Search, Filter, Eye, ChevronLeft, ChevronRight, ShieldAlert, CheckCircle, Clock } from "lucide-react";

export default function Transactions() {
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [riskLevel, setRiskLevel] = useState<ListTransactionsRiskLevel | "">("");
  const [status, setStatus] = useState<ListTransactionsStatus | "">("");
  
  const [selectedTxId, setSelectedTxId] = useState<number | null>(null);

  const { data, isLoading } = useListTransactions({ 
    page, 
    limit, 
    riskLevel: riskLevel || undefined, 
    status: status || undefined 
  });

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'critical': return <Badge variant="destructive" className="animate-pulse">Critical</Badge>;
      case 'high': return <Badge variant="warning">High</Badge>;
      case 'medium': return <Badge variant="outline" className="text-blue-400 border-blue-400/30 bg-blue-400/10">Medium</Badge>;
      default: return <Badge variant="success">Low</Badge>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'blocked': return <Badge variant="destructive"><ShieldAlert className="w-3 h-3 mr-1"/> Blocked</Badge>;
      case 'flagged': return <Badge variant="warning"><ShieldAlert className="w-3 h-3 mr-1"/> Flagged</Badge>;
      case 'approved': return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1"/> Approved</Badge>;
      default: return <Badge variant="outline"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Transaction Log</h1>
          <p className="text-muted-foreground text-sm">Monitor and review all payment network activity.</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border/50 bg-background/20 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex w-full md:w-auto items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input placeholder="Search transaction ID..." className="pl-9" />
            </div>
            <Button variant="outline" size="md" className="shrink-0"><Filter className="w-4 h-4 mr-2" /> Filters</Button>
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
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-20"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 bg-muted rounded w-8 inline-block"></div></td>
                  </tr>
                ))
              ) : data?.transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    No transactions found matching criteria.
                  </td>
                </tr>
              ) : (
                data?.transactions.map((tx) => (
                  <tr 
                    key={tx.id} 
                    className="hover:bg-accent/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedTxId(tx.id)}
                  >
                    <td className="px-6 py-4 font-mono text-primary group-hover:underline">{tx.transactionId.substring(0, 12)}...</td>
                    <td className="px-6 py-4 text-muted-foreground">{format(parseISO(tx.createdAt), 'MMM dd, yyyy HH:mm')}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{formatCurrency(tx.amount, tx.currency)}</td>
                    <td className="px-6 py-4 w-48">
                      <RiskScoreBar score={tx.riskScore} />
                    </td>
                    <td className="px-6 py-4">{getRiskBadge(tx.riskLevel)}</td>
                    <td className="px-6 py-4">{getStatusBadge(tx.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); setSelectedTxId(tx.id); }}>
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
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-border/50 bg-background/20 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{(page - 1) * limit + 1}</span> to <span className="font-medium text-foreground">{Math.min(page * limit, data.total)}</span> of <span className="font-medium text-foreground">{data.total}</span> entries
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === data.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Transaction Details Modal */}
      <TransactionDetailModal 
        id={selectedTxId} 
        onClose={() => setSelectedTxId(null)} 
        getRiskBadge={getRiskBadge}
        getStatusBadge={getStatusBadge}
      />
    </div>
  );
}

function TransactionDetailModal({ 
  id, 
  onClose,
  getRiskBadge,
  getStatusBadge
}: { 
  id: number | null, 
  onClose: () => void,
  getRiskBadge: (l: string) => React.ReactNode,
  getStatusBadge: (s: string) => React.ReactNode
}) {
  const { data: tx, isLoading } = useGetTransaction(id as number, { query: { enabled: !!id } });

  return (
    <Dialog isOpen={!!id} onClose={onClose} title="Transaction Details" maxWidth="max-w-2xl">
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-muted rounded w-full"></div>
          <div className="h-32 bg-muted rounded w-full"></div>
          <div className="h-32 bg-muted rounded w-full"></div>
        </div>
      ) : tx ? (
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Transaction ID</div>
              <div className="font-mono text-lg font-bold text-primary tracking-tight">{tx.transactionId}</div>
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
                <div className="flex justify-between"><span className="text-muted-foreground">IP Address:</span> <span className="font-mono text-xs">{tx.ipAddress || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Device:</span> <span>{tx.deviceType || 'Unknown'}</span></div>
              </div>
            </div>
            <div className="p-4 bg-background/50 rounded-lg border border-border/50">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Merchant Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name:</span> <span className="font-medium text-foreground">{tx.merchantName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Category:</span> <span>{tx.merchantCategory}</span></div>
                <div className="flex justify-between mt-4"><span className="text-muted-foreground">Date:</span> <span>{format(parseISO(tx.createdAt), 'MMM dd, yyyy')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Time:</span> <span>{format(parseISO(tx.createdAt), 'HH:mm:ss')}</span></div>
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
            {tx.status === 'pending' && (
              <>
                <Button variant="primary" className="bg-success text-success-foreground hover:bg-success/90">Approve</Button>
                <Button variant="destructive">Block Transaction</Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">Transaction not found.</div>
      )}
    </Dialog>
  );
}
