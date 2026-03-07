import { useState, useEffect } from "react";
import { cn } from "~/lib/utils";
import { useLocale } from "~/context/LocaleContext";
import { MobileMenu } from "./MobileMenu";
import { SearchPanel } from "./SearchPanel";
import { AccountPanel } from "./AccountPanel";
import { CartPanel } from "./CartPanel";
import { LocalePanel } from "./LocalePanel";

const navLinks = [
  { label: "Shop", href: "#new-collection" },
  { label: "Collections", href: "#editorial" },
  { label: "About Us", href: "#manifesto" },
];

export function Navbar() {
  const { currency } = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"search" | "account" | "cart" | "locale" | null>(null);

  const openPanel = (panel: "search" | "account" | "cart" | "locale") => {
    setActivePanel(panel);
    setMobileOpen(false);
  };
  const closePanel = () => setActivePanel(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "backdrop-blur-lg bg-flow-black/80"
            : "bg-transparent"
        )}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 md:h-20">
          {/* Left nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="link-underline text-xs uppercase tracking-[0.2em] text-flow-300 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Center logo */}
          <a
            href="/"
            className="absolute left-1/2 -translate-x-1/2 font-display text-xl md:text-2xl font-bold tracking-[0.15em] text-white"
          >
            FLOW
          </a>

          {/* Right icons */}
          <div className="hidden md:flex items-center gap-6 ml-auto">
            <button aria-label="Locale" className="text-flow-300 hover:text-white transition-colors flex flex-col items-center gap-0.5 group" onClick={() => openPanel("locale")}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.777.515-3.435 1.404-4.832" />
              </svg>
              <span className="text-[8px] font-bold tracking-wider text-flow-400 group-hover:text-white transition-colors">
                {currency}
              </span>
            </button>
            <button aria-label="Search" className="text-flow-300 hover:text-white transition-colors" onClick={() => openPanel("search")}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
            <button aria-label="Account" className="text-flow-300 hover:text-white transition-colors" onClick={() => openPanel("account")}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </button>
            <button aria-label="Cart" className="text-flow-300 hover:text-white transition-colors relative" onClick={() => openPanel("cart")}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-flow-black text-[10px] font-bold rounded-full flex items-center justify-center">
                0
              </span>
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            aria-label="Open menu"
            className="md:hidden ml-auto text-white"
            onClick={() => setMobileOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
        </nav>
      </header>

      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={navLinks}
      />

      <LocalePanel isOpen={activePanel === "locale"} onClose={closePanel} />
      <SearchPanel isOpen={activePanel === "search"} onClose={closePanel} />
      <AccountPanel isOpen={activePanel === "account"} onClose={closePanel} />
      <CartPanel isOpen={activePanel === "cart"} onClose={closePanel} />
    </>
  );
}
