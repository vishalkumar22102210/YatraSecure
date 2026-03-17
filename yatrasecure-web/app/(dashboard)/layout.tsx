"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  MapPin, LayoutDashboard, Compass, Bell,
  User, LogOut, Menu, X, Settings, Plus, Map, ShoppingBag,
  PanelLeftClose, PanelLeftOpen
} from "lucide-react";

// Nav items, "Wallet" has been removed to simplify user flow
const navItems = [
  { href: "/dashboard",       icon: LayoutDashboard, label: "Overview"      },
  { href: "/trips",           icon: Compass,         label: "Trips"         },
  { href: "/guides",          icon: Map,             label: "Destinations"  },
  { href: "/marketplace",     icon: ShoppingBag,     label: "Marketplace"   },
  { href: "/notifications",   icon: Bell,            label: "Alerts"        },
  { href: "/profile",         icon: User,            label: "Profile"       },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]           = useState<any>(null);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [unread, setUnread]       = useState(0);
  const [dropOpen, setDrop]       = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDrop(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function logout() {
    localStorage.clear();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  const avatar = user?.username?.slice(0, 2).toUpperCase() || "YS";
  const sidebarWidth = desktopCollapsed ? 80 : 260;

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "var(--bg)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      {/* Mobile overlay */}
      {mobileSidebar && (
        <div
          onClick={() => setMobileSidebar(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.8)", zIndex: 40, backdropFilter: "blur(8px)" }}
          className="lg:hidden"
        />
      )}

      <aside style={{
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
        width: sidebarWidth,
        background: "linear-gradient(180deg, var(--bg) 0%, var(--bg2) 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex", flexDirection: "column",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.5)"
      }} 
      className={`transform ${mobileSidebar ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo Area */}
        <div style={{ padding: desktopCollapsed ? "28px 12px 24px" : "28px 24px 24px", display: "flex", flexDirection: "column", alignItems: desktopCollapsed ? "center" : "stretch" }}>
          <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: desktopCollapsed ? "center" : "space-between" }}>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "var(--cta-gradient)",
                boxShadow: "0 4px 12px rgba(56,189,248,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                transition: "box-shadow 0.4s",
              }}>
                <MapPin style={{ width: 16, height: 16, color: "white" }} />
              </div>
              {!desktopCollapsed && (
                <span style={{ fontSize: 16, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
                  YatraSecure
                </span>
              )}
            </Link>
            <button
                onClick={() => setMobileSidebar(false)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: 8,
                  transition: "all 0.2s",
                }}
                className="hover:bg-white/10 hover:text-white hover:rotate-90 transition-all duration-200 flex lg:hidden"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
          </div>

          {/* Create New Trip Button */}
          <Link href="/dashboard?create=true" style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
            <button style={{
              marginTop: 24, width: '100%', height: 40, borderRadius: 10,
              background: 'rgba(56,189,248,0.08)',
              border: '1px solid rgba(56,189,248,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
            className="hover:bg-[rgba(56,189,248,0.15)] group"
            >
              <Plus style={{ width: 16, height: 16 }} className="group-hover:scale-110 transition-transform" />
              {!desktopCollapsed && "New Trip"}
            </button>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: desktopCollapsed ? "0 8px" : "0 16px", overflowX: "hidden", overflowY: "auto" }}>
          <div style={{ marginBottom: 24 }}>
            {!desktopCollapsed && (
              <p style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: "0.1em", padding: "0 12px", marginBottom: 12 }}>
                MENU
              </p>
            )}
            {navItems.map(({ href, icon: Icon, label }) => {
              const active = isActive(href);
              return (
                <Link key={href} href={href} onClick={() => setMobileSidebar(false)} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: desktopCollapsed ? 0 : 12, justifyContent: desktopCollapsed ? "center" : "flex-start",
                    padding: desktopCollapsed ? "10px 0" : "10px 12px", borderRadius: 10, marginBottom: 4,
                    background: active ? "linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)" : "transparent",
                    cursor: "pointer", transition: "all 0.2s",
                    position: "relative",
                    border: "1px solid transparent",
                    borderColor: active ? "rgba(255,255,255,0.05)" : "transparent"
                  }}
                    className={`group ${!active && "hover:bg-white/5"}`}
                    title={desktopCollapsed ? label : undefined}
                  >
                    {active && <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, borderRadius: "0 4px 4px 0", background: "var(--accent)", boxShadow: "0 0 10px var(--accent)", transition: "height 0.3s" }} />}
                    <Icon style={{ 
                      width: 18, height: 18, 
                      color: active ? "white" : "#64748b", flexShrink: 0,
                      transition: "color 0.2s" 
                    }} 
                      className={`group-hover:text-slate-300 ${active && "drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"}`}
                    />
                    {!desktopCollapsed && (
                      <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "white" : "#94a3b8", transition: "color 0.2s" }} className="group-hover:text-slate-200">
                        {label}
                      </span>
                    )}
                    {!desktopCollapsed && label === "Alerts" && unread > 0 && (
                      <div style={{
                        marginLeft: "auto", minWidth: 18, height: 18,
                        borderRadius: 999, background: "var(--accent)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, color: "white", padding: "0 5px",
                        boxShadow: "0 0 10px rgba(56,189,248,0.4)"
                      }}>
                        {unread > 9 ? "9+" : unread}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div>
            {!desktopCollapsed && (
              <p style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: "0.1em", padding: "0 12px", marginBottom: 12 }}>
                SUPPORT
              </p>
            )}
            <Link href="/settings" style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: desktopCollapsed ? 0 : 12, justifyContent: desktopCollapsed ? "center" : "flex-start",
                padding: desktopCollapsed ? "10px 0" : "10px 12px", borderRadius: 10, marginBottom: 4,
                cursor: "pointer", transition: "all 0.2s",
              }}
              className="hover:bg-white/5 group"
              title={desktopCollapsed ? "Settings" : undefined}
              >
                <Settings style={{ width: 18, height: 18, color: "#64748b", flexShrink: 0 }} className="group-hover:text-slate-300" />
                {!desktopCollapsed && <span style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8" }} className="group-hover:text-slate-200">Settings</span>}
              </div>
            </Link>
          </div>
        </nav>

        {/* User Profile Snippet (Bottom) */}
        {user && (
          <div style={{ padding: desktopCollapsed ? "16px 8px" : "16px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px", borderRadius: 12, transition: "background 0.2s", justifyContent: desktopCollapsed ? "center" : "flex-start" }} className="hover:bg-white/5 cursor-pointer">
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "white",
              }}>
                {avatar}
              </div>
              {!desktopCollapsed && (
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "white", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.username}
                  </p>
                  <p style={{ fontSize: 11, color: "#64748b", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* ══ MAIN AREA ════════════════════════════════════════════════════════ */}
      <div style={{ 
        flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh",
        marginLeft: 0, // Default for mobile
        transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      }} 
      className="lg:!ml-0" // override for lg, we handle it via style below
      >
        <div style={{ marginLeft: "auto", display: "none" }} className="lg:!block" />

        <div style={{ display: 'contents' }}>
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? sidebarWidth : 0,
            background: 'var(--dashboard-bg)', // new color system
          }} className={`lg:ml-[${sidebarWidth}px]`}>
            {/* ── TOP NAV BAR ── */}
            <header style={{
              position: "sticky", top: 0, zIndex: 30,
              background: "linear-gradient(90deg, var(--dashboard-gradient-start), var(--dashboard-gradient-end))", // time-based gradient
              backdropFilter: "blur(24px)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              padding: "0 28px", height: 64,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 16,
              boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
              animation: 'fade-slide-down 0.7s',
            }}>
              {/* Left — Breadcrumb & Collapse Toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button
                  onClick={() => setMobileSidebar(true)}
                  className="lg:hidden"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 4 }}>
                  <Menu style={{ width: 20, height: 20 }} />
                </button>
                <button
                  onClick={() => setDesktopCollapsed(!desktopCollapsed)}
                  className="hidden lg:flex"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, cursor: "pointer", color: "#94a3b8", padding: 6, transition: "background 0.2s" }}>
                  {desktopCollapsed ? <PanelLeftOpen style={{ width: 16, height: 16 }} /> : <PanelLeftClose style={{ width: 16, height: 16 }} />}
                </button>
                <div className="hidden md:flex" style={{ alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>YatraSecure</span>
                  <span style={{ color: "#334155" }}>/</span>
                  <span style={{ fontSize: 13, color: "white", fontWeight: 600, textTransform: "capitalize", letterSpacing: "0.02em" }}>
                    {pathname.split("/")[1] || "overview"}
                  </span>
                </div>
              </div>
              {/* Right — Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Link href="/notifications" style={{ textDecoration: "none" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", position: "relative", transition: "all 0.2s",
                    boxShadow: '0 0 12px var(--dashboard-accent)',
                    animation: 'lift 0.5s',
                  }}
                  className="hover:bg-white/10 hover:border-white/20">
                        <Bell style={{ width: 16, height: 16, color: "#cbd5e1" }} />
                        {unread > 0 && (
                        <div style={{
                            position: "absolute", top: -2, right: -2,
                            width: 14, height: 14, borderRadius: "50%",
                            background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 9, fontWeight: 800, color: "white",
                            boxShadow: "0 0 10px rgba(56,189,248,0.4)"
                        }}>
                            {unread}
                        </div>
                        )}
                    </div>
                    </Link>

                    {/* Profile Dropdown */}
                    <div ref={dropRef} style={{ position: "relative" }}>
                    <div
                        onClick={() => setDrop(!dropOpen)}
                        style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer",
                        transition: "all 0.2s"
                        }}
                        className="hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:border-white/20"
                    >
                        {avatar}
                    </div>

                    {dropOpen && (
                        <div style={{
                        position: "absolute", top: "calc(100% + 12px)", right: 0,
                        width: 220, borderRadius: 16,
                        background: "rgba(15,23,42,0.95)", backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                        overflow: "hidden", zIndex: 100, padding: 8
                        }}
                        className="anim-in"
                        >
                        <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 8 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: "white", margin: 0 }}>{user?.username}</p>
                            <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</p>
                        </div>
                        
                        <Link href="/profile" onClick={() => setDrop(false)} style={{ textDecoration: "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, fontSize: 13, color: "#cbd5e1", cursor: "pointer", transition: "all 0.2s" }} className="hover:bg-white/10 hover:text-white">
                            <User style={{ width: 14, height: 14 }} /> Profile
                            </div>
                        </Link>
                        <Link href="/settings" onClick={() => setDrop(false)} style={{ textDecoration: "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, fontSize: 13, color: "#cbd5e1", cursor: "pointer", transition: "all 0.2s" }} className="hover:bg-white/10 hover:text-white">
                            <Settings style={{ width: 14, height: 14 }} /> Settings
                            </div>
                        </Link>
                        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "8px 0" }} />
                        <div onClick={() => { setDrop(false); logout(); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, fontSize: 13, color: "#ef4444", cursor: "pointer", transition: "all 0.2s" }} className="hover:bg-red-500/10">
                            <LogOut style={{ width: 14, height: 14 }} /> Sign Out
                        </div>
                        </div>
                    )}
                    </div>
                </div>
                </header>

                {/* ── MAIN CONTENT AREA ── */}
                <main style={{ flex: 1, padding: "32px", overflowY: "auto", position: 'relative' }}>
                <div style={{ 
                    position: 'absolute', top: 0, left: '20%', width: '60%', height: '30vh',
                    background: 'radial-gradient(ellipse at top, rgba(29,78,216,0.15) 0%, transparent 70%)',
                    pointerEvents: 'none', zIndex: -1
                }} />
                {children}
                </main>
            </div>
        </div>
      </div>
    </div>
  );
}
