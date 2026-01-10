import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Shield,
  ShieldOff,
  Globe,
  MapPin,
  Clock,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  expires_at: string;
  created_by: string;
}

interface IPLog {
  id: string;
  ip_address: string;
  identifier: string | null;
  action: string;
  success: boolean;
  user_agent: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  isp: string | null;
  created_at: string;
}

export function SecurityDashboard() {
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [ipLogs, setIPLogs] = useState<IPLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [unblockingIP, setUnblockingIP] = useState<BlockedIP | null>(null);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const { toast } = useToast();

  const fetchBlockedIPs = async () => {
    try {
      const { data, error } = await supabase
        .from("blocked_ips")
        .select("*")
        .order("blocked_at", { ascending: false });

      if (error) throw error;
      setBlockedIPs(data || []);
    } catch (error) {
      console.error("Error fetching blocked IPs:", error);
      toast({
        title: "Error",
        description: "Gagal memuat daftar IP yang diblokir",
        variant: "destructive",
      });
    }
  };

  const fetchIPLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("ip_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setIPLogs(data || []);
    } catch (error) {
      console.error("Error fetching IP logs:", error);
      toast({
        title: "Error",
        description: "Gagal memuat IP logs",
        variant: "destructive",
      });
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchBlockedIPs(), fetchIPLogs()]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUnblock = async () => {
    if (!unblockingIP) return;

    setIsUnblocking(true);
    try {
      const { error } = await supabase.rpc("unblock_ip", {
        p_ip_address: unblockingIP.ip_address,
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `IP ${unblockingIP.ip_address} berhasil di-unblock`,
      });

      setUnblockingIP(null);
      fetchBlockedIPs();
    } catch (error) {
      console.error("Error unblocking IP:", error);
      toast({
        title: "Error",
        description: "Gagal meng-unblock IP",
        variant: "destructive",
      });
    } finally {
      setIsUnblocking(false);
    }
  };

  const filteredBlockedIPs = blockedIPs.filter(
    (ip) =>
      ip.ip_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ip.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIPLogs = ipLogs.filter(
    (log) =>
      log.ip_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.identifier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Statistics
  const activeBlocks = blockedIPs.filter((ip) => !isExpired(ip.expires_at)).length;
  const failedAttempts = ipLogs.filter((log) => !log.success).length;
  const uniqueIPs = new Set(ipLogs.map((log) => log.ip_address)).size;
  const countriesDetected = new Set(ipLogs.filter((log) => log.country).map((log) => log.country)).size;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Blocks</p>
              <p className="text-2xl font-bold">{activeBlocks}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed Attempts</p>
              <p className="text-2xl font-bold">{failedAttempts}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unique IPs</p>
              <p className="text-2xl font-bold">{uniqueIPs}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <MapPin className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Countries</p>
              <p className="text-2xl font-bold">{countriesDetected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Refresh */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari IP, email, atau lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs for Blocked IPs and Logs */}
      <Tabs defaultValue="blocked" className="w-full">
        <TabsList>
          <TabsTrigger value="blocked" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Blocked IPs ({activeBlocks})
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            IP Logs ({ipLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blocked" className="mt-4">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Blocked At</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBlockedIPs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "Tidak ada hasil yang cocok" : "Tidak ada IP yang diblokir"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBlockedIPs.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell className="font-mono font-medium">{ip.ip_address}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{ip.reason}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(ip.blocked_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeRemaining(ip.expires_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isExpired(ip.expires_at) ? (
                          <Badge variant="secondary">Expired</Badge>
                        ) : (
                          <Badge variant="destructive">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUnblockingIP(ip)}
                        >
                          <ShieldOff className="h-4 w-4 mr-1" />
                          Unblock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>ISP</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIPLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "Tidak ada hasil yang cocok" : "Belum ada log"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIPLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">
                          {log.identifier || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.country || log.city ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span>
                                {[log.city, log.region, log.country].filter(Boolean).join(", ")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                          {log.isp || "-"}
                        </TableCell>
                        <TableCell>
                          {log.success ? (
                            <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Unblock Confirmation Dialog */}
      <AlertDialog open={!!unblockingIP} onOpenChange={() => setUnblockingIP(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Unblock IP</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin meng-unblock IP{" "}
              <span className="font-mono font-semibold">{unblockingIP?.ip_address}</span>?
              IP ini akan dapat mengakses halaman login kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnblocking}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblock} disabled={isUnblocking}>
              {isUnblocking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
