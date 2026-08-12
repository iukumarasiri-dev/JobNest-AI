import net from "node:net";

export function isPrivateAddress(address: string): boolean {
  const type = net.isIP(address);
  if (type === 4) return isPrivateIPv4(address);
  if (type === 6) return isPrivateIPv6(address);
  return true;
}

function isPrivateIPv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIPv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe80")) return true;
  if (normalized.startsWith("::ffff:")) {
    const ipv4Part = normalized.split("::ffff:")[1];
    if (ipv4Part && net.isIP(ipv4Part) === 4) return isPrivateIPv4(ipv4Part);
  }
  return false;
}
