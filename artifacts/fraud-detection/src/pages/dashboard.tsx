import React from "react";
import { useGetAnalyticsSummary, useGetFraudTrends } from "@workspace/api-client-react";
import { Card } from "@/components/ui-elements";
import { Activity, AlertTriangle, ShieldCheck, ShieldAlert, CreditCard, DollarSign } from "lucide-react";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { format, parseISO } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetAnalyticsSummary();
  const { data: trends, isLoading: isTrendsLoading } = useGetFraudTrends({ days: 30 });

  if (isSummaryLoading || isTrendsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse h-32 flex flex-col justify-between">
              <div className="w-24 h-4 bg-muted rounded"></div>
              <div className="w-32 h-8 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!summary || !trends) return null;

  const statCards = [
    { title: "Total Scanned", value: formatCompactNumber(summary.totalTransactions), icon: CreditCard, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-500/20" },
    { title: "Flagged (Suspicious)", value: summary.flaggedTransactions.toLocaleString(), icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
    { title: "Blocked Transactions", value: summary.blockedTransactions.toLocaleString(), icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
    { title: "Open Alerts Queue", value: summary.totalAlertsOpen.toLocaleString(), icon: Activity, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", glow: true },
    { title: "Avg Fraud Rate", value: `${summary.fraudRate.toFixed(2)}%`, icon: ShieldCheck, color: "text-success", bg: "bg-success/10", border: "border-success/20" },
    { title: "Value Protected", value: formatCurrency(summary.totalAmountFlagged), icon: DollarSign, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-500/20" },
  ];

  const pieData = [
    { name: 'Low Risk', value: summary.riskDistribution.low, color: 'hsl(var(--success))' },
    { name: 'Medium Risk', value: summary.riskDistribution.medium, color: 'hsl(var(--warning))' },
    { name: 'High Risk', value: summary.riskDistribution.high, color: 'hsl(var(--orange-500))' },
    { name: 'Critical Risk', value: summary.riskDistribution.critical, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Security Command Center</h1>
        <p className="text-muted-foreground mt-1">Real-time financial fraud detection metrics.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className={`p-5 md:p-6 relative overflow-hidden ${stat.glow ? 'shadow-[0_0_20px_rgba(6,182,212,0.15)] border-primary/40' : ''}`}>
            {/* Decorative background glow */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.bg} blur-2xl`}></div>
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl md:text-3xl font-bold mt-2 font-mono text-foreground">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.border} border`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Fraud Detection Trends (30 Days)</h3>
            <p className="text-sm text-muted-foreground">Volume of flagged vs total transactions</p>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickFormatter={(val) => format(parseISO(val), 'MMM dd')}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatCompactNumber(val)}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                  labelFormatter={(val) => format(parseISO(val as string), 'MMM dd, yyyy')}
                />
                <Area type="monotone" dataKey="totalTransactions" name="Total Scanned" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="flaggedCount" name="Flagged" stroke="hsl(var(--destructive))" strokeWidth={2} fillOpacity={1} fill="url(#colorFlagged)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Risk Distribution */}
        <Card className="p-6 flex flex-col">
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-foreground">Risk Distribution</h3>
            <p className="text-sm text-muted-foreground">Transactions by assigned severity</p>
          </div>
          <div className="flex-1 min-h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 4px ${entry.color}80)` }} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontSize: '14px', fontWeight: 500 }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text for donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-3xl font-bold font-mono text-foreground">{summary.flaggedTransactions + summary.blockedTransactions}</span>
              <span className="text-xs text-muted-foreground">Total Risky</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
