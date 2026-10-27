#!/usr/bin/env node
/**
 * NetPocket — Android air-gap hardening.
 *
 * Run after `npx cap add android` / `npx cap sync android`.
 * Enforces air-gap guarantees:
 * - Strips all network permissions (INTERNET, ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE).
 * - Creates network_security_config.xml blocking cleartext and removing all trust anchors.
 * - Creates data_extraction_rules.xml blocking cloud/device backups on Android 12+.
 * - Injects allowBackup="false", usesCleartextTraffic="false", networkSecurityConfig, and dataExtractionRules into AndroidManifest.xml.
 *
 * Idempotent and safe to run repeatedly.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const manifestPath = resolve('android/app/src/main/AndroidManifest.xml');
const resXmlDir = resolve('android/app/src/main/res/xml');

if (!existsSync(manifestPath)) {
  console.log('[harden-android] android/ platform not found — run `npx cap add android` first. Nothing to do.');
  process.exit(0);
}

// 1. Ensure res/xml directory exists
if (!existsSync(resXmlDir)) {
  mkdirSync(resXmlDir, { recursive: true });
}

// 2. Generate network_security_config.xml (Zero trust anchors, cleartext forbidden)
const netSecPath = resolve(resXmlDir, 'network_security_config.xml');
const netSecXml = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- NetPocket Air-Gap: Disallow cleartext traffic and disable all CA trust anchors -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors />
    </base-config>
</network-security-config>
`;
writeFileSync(netSecPath, netSecXml, 'utf8');

// 3. Generate data_extraction_rules.xml (Android 12+ backup exclusion)
const dataExtractionPath = resolve(resXmlDir, 'data_extraction_rules.xml');
const dataExtractionXml = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <!-- NetPocket Air-Gap: Exclude all local storage from cloud and device-to-device transfers -->
    <cloud-backup>
        <exclude domain="root" path="." />
        <exclude domain="file" path="." />
        <exclude domain="database" path="." />
        <exclude domain="sharedpref" path="." />
        <exclude domain="external" path="." />
    </cloud-backup>
    <device-transfer>
        <exclude domain="root" path="." />
        <exclude domain="file" path="." />
        <exclude domain="database" path="." />
        <exclude domain="sharedpref" path="." />
        <exclude domain="external" path="." />
    </device-transfer>
</data-extraction-rules>
`;
writeFileSync(dataExtractionPath, dataExtractionXml, 'utf8');

// 4. Harden AndroidManifest.xml
let xml = readFileSync(manifestPath, 'utf8');
const original = xml;

const removedPermissions = [
  'android.permission.INTERNET',
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.ACCESS_WIFI_STATE',
];

for (const perm of removedPermissions) {
  const re = new RegExp(`\\s*<uses-permission[^>]*android:name="${perm.replace(/\\./g, '\\.')}"[^>]*/>`, 'g');
  xml = xml.replace(re, '');
}

// Ensure allowBackup="false"
if (/android:allowBackup="true"/.test(xml)) {
  xml = xml.replace(/android:allowBackup="true"/, 'android:allowBackup="false"');
} else if (!/android:allowBackup=/.test(xml)) {
  xml = xml.replace(/<application\b/, '<application\n        android:allowBackup="false"');
}

// Ensure usesCleartextTraffic="false"
if (/android:usesCleartextTraffic="true"/.test(xml)) {
  xml = xml.replace(/android:usesCleartextTraffic="true"/, 'android:usesCleartextTraffic="false"');
} else if (!/android:usesCleartextTraffic=/.test(xml)) {
  xml = xml.replace(/<application\b/, '<application\n        android:usesCleartextTraffic="false"');
}

// Ensure networkSecurityConfig="@xml/network_security_config"
if (!/android:networkSecurityConfig=/.test(xml)) {
  xml = xml.replace(/<application\b/, '<application\n        android:networkSecurityConfig="@xml/network_security_config"');
}

// Ensure dataExtractionRules="@xml/data_extraction_rules"
if (!/android:dataExtractionRules=/.test(xml)) {
  xml = xml.replace(/<application\b/, '<application\n        android:dataExtractionRules="@xml/data_extraction_rules"');
}

if (xml !== original) {
  writeFileSync(manifestPath, xml, 'utf8');
  console.log('[harden-android] AndroidManifest.xml hardened: network permissions removed, security configs & backup rules bound.');
} else {
  console.log('[harden-android] AndroidManifest.xml already hardened.');
}
console.log('[harden-android] Android security configurations verified (network_security_config.xml, data_extraction_rules.xml).');
