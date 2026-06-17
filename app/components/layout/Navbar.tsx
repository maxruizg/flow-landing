import { useState, useEffect } from "react";
import { useRouteLoaderData } from "@remix-run/react";
import { cn } from "~/lib/utils";
import { useCart } from "~/context/CartContext";
import { AnimatePresence, motion } from "framer-motion";
import { MobileMenu } from "./MobileMenu";
import { SearchPanel } from "./SearchPanel";
import { AccountPanel } from "./AccountPanel";
import { CartPanel } from "./CartPanel";
import { LocalePanel } from "./LocalePanel";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { TopBanner } from "./TopBanner";
import type { Banner } from "~/lib/types";

const navLinks = [
  { label: "Shop", href: "/showroom" },
  { label: "About Us", href: "/#manifesto" },
];

export function Navbar() {
  const { itemCount } = useCart();
  const rootData = useRouteLoaderData("root") as { banner?: Banner | null } | undefined;
  const banner = rootData?.banner || null;
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
      <header className="fixed top-0 left-0 right-0 z-50">
        {banner && <TopBanner banner={banner} />}
        <div
          className={cn(
            "transition-all duration-500",
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
            className="absolute left-1/2 -translate-x-1/2"
          >
            <img
              src="/images/logo/flow-white.png"
              alt="FLOW Urban Wear"
              className="h-6 md:h-8 w-auto"
            />
          </a>

          {/* Right icons */}
          <div className="hidden md:flex items-center gap-6 ml-auto">
            <LocaleSwitcher onOpenSettings={() => openPanel("locale")} />
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
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-white text-flow-black text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

          {/* Mobile right icons */}
          <div className="md:hidden ml-auto flex items-center gap-4">
            <LocaleSwitcher compact onOpenSettings={() => openPanel("locale")} />
            <button
              aria-label="Cart"
              className="text-flow-300 hover:text-white transition-colors relative"
              onClick={() => openPanel("cart")}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-white text-flow-black text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              aria-label="Open menu"
              className="text-white"
              onClick={() => setMobileOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            </button>
          </div>
        </nav>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onOpenPanel={openPanel}
        links={navLinks}
      />

      <LocalePanel isOpen={activePanel === "locale"} onClose={closePanel} />
      <SearchPanel isOpen={activePanel === "search"} onClose={closePanel} />
      <AccountPanel isOpen={activePanel === "account"} onClose={closePanel} />
      <CartPanel isOpen={activePanel === "cart"} onClose={closePanel} />
    </>
  );
}
