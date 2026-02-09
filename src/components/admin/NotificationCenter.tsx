import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Bell,
  BellRing,
  ShieldAlert,
  AlertTriangle,
  XCircle,
  Globe,
  Clock,
  Trash2,
} from "lucide-react";

interface SecurityAlert {
  id: string;
  type: "failed_login" | "ip_blocked" | "suspicious";
  title: string;
  description: string;
  ip_address: string;
  location?: string;
  timestamp: string;
  read: boolean;
}

export const NotificationCenter = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Load initial failed login data
  useEffect(() => {
    const loadRecentAlerts = async () => {
      try {
        const { data: ipLogs, error } = await supabase
          .from("ip_logs")
          .select("*")
          .eq("success", false)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        const initialAlerts: SecurityAlert[] = (ipLogs || []).map((log) => ({
          id: log.id,
          type: "failed_login" as const,
          title: "Login Gagal",
          description: `Percobaan login gagal dari ${log.identifier || "unknown"}`,
          ip_address: log.ip_address,
          location: [log.city, log.country].filter(Boolean).join(", ") || undefined,
          timestamp: log.created_at,
          read: true, // Mark initial ones as read
        }));

        setAlerts(initialAlerts);
      } catch (error) {
        console.error("Error loading alerts:", error);
      }
    };

    loadRecentAlerts();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    // Listen for new failed login attempts
    const ipLogsChannel = supabase
      .channel("security-notifications-ip")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ip_logs",
          filter: "success=eq.false",
        },
        (payload) => {
          const log = payload.new as {
            id: string;
            ip_address: string;
            identifier: string | null;
            city: string | null;
            country: string | null;
            created_at: string;
          };

          const newAlert: SecurityAlert = {
            id: log.id,
            type: "failed_login",
            title: "🚨 Login Gagal Terdeteksi",
            description: `Percobaan login gagal dari ${log.identifier || "unknown"}`,
            ip_address: log.ip_address,
            location: [log.city, log.country].filter(Boolean).join(", ") || undefined,
            timestamp: log.created_at,
            read: false,
          };

          setAlerts((prev) => [newAlert, ...prev].slice(0, 50));
          setUnreadCount((prev) => prev + 1);

          toast({
            title: "🚨 Login Gagal Terdeteksi",
            description: (
              <div className="flex flex-col gap-1">
                <span className="font-mono text-sm">{log.ip_address}</span>
                {log.identifier && <span className="text-sm">{log.identifier}</span>}
                {(log.city || log.country) && (
                  <span className="text-xs text-muted-foreground">
                    {[log.city, log.country].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            ),
            duration: 8000,
          });
        }
      )
      .subscribe();

    // Listen for blocked IPs
    const blockedChannel = supabase
      .channel("security-notifications-blocked")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "blocked_ips",
        },
        (payload) => {
          const blocked = payload.new as {
            id: string;
            ip_address: string;
            reason: string;
            blocked_at: string;
          };

          const newAlert: SecurityAlert = {
            id: `blocked-${blocked.id}`,
            type: "ip_blocked",
            title: "⛔ IP Diblokir",
            description: `IP ${blocked.ip_address} diblokir (${blocked.reason})`,
            ip_address: blocked.ip_address,
            timestamp: blocked.blocked_at,
            read: false,
          };

          setAlerts((prev) => [newAlert, ...prev].slice(0, 50));
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ipLogsChannel);
      supabase.removeChannel(blockedChannel);
    };
  }, [toast]);

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    setUnreadCount(0);
  };

  const clearAlerts = () => {
    setAlerts([]);
    setUnreadCount(0);
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getAlertIcon = (type: SecurityAlert["type"]) => {
    switch (type) {
      case "failed_login":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "ip_blocked":
        return <ShieldAlert className="h-4 w-4 text-orange-500" />;
      case "suspicious":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-4 w-4 sm:mr-2 animate-pulse" />
          ) : (
            <Bell className="h-4 w-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">Notifikasi</span>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[340px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Security Alerts
            </span>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllRead}>
                  Tandai Dibaca
                </Button>
              )}
              {alerts.length > 0 && (
                <Button variant="ghost" size="icon" onClick={clearAlerts}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="h-10 w-10 mb-3 opacity-50" />
              <p>Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    alert.read
                      ? "border-border bg-card"
                      : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!alert.read ? "text-primary" : ""}`}>
                        {alert.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="font-mono">{alert.ip_address}</span>
                        {alert.location && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {alert.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(alert.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
