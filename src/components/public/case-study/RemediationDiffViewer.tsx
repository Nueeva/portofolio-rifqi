import React, { useState } from "react";
import { Code2, GitCompare, Check, Copy } from "lucide-react";

interface DiffLine {
  type: "context" | "removed" | "added";
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

interface RemediationScenario {
  id: string;
  vulnId: string;
  title: string;
  file: string;
  language: string;
  overview: string;
  lines: DiffLine[];
}

const scenarios: RemediationScenario[] = [
  {
    id: "money-race-condition",
    vulnId: "APX-SEC-01",
    title: "Bukkit Main-Thread Sync & Atomic Lock (Money Dupe Fix)",
    file: "ApexsionsEconomy/src/main/java/com/apexsions/economy/AuctionManager.java",
    language: "java",
    overview: "Pencegahan eksploitasi duplikasi uang: Memindahkan mutasi saldo dari asynchronous worker thread ke server tick main-thread Bukkit dengan ReentrantLock terisolasi per UUID pemain.",
    lines: [
      { type: "context", oldLineNumber: 42, newLineNumber: 42, content: "public class AuctionManager {" },
      { type: "removed", oldLineNumber: 43, content: "    // VULNERABLE: Direct async state mutation without lock" },
      { type: "removed", oldLineNumber: 44, content: "    public CompletableFuture<Boolean> cancelAuctionBid(UUID playerUuid, long amount) {" },
      { type: "removed", oldLineNumber: 45, content: "        return CompletableFuture.supplyAsync(() -> {" },
      { type: "removed", oldLineNumber: 46, content: "            PlayerData data = database.loadPlayerData(playerUuid);" },
      { type: "removed", oldLineNumber: 47, content: "            data.setBalance(data.getBalance() + amount);" },
      { type: "removed", oldLineNumber: 48, content: "            database.savePlayerData(data);" },
      { type: "removed", oldLineNumber: 49, content: "            return true;" },
      { type: "removed", oldLineNumber: 50, content: "        });" },
      { type: "removed", oldLineNumber: 51, content: "    }" },
      { type: "added", newLineNumber: 43, content: "    // SECURED: ReentrantLock per-account + Bukkit main-thread dispatch" },
      { type: "added", newLineNumber: 44, content: "    private final ConcurrentHashMap<UUID, ReentrantLock> accountLocks = new ConcurrentHashMap<>();" },
      { type: "added", newLineNumber: 45, content: "" },
      { type: "added", newLineNumber: 46, content: "    public CompletableFuture<Boolean> cancelAuctionBid(UUID playerUuid, long amount) {" },
      { type: "added", newLineNumber: 47, content: "        ReentrantLock lock = accountLocks.computeIfAbsent(playerUuid, k -> new ReentrantLock(true));" },
      { type: "added", newLineNumber: 48, content: "        return CompletableFuture.supplyAsync(() -> {" },
      { type: "added", newLineNumber: 49, content: "            lock.lock();" },
      { type: "added", newLineNumber: 50, content: "            try {" },
      { type: "added", newLineNumber: 51, content: "                return Bukkit.getScheduler().callSyncMethod(plugin, () -> {" },
      { type: "added", newLineNumber: 52, content: "                    PlayerData data = database.loadPlayerData(playerUuid);" },
      { type: "added", newLineNumber: 53, content: "                    long newBalance = Math.addExact(data.getBalance(), amount);" },
      { type: "added", newLineNumber: 54, content: "                    data.setBalance(newBalance);" },
      { type: "added", newLineNumber: 55, content: "                    database.savePlayerData(data);" },
      { type: "added", newLineNumber: 56, content: "                    return true;" },
      { type: "added", newLineNumber: 57, content: "                }).get(250, TimeUnit.MILLISECONDS);" },
      { type: "added", newLineNumber: 58, content: "            } finally {" },
      { type: "added", newLineNumber: 59, content: "                lock.unlock();" },
      { type: "added", newLineNumber: 60, content: "            }" },
      { type: "added", newLineNumber: 61, content: "        }, asyncExecutor);" },
      { type: "added", newLineNumber: 62, content: "    }" },
      { type: "context", oldLineNumber: 52, newLineNumber: 63, content: "}" },
    ],
  },
  {
    id: "ast-xss-encoding",
    vulnId: "APX-SEC-14 / XSS",
    title: "Context-Aware AST Encoding (Reflected & Stored XSS Fix)",
    file: "xssscope/src/scanner/ContextEncoder.js",
    language: "javascript",
    overview: "Pencegahan cross-site scripting: Menggantikan replace string naif dengan encoder berbasis konteks AST (HTML body, nilai atribut, atau JavaScript string literal).",
    lines: [
      { type: "context", oldLineNumber: 12, newLineNumber: 12, content: "// Context-aware output encoding" },
      { type: "removed", oldLineNumber: 13, content: "// VULNERABLE: Naive character replacement fails inside attribute quotes" },
      { type: "removed", oldLineNumber: 14, content: "function sanitizeReflection(rawInput) {" },
      { type: "removed", oldLineNumber: 15, content: "    return rawInput.replace(/</g, \"&lt;\").replace(/>/g, \"&gt;\");" },
      { type: "removed", oldLineNumber: 16, content: "}" },
      { type: "added", newLineNumber: 13, content: "// SECURED: Parse context determination with strict AST delimiter escaping" },
      { type: "added", newLineNumber: 14, content: "function encodeForContext(rawInput, contextType) {" },
      { type: "added", newLineNumber: 15, content: "    switch (contextType) {" },
      { type: "added", newLineNumber: 16, content: "        case \"HTML_BODY\":" },
      { type: "added", newLineNumber: 17, content: "            return rawInput.replace(/&/g, \"&amp;\").replace(/</g, \"&lt;\").replace(/>/g, \"&gt;\");" },
      { type: "added", newLineNumber: 18, content: "        case \"ATTRIBUTE_VALUE\":" },
      { type: "added", newLineNumber: 19, content: "            return rawInput.replace(/&/g, \"&amp;\").replace(/\"/g, \"&quot;\").replace(/'/g, \"&#x27;\").replace(/`/g, \"&#x60;\");" },
      { type: "added", newLineNumber: 20, content: "        case \"SCRIPT_LITERAL\":" },
      { type: "added", newLineNumber: 21, content: "            return rawInput.replace(/[^a-zA-Z0-9]/g, (c) => \"\\\\x\" + c.charCodeAt(0).toString(16).padStart(2, \"0\"));" },
      { type: "added", newLineNumber: 22, content: "        default:" },
      { type: "added", newLineNumber: 23, content: "            throw new SecurityException(\"Unrecognized AST context: \" + contextType);" },
      { type: "added", newLineNumber: 24, content: "    }" },
      { type: "added", newLineNumber: 25, content: "}" },
      { type: "context", oldLineNumber: 17, newLineNumber: 26, content: "export { encodeForContext };" },
    ],
  },
  {
    id: "sqlite-prepared-statement",
    vulnId: "APX-SEC-05",
    title: "Thread-Safe SQLite Parameterized Migrations (SQLi Fix)",
    file: "ApexsionsCore/src/main/java/com/apexsions/core/storage/SQLiteFallbackMigrator.java",
    language: "java",
    overview: "Pencegahan SQL Injection: Menghapus penggabungan string pada fallback migrator lokal dengan parameterized PreparedStatement dan isolation WAL mode.",
    lines: [
      { type: "context", oldLineNumber: 88, newLineNumber: 88, content: "public class SQLiteFallbackMigrator {" },
      { type: "removed", oldLineNumber: 89, content: "    // VULNERABLE: Direct string concatenation allows SQL Injection" },
      { type: "removed", oldLineNumber: 90, content: "    public void recordTransaction(String uuid, String territory, double amount) throws SQLException {" },
      { type: "removed", oldLineNumber: 91, content: "        Statement stmt = connection.createStatement();" },
      { type: "removed", oldLineNumber: 92, content: "        stmt.executeUpdate(\"INSERT INTO ledger (uuid, territory, amount) VALUES ('\" + uuid + \"', '\" + territory + \"', \" + amount + \")\");" },
      { type: "removed", oldLineNumber: 93, content: "    }" },
      { type: "added", newLineNumber: 89, content: "    // SECURED: Parameterized PreparedStatement with WAL journaling & strict types" },
      { type: "added", newLineNumber: 90, content: "    public void recordTransaction(UUID uuid, String territory, long amountCents) throws SQLException {" },
      { type: "added", newLineNumber: 91, content: "        String sql = \"INSERT INTO ledger (uuid, territory, amount_cents) VALUES (?, ?, ?)\";" },
      { type: "added", newLineNumber: 92, content: "        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {" },
      { type: "added", newLineNumber: 93, content: "            pstmt.setString(1, uuid.toString());" },
      { type: "added", newLineNumber: 94, content: "            pstmt.setString(2, territory);" },
      { type: "added", newLineNumber: 95, content: "            pstmt.setLong(3, amountCents);" },
      { type: "added", newLineNumber: 96, content: "            pstmt.executeUpdate();" },
      { type: "added", newLineNumber: 97, content: "        }" },
      { type: "added", newLineNumber: 98, content: "    }" },
      { type: "context", oldLineNumber: 94, newLineNumber: 99, content: "}" },
    ],
  },
  {
    id: "timing-safe-bridge",
    vulnId: "APX-SEC-03",
    title: "Timing-Safe HMAC Verification (Bridge Remote Execution Fix)",
    file: "ApexsionsBridge/src/main/java/com/apexsions/bridge/security/HmacAuthFilter.java",
    language: "java",
    overview: "Pencegahan kebocoran side-channel dan impersonasi API: Menggantikan perbandingan string dengan perbandingan byte constant-time MessageDigest.isEqual.",
    lines: [
      { type: "context", oldLineNumber: 24, newLineNumber: 24, content: "public class HmacAuthFilter {" },
      { type: "removed", oldLineNumber: 25, content: "    // VULNERABLE: String equals terminates early on mismatch (timing attack)" },
      { type: "removed", oldLineNumber: 26, content: "    public boolean verifyToken(String clientToken, String secret) {" },
      { type: "removed", oldLineNumber: 27, content: "        return clientToken != null && clientToken.equals(secret);" },
      { type: "removed", oldLineNumber: 28, content: "    }" },
      { type: "added", newLineNumber: 25, content: "    // SECURED: Constant-time byte comparison + 5-minute replay prevention window" },
      { type: "added", newLineNumber: 26, content: "    public boolean verifySignature(String signature, byte[] payload, byte[] key, long timestamp) {" },
      { type: "added", newLineNumber: 27, content: "        if (Math.abs(System.currentTimeMillis() - timestamp) > 300_000L) return false;" },
      { type: "added", newLineNumber: 28, content: "        byte[] expectedMac = computeHmacSha256(payload, key);" },
      { type: "added", newLineNumber: 29, content: "        byte[] providedMac = HexFormat.of().parseHex(signature);" },
      { type: "added", newLineNumber: 30, content: "        return MessageDigest.isEqual(expectedMac, providedMac);" },
      { type: "added", newLineNumber: 31, content: "    }" },
      { type: "context", oldLineNumber: 29, newLineNumber: 32, content: "}" },
    ],
  },
];

export function RemediationDiffViewer({ projectId }: { projectId: string }) {
  const [activeScenarioId, setActiveScenarioId] = useState(scenarios[0].id);
  const [copied, setCopied] = useState(false);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];

  const handleCopy = () => {
    const rawDiff = activeScenario.lines
      .map((l) => (l.type === "added" ? "+ " : l.type === "removed" ? "- " : "  ") + l.content)
      .join("\n");
    navigator.clipboard.writeText(rawDiff).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="study-section remediation-diff-section" aria-label="Perbandingan Remediasi Kode">
      <div className="case-section-header">
        <span className="case-section-eyebrow">
          <GitCompare size={14} aria-hidden="true" /> Remediation Diffs
        </span>
        <h2>Analisis Perbaikan Kode &amp; Patch Kerentanan</h2>
        <p className="case-section-desc">
          Perbandingan interaktif Before/After yang memperlihatkan kode asli yang rentan dan modifikasi arsitektur yang mengamankannya secara permanen di tingkat bytecode dan thread execution.
        </p>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="diff-tabs-bar" role="tablist" aria-label="Pilih skenario perbaikan kode">
        {scenarios.map((sc) => (
          <button
            key={sc.id}
            type="button"
            role="tab"
            aria-selected={activeScenarioId === sc.id}
            className={`diff-tab-btn ${activeScenarioId === sc.id ? "active" : ""}`}
            onClick={() => setActiveScenarioId(sc.id)}
          >
            <span className="diff-tab-id">{sc.vulnId}</span>
            <span className="diff-tab-name">{sc.title.split("(")[0]}</span>
          </button>
        ))}
      </div>

      {/* Diff Container */}
      <div className="diff-card">
        <div className="diff-card-header">
          <div className="diff-file-info">
            <Code2 size={16} aria-hidden="true" />
            <span className="diff-file-path">{activeScenario.file}</span>
            <span className="diff-badge-lang">{activeScenario.language.toUpperCase()}</span>
          </div>
          <button
            type="button"
            className="diff-copy-btn"
            onClick={handleCopy}
            aria-label="Salin diff mentah"
          >
            {copied ? (
              <>
                <Check size={14} aria-hidden="true" /> Tersalin
              </>
            ) : (
              <>
                <Copy size={14} aria-hidden="true" /> Salin Diff
              </>
            )}
          </button>
        </div>

        {/* Diff Code Viewer */}
        <div className="diff-code-viewport">
          <table className="diff-table">
            <tbody>
              {activeScenario.lines.map((line, idx) => (
                <tr key={idx} className={`diff-line-row diff-${line.type}`}>
                  <td className="diff-num old-num">{line.oldLineNumber ?? ""}</td>
                  <td className="diff-num new-num">{line.newLineNumber ?? ""}</td>
                  <td className="diff-marker">
                    {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                  </td>
                  <td className="diff-content">
                    <code>{line.content}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Diff Annotation */}
        <div className="diff-card-footer">
          <div className="diff-annotation">
            <span className="diff-annotation-label">Rasional Rekayasa:</span>
            <p className="diff-annotation-text">{activeScenario.overview}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
