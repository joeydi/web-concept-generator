import { describe, expect, it } from "vitest";
import { assertPublicUrl, isPrivateIp, normalizeDomain, safeFetch } from "@/lib/server/ssrf";

describe("isPrivateIp", () => {
  it.each(["10.0.0.1", "127.0.0.1", "169.254.169.254", "172.16.5.4", "192.168.1.1", "0.0.0.0", "100.64.0.1", "224.0.0.1", "::1", "::", "fe80::1", "fc00::1", "::ffff:127.0.0.1", "::ffff:7f00:1"])(
    "blocks %s", (ip) => expect(isPrivateIp(ip)).toBe(true));
  it.each(["8.8.8.8", "1.1.1.1", "93.184.216.34", "2606:4700:4700::1111"])("allows %s", (ip) => expect(isPrivateIp(ip)).toBe(false));
});

describe("normalizeDomain", () => {
  it("strips scheme, www and path", () => expect(normalizeDomain("https://www.Example.com/a?b#c")).toBe("example.com"));
  it.each(["localhost", "127.0.0.1", "foo", "http://169.254.169.254/", "a.local", "bad domain.com", "", "2130706433", "1.2.3.4"])(
    "rejects %s", (v) => expect(normalizeDomain(v)).toBeNull());
});

describe("assertPublicUrl", () => {
  it("rejects non-http schemes", async () => { await expect(assertPublicUrl(new URL("file:///etc/passwd"))).rejects.toThrow(); });
  it("rejects loopback and metadata hosts", async () => {
    await expect(assertPublicUrl(new URL("http://127.0.0.1:3000/"))).rejects.toThrow();
    await expect(assertPublicUrl(new URL("http://169.254.169.254/latest/meta-data"))).rejects.toThrow();
    await expect(assertPublicUrl(new URL("http://[::1]/"))).rejects.toThrow();
    await expect(assertPublicUrl(new URL("http://2130706433/"))).rejects.toThrow(); // URL parser turns this into 127.0.0.1
    await expect(assertPublicUrl(new URL("http://0x7f.1/"))).rejects.toThrow();
  });
  it("rejects embedded credentials", async () => { await expect(assertPublicUrl(new URL("http://user:pw@example.com/"))).rejects.toThrow(); });
  it("rejects localhost by name", async () => { await expect(assertPublicUrl(new URL("http://localhost/"))).rejects.toThrow(); });
});

describe("safeFetch", () => {
  it("refuses private targets before connecting", async () => { await expect(safeFetch("http://127.0.0.1:9/")).rejects.toThrow(); });
});
