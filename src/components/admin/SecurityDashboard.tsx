import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  ShieldOff,
  ShieldPlus,
  Globe,
  MapPin,
  Clock,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Bell,
  BellRing,
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
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  
  // Manual block state
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockFormData, setBlockFormData] = useState({
    ip_address: "",
    reason: "manual",
    hours: "24",
  });
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  
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

  // Real-time subscription for blocked_ips
  useEffect(() => {
    if (!realtimeEnabled) return;

    const channel = supabase
      .channel('blocked-ips-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blocked_ips'
        },
        (payload) => {
          console.log('New blocked IP:', payload);
          const newBlock = payload.new as BlockedIP;
          
          // Add to state
          setBlockedIPs(prev => [newBlock, ...prev]);
          
          // Show notification
          toast({
            title: "🚨 IP Baru Diblokir!",
            description: (
              <div className="flex flex-col gap-1">
                <span className="font-mono font-semibold">{newBlock.ip_address}</span>
                <span className="text-sm text-muted-foreground">
                  Alasan: {newBlock.reason}
                </span>
              </div>
            ),
            duration: 10000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'blocked_ips'
        },
        (payload) => {
          console.log('IP unblocked:', payload);
          const deletedIP = payload.old as BlockedIP;
          
          // Remove from state
          setBlockedIPs(prev => prev.filter(ip => ip.id !== deletedIP.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realtimeEnabled, toast]);

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
      // State will be updated via realtime subscription
      if (!realtimeEnabled) {
        fetchBlockedIPs();
      }
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

  const validateIPAddress = (ip: string): boolean => {
    // Simple IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) return false;
    
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  };

  const handleManualBlock = async () => {
    setBlockError(null);
    
    // Validate IP address
    if (!blockFormData.ip_address.trim()) {
      setBlockError("IP address harus diisi");
      return;
    }
    
    if (!validateIPAddress(blockFormData.ip_address.trim())) {
      setBlockError("Format IP address tidak valid (contoh: 192.168.1.1)");
      return;
    }

    setIsBlocking(true);
    try {
      const { error } = await supabase.rpc("block_ip", {
        p_ip_address: blockFormData.ip_address.trim(),
        p_reason: blockFormData.reason,
        p_hours: parseInt(blockFormData.hours, 10),
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `IP ${blockFormData.ip_address} berhasil diblokir selama ${blockFormData.hours} jam`,
      });

      setIsBlockDialogOpen(false);
      setBlockFormData({ ip_address: "", reason: "manual", hours: "24" });
      
      // State will be updated via realtime subscription
      if (!realtimeEnabled) {
        fetchBlockedIPs();
      }
    } catch (error) {
      console.error("Error blocking IP:", error);
      toast({
        title: "Error",
        description: "Gagal memblokir IP",
        variant: "destructive",
      });
    } finally {
      setIsBlocking(false);
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

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "brute_force":
        return "Brute Force";
      case "manual":
        return "Manual Block";
      case "suspicious":
        return "Suspicious Activity";
      default:
        return reason;
    }
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

      {/* Search, Refresh, and Actions */}
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
        <div className="flex gap-2">
          <Button
            variant={realtimeEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setRealtimeEnabled(!realtimeEnabled)}
            title={realtimeEnabled ? "Notifikasi real-time aktif" : "Notifikasi real-time nonaktif"}
          >
            {realtimeEnabled ? (
              <BellRing className="h-4 w-4 mr-2" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            {realtimeEnabled ? "Live" : "Paused"}
          </Button>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsBlockDialogOpen(true)}>
            <ShieldPlus className="h-4 w-4 mr-2" />
            Block IP
          </Button>
        </div>
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
                        <Badge 
                          variant={ip.reason === "brute_force" ? "destructive" : "secondary"}
                        >
                          {getReasonLabel(ip.reason)}
                        </Badge>
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

      {/* Manual Block IP Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldPlus className="h-5 w-5" />
              Block IP Address
            </DialogTitle>
            <DialogDescription>
              Blokir IP address secara manual. IP yang diblokir tidak akan bisa mengakses halaman login.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ip_address">IP Address</Label>
              <Input
                id="ip_address"
                placeholder="192.168.1.1"
                value={blockFormData.ip_address}
                onChange={(e) => {
                  setBlockFormData({ ...blockFormData, ip_address: e.target.value });
                  setBlockError(null);
                }}
                className={blockError ? "border-destructive" : ""}
              />
              {blockError && (
                <p className="text-sm text-destructive">{blockError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Alasan</Label>
              <Select
                value={blockFormData.reason}
                onValueChange={(value) => setBlockFormData({ ...blockFormData, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih alasan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Block</SelectItem>
                  <SelectItem value="suspicious">Suspicious Activity</SelectItem>
                  <SelectItem value="brute_force">Brute Force</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="abuse">Abuse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Durasi Block</Label>
              <Select
                value={blockFormData.hours}
                onValueChange={(value) => setBlockFormData({ ...blockFormData, hours: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih durasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Jam</SelectItem>
                  <SelectItem value="6">6 Jam</SelectItem>
                  <SelectItem value="12">12 Jam</SelectItem>
                  <SelectItem value="24">24 Jam</SelectItem>
                  <SelectItem value="48">48 Jam</SelectItem>
                  <SelectItem value="168">1 Minggu</SelectItem>
                  <SelectItem value="720">30 Hari</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleManualBlock} disabled={isBlocking}>
              {isBlocking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Block IP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
