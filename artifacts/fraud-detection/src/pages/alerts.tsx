import React, { useState } from "react";
import { useListAlerts, useReviewAlert } from "@workspace/api-client-react";
import type { ListAlertsStatus, Alert, ReviewAlertRequestStatus } from "@workspace/api-client-react/src/generated/api.schemas";
import { Card, Badge, Button, Select, Dialog } from "@/components/ui-elements";
import { format, parseISO } from "date-fns";
import { ShieldAlert, Info, AlertTriangle, ShieldCheck, UserX, MessageSquare } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Alerts() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<ListAlertsStatus | "open">("open");
  
  const [reviewAlertId, setReviewAlertId] = useState<number | null>(null);

  const { data, isLoading } = useListAlerts({ page, limit, status: statusFilter });

  const getSeverityBadge = (level: string) => {
    switch (level) {
      case 'critical': return <Badge variant="destructive" className="animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">Critical</Badge>;
      case 'high': return <Badge variant="warning">High</Badge>;
      case 'medium': return <Badge variant="outline" className="text-blue-400 border-blue-400/30">Medium</Badge>;
      default: return <Badge variant="success">Low</Badge>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'open': return <Badge variant="destructive">Open</Badge>;
      case 'escalated': return <Badge variant="warning">Escalated</Badge>;
      case 'reviewed': return <Badge variant="success">Reviewed</Badge>;
      case 'dismissed': return <Badge variant="outline">Dismissed</Badge>;
      default: return <Badge variant="default">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Alert Review Queue</h1>
          <p className="text-muted-foreground text-sm">Investigate and resolve flagged activities.</p>
        </div>
        <div className="flex bg-background/50 border border-border rounded-lg p-1">
          {(['open', 'escalated', 'reviewed', 'dismissed'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${statusFilter === s ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 flex-1 overflow-auto pr-2 pb-4">
        {isLoading ? (
           [...Array(4)].map((_, i) => (
             <Card key={i} className="p-6 animate-pulse h-40"></Card>
           ))
        ) : data?.alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground glass-panel rounded-xl border border-dashed border-border/50">
            <ShieldCheck className="w-16 h-16 mb-4 text-success opacity-50" />
            <h3 className="text-lg font-medium text-foreground">Inbox Zero</h3>
            <p>No {statusFilter} alerts found in the queue.</p>
          </div>
        ) : (
          data?.alerts.map(alert => (
            <Card key={alert.id} className="p-0 overflow-hidden flex flex-col sm:flex-row transition-all hover:border-primary/30 group">
              <div className={`w-1.5 shrink-0 ${
                alert.severity === 'critical' ? 'bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 
                alert.severity === 'high' ? 'bg-warning' : 
                alert.severity === 'medium' ? 'bg-blue-400' : 'bg-success'
              }`} />
              <div className="p-5 flex-1 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg text-foreground tracking-tight">{alert.alertType}</span>
                    {getSeverityBadge(alert.severity)}
                    {getStatusBadge(alert.status)}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono mt-2 bg-background/50 inline-flex p-1.5 rounded border border-border/50">
                    <span className="flex items-center"><Info className="w-3 h-3 mr-1" /> TX: {alert.transaction?.transactionId?.substring(0,8) || alert.transactionId}</span>
                    <span className="flex items-center"><UserX className="w-3 h-3 mr-1" /> User: {alert.transaction?.userId || 'N/A'}</span>
                    <span>{format(parseISO(alert.createdAt), 'MMM dd, HH:mm')}</span>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex sm:flex-col gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-border/50 pt-4 sm:pt-0 sm:pl-6">
                  {alert.status === 'open' ? (
                    <Button variant="primary" onClick={() => setReviewAlertId(alert.id)} className="w-full">
                      Review Alert
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => setReviewAlertId(alert.id)} className="w-full">
                      View Details
                    </Button>
                  )}
                </div>

              </div>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      {reviewAlertId && (
        <ReviewAlertModal 
          alert={data?.alerts.find(a => a.id === reviewAlertId) || null} 
          onClose={() => setReviewAlertId(null)} 
          getSeverityBadge={getSeverityBadge}
        />
      )}
    </div>
  );
}

function ReviewAlertModal({ alert, onClose, getSeverityBadge }: { alert: Alert | null, onClose: () => void, getSeverityBadge: any }) {
  const [status, setStatus] = useState<ReviewAlertRequestStatus>("reviewed");
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const reviewMutation = useReviewAlert({
    mutation: {
      onSuccess: () => {
        toast({ title: "Alert Updated", description: "The fraud alert has been processed." });
        queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
        queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
        onClose();
      },
      onError: (err) => {
        toast({ title: "Error", description: err.error?.error || "Failed to review alert", variant: "destructive" });
      }
    }
  });

  if (!alert) return null;

  const isReadOnly = alert.status !== 'open';

  return (
    <Dialog isOpen={true} onClose={onClose} title={`Alert Investigation: #${alert.id}`} maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Alert Context */}
        <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg flex gap-4 items-start">
          <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-1" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">{alert.alertType}</h3>
              {getSeverityBadge(alert.severity)}
            </div>
            <p className="text-sm text-muted-foreground">{alert.description}</p>
          </div>
        </div>

        {/* Transaction Snapshot */}
        {alert.transaction && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Transaction Snapshot</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-background/50 border border-border/50 rounded-lg text-sm">
              <div><span className="block text-muted-foreground text-xs">Amount</span><span className="font-medium text-foreground">${alert.transaction.amount}</span></div>
              <div><span className="block text-muted-foreground text-xs">User</span><span className="font-medium text-foreground">{alert.transaction.userName}</span></div>
              <div><span className="block text-muted-foreground text-xs">Merchant</span><span className="font-medium text-foreground">{alert.transaction.merchantName}</span></div>
              <div><span className="block text-muted-foreground text-xs">Risk Score</span><span className="font-mono text-primary">{alert.transaction.riskScore}/100</span></div>
            </div>
          </div>
        )}

        {/* Action Form */}
        <div className="border-t border-border/50 pt-6">
          <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center"><MessageSquare className="w-4 h-4 mr-2" /> Resolution</h4>
          
          {isReadOnly ? (
            <div className="space-y-3 p-4 bg-background/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Final Status:</span> <Badge variant="outline">{alert.status}</Badge></div>
              <div><span className="text-sm text-muted-foreground block mb-1">Investigator Note:</span> <p className="text-sm text-foreground bg-card p-3 rounded border border-border">{alert.reviewNote || "No notes provided."}</p></div>
              <div className="text-xs text-muted-foreground pt-2">Reviewed by {alert.reviewedBy || 'System'} at {alert.reviewedAt ? format(parseISO(alert.reviewedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Action Decision</label>
                <div className="grid grid-cols-3 gap-3">
                  <button type="button" onClick={() => setStatus("reviewed")} className={`p-3 text-sm rounded-lg border transition-all ${status === 'reviewed' ? 'bg-success/10 border-success text-success shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-background border-border/50 text-muted-foreground hover:border-border'}`}>
                    <ShieldCheck className="w-5 h-5 mx-auto mb-1" />
                    Mark Safe
                  </button>
                  <button type="button" onClick={() => setStatus("dismissed")} className={`p-3 text-sm rounded-lg border transition-all ${status === 'dismissed' ? 'bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-background border-border/50 text-muted-foreground hover:border-border'}`}>
                    <UserX className="w-5 h-5 mx-auto mb-1" />
                    Block User
                  </button>
                  <button type="button" onClick={() => setStatus("escalated")} className={`p-3 text-sm rounded-lg border transition-all ${status === 'escalated' ? 'bg-warning/10 border-warning text-warning shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-background border-border/50 text-muted-foreground hover:border-border'}`}>
                    <AlertTriangle className="w-5 h-5 mx-auto mb-1" />
                    Escalate (L2)
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Investigation Notes</label>
                <textarea 
                  className="w-full bg-background/50 border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]" 
                  placeholder="Detail findings and reasoning..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {!isReadOnly && (
            <Button 
              variant="primary" 
              isLoading={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate({ id: alert.id, data: { status, reviewNote: note, reviewedBy: 'Admin User' }})}
              disabled={!note.trim()}
            >
              Confirm & Submit
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
