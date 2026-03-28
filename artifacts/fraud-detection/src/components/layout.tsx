import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Receipt, ShieldAlert, Settings, Bell, Search, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: Receipt },
    { name: "Fraud Alerts", href: "/alerts", icon: ShieldAlert, badge: "!" },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Background Image overlay */}
      <div 
        className="fixed inset-0 z-0 opacity-20 pointer-events-none mix-blend-screen"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/security-bg.png)`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-y-0 border-l-0 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <img src={`${import.meta.env.BASE_URL}images/logo-icon.png`} alt="Logo" className="w-8 h-8 mr-3 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <span className="font-bold text-lg tracking-tight text-gradient">Sentinel.AI</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Main Menu</div>
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href} className="block">
                <div className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative cursor-pointer",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(6,182,212,1)]"
                    />
                  )}
                  <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-primary" : "group-hover:text-foreground")} />
                  <span className="font-medium text-sm">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-background/50 border border-border/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-[0_0_10px_rgba(6,182,212,0.5)]">
              AD
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Admin User</span>
              <span className="text-xs text-muted-foreground">SecOps Level 3</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 z-10 relative">
        {/* Top Header */}
        <header className="h-16 glass-panel border-b border-x-0 border-t-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <button 
            className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center flex-1 ml-4 md:ml-0 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search IDs, IPs, emails..." 
              className="w-full bg-background/50 border border-border/50 rounded-full h-9 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="flex items-center gap-4 ml-auto pl-4">
            <button className="text-muted-foreground hover:text-foreground relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
            </button>
            <button className="text-muted-foreground hover:text-foreground">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </div>
      </main>
      
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
