# NetPocket Cybersecurity 🛡️
> **100% Offline Tactical Blue Team & Network Engineering Mobile Toolkit**
> Built with React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, and Capacitor.

NetPocket is an air-gapped, zero-telemetry mobile companion engineered for **SOC Analysts, Network Engineers, Incident Responders, Sysadmins, and Cybersecurity Students**. Designed from the ground up for untrusted or isolated field engagements, it requires zero external connections, zero CDNs, and zero backend infrastructure.

---

## 🔒 Air-Gapped Security Guarantee

- **Zero Internet Permission:** The Android release manifest strips `android.permission.INTERNET` via automated build hook (`scripts/harden-android.mjs`).
- **Strict Build-Time Content Security Policy (CSP):**
  ```http
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'
  ```
  `connect-src 'none'` enforces at the engine level that no outgoing network requests (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`) can ever leave the application.
- **Volatile In-Memory Processing:** Sensitive logs, IP subnets, credentials, IOCs, and hash computations are evaluated in local volatile memory (RAM) and never saved or indexed to disk.
- **Zero Third-Party Telemetry:** No analytics SDKs, advertising trackers, crash reporters, or remote loggers.

---

## 📱 Core Tactical Modules

### 1. Inspector (IOC Dissector & Codecs)
- **Smart Format Detection:** Automatic recognition of Base64, Hexadecimal, Binary (8-bit), URL-encoded strings, defanged IOCs, and live indicators.
- **Defang & Refang:** Instant conversion between raw indicators (`http://evil.com/malware.exe`, `192.168.1.1`) and safe reporting syntax (`hxxp[://]evil[.]com/malware[.]exe`, `192[.]168[.]1[.]1`).
- **Real-Time Bidirectional Codecs:**
  - Base64 (UTF-8 binary safe)
  - URL Percent Encoding
  - Hexadecimal (Spaced or continuous byte pairs)
  - Binary (8-bit padded byte strings)
- **Pure TypeScript Cryptographic Hashes:**
  - **MD5** (128-bit checksum — tagged with vulnerability disclaimer)
  - **SHA-1** (160-bit digest — flagged as deprecated for security)
  - **SHA-256** (256-bit industry standard integrity verification)
  - Synchronous, zero-dependency implementations passing the full NIST / RFC test vector suite.

### 2. Networks (IPv4 & CIDR Subnet Calculator)
- **Arbitrary IPv4 Subnetting:** Full `/1` to `/32` prefix calculation with interactive slider, decrement/increment buttons, and quick tactical presets (`/32`, `/30`, `/29`, `/28`, `/24`, `/16`, `/8`).
- **RFC Scope Analysis:** Categorizes addresses into RFC 1918 Private, Loopback, Link-Local (APIPA), CGNAT Shared Space, Multicast, Documentation, IANA Reserved, Limited Broadcast, or Public WAN.
- **32-Bit Binary X-Ray:** Visualizes all 4 octets bit-by-bit with clear color division between Network bits (accent blue) and Host bits (muted gray).
- **Subnet Metrics:** Network Address, Broadcast Address, First & Last Usable Hosts, Total Hosts, Usable Host Capacity, Subnet Mask, and Cisco ACL Wildcard Mask.
- **Target In-Subnet Tester:** Verifies whether an arbitrary secondary IP falls inside the calculated CIDR block.

### 3. Ports (Attack Surface Reference)
- **44 High-Value Tactical Ports:** Exhaustive database covering Active Directory, Linux remote administration, databases, web servers, mail protocols, and critical WAN exposures.
- **Multi-Vector Threat Analysis:**
  - Standard service name and protocol (TCP/UDP).
  - Blue team operational purpose.
  - Known adversary attack techniques & exploitation vectors (MS17-010, Zerologon, EternalBlue, Kerberoasting, SSRF, Amplification DDoS).
  - Hardening recommendations & firewall mitigation rules.
- **Search & Filtering:** Instant keyword search by port number, protocol, service, or attack vector. Filter by category or pinned favorites.

### 4. Guard (SOC Analyst Triage Suite)
- **Windows Security Event IDs:** 29 high-priority event codes across Authentication, Privilege Escalation, Anti-Forensics, Persistence, and Lateral Movement.
  - Complete **Logon Types breakdown for Event 4624** (Interactive, Network, Batch, Service, RemoteInteractive RDP, NewCredentials RunAs, NetworkCleartext).
  - **RC4 (`0x17`) Kerberoasting detection notes for Event 4769**.
  - MITRE ATT&CK technique IDs, triage steps, and log channel origin.
- **Linux chmod Permissions Matrix:**
  - Interactive 3×3 permission grid (`Read`, `Write`, `Execute` for `Owner`, `Group`, `Others`).
  - Special execution bits (`SUID`, `SGID`, `Sticky Bit`).
  - Bidirectional conversion between octal (`755`, `4750`) and symbolic (`rwxr-xr-x`, `rwsr-x---`).
  - One-tap ready-to-run shell commands (`chmod 755 /path/to/target`).
  - **Blue Team Risk Auditor:** Flags dangerous permission configurations (e.g., world-writable files, SUID roots).
- **HTTP Security & WAF Log Triage:**
  - 15 critical status codes (`200`, `301/302`, `400`, `401`, `403`, `404`, `405`, `413`, `422`, `429`, `451`, `500`, `502`, `503`, `504`).
  - Distinguishes legitimate server responses from WAF blocks, credential stuffing spikes, path traversal scans, and L7 DoS saturation.

---

## 🌐 Localization & Design System

- **Languages:** Full localization in **English (`en`)**, **Spanish (`es`)**, and **Portuguese (`pt`)** across all interface labels, port vectors, event logs, and status code analyses.
- **Dual Theme Support:**
  - **Tactical Dark Mode (Default):** Deep slate `#0B0F19` background with `#111827` surface cards and `#38BDF8` cyan accents.
  - **Field Light Mode:** High-contrast daylight theme with darkened semantic badges (`#DC2626` critical red, `#B45309` warning amber, `#047857` safe emerald) meeting WCAG AAA outdoor visibility standards.
- **Tactile Ergonomics:** Full-surface copy cards with 600ms green border confirmation flash, haptic vibration feedback, and monospace terminal fields.

---

## 🛠️ Verification & Build Commands

```bash
# 1. Run the pure TypeScript crypto and network test suite (902 checks)
npm run test:crypto

# 2. Perform TypeScript type checking
npm run typecheck

# 3. Build optimized production web bundle (HTML, CSS, JS)
npm run build

# 4. Preview production build locally
npm run preview
```

---

## 🚀 Capacitor Android Packaging

To generate the native Android Studio project and package the production APK / AAB:

```bash
# 1. Initialize Android project and apply the air-gapped hardening script
npm run cap:add:android

# 2. Sync web assets and enforce AndroidManifest security hardening
npm run cap:sync

# 3. Open in Android Studio to build unsigned APK or signed release bundle
npx cap open android
```

### Manifest Hardening Script
The automated script [`scripts/harden-android.mjs`](scripts/harden-android.mjs) runs during every Capacitor sync to:
1. Strip `android.permission.INTERNET` from `android/app/src/main/AndroidManifest.xml`.
2. Set `android:usesCleartextTraffic="false"`.
3. Set `android:networkSecurityConfig="@xml/network_security_config"` to block all cleartext and clear all CA trust stores for outbound connections.

---

## 📄 License
MIT License. Created for the cybersecurity and network engineering community.
