import { useState } from "react";
import { Container } from "~/components/ui/Container";
import { brand } from "~/data/brand";
import { AboutPanel } from "./AboutPanel";
import { ShippingPanel } from "./ShippingPanel";
import { PolicyPanel } from "./PolicyPanel";

const shopLinks = [
  { label: "New Arrivals", href: "/showroom?new=true" },
  { label: "Best Sellers", href: "/showroom" },
  { label: "Tees", href: "/showroom?category=Tops" },
  { label: "Crop Tops", href: "/showroom?category=Tops&gender=women" },
  { label: "Shorts", href: "/showroom?category=Bottoms" },
  { label: "Hoodies", href: "/showroom?category=Tops" },
  { label: "Accessories", href: "/showroom?category=Accessories" },
];
const socialLinks = ["Instagram", "TikTok", "Twitter/X", "Pinterest"];

interface CompanyLink {
  label: string;
  action: "about" | "link";
}

const companyLinks: CompanyLink[] = [
  { label: "About Us", action: "about" },
  { label: "Sustainability", action: "link" },
  { label: "Careers", action: "link" },
  { label: "Press", action: "link" },
  { label: "Contact", action: "about" },
];

export function Footer() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  return (
    <>
      <footer className="bg-flow-950 border-t border-flow-800">
        <Container className="py-16 md:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {/* Brand */}
            <div>
              <img
                src="/images/logo/flow-white.png"
                alt="FLOW Urban Wear"
                className="h-7 w-auto mb-4"
              />
              <p className="text-sm text-flow-500 leading-relaxed max-w-xs">
                {brand.description}
              </p>
            </div>

            {/* Shop */}
            <div>
              <h4 className="text-xs uppercase tracking-[0.25em] text-flow-300 font-medium mb-4">
                Shop
              </h4>
              <ul className="space-y-2.5">
                {shopLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-flow-500 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs uppercase tracking-[0.25em] text-flow-300 font-medium mb-4">
                Company
              </h4>
              <ul className="space-y-2.5">
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    <button
                      type="button"
                      onClick={() => {
                        if (link.action === "about") setAboutOpen(true);
                      }}
                      className="text-sm text-flow-500 hover:text-white transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-xs uppercase tracking-[0.25em] text-flow-300 font-medium mb-4">
                Follow Us
              </h4>
              <ul className="space-y-2.5">
                {socialLinks.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-flow-500 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-flow-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-flow-600">
              &copy; 2026 FLOW URBAN WEAR. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs text-flow-600">
              <button
                type="button"
                onClick={() => setPolicyOpen(true)}
                className="hover:text-flow-300 transition-colors"
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => setPolicyOpen(true)}
                className="hover:text-flow-300 transition-colors"
              >
                Terms
              </button>
              <button
                type="button"
                onClick={() => setShippingOpen(true)}
                className="hover:text-flow-300 transition-colors"
              >
                Shipping
              </button>
              <button
                type="button"
                onClick={() => setPolicyOpen(true)}
                className="hover:text-flow-300 transition-colors"
              >
                Cookies
              </button>
            </div>
          </div>
        </Container>
      </footer>

      <AboutPanel isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ShippingPanel isOpen={shippingOpen} onClose={() => setShippingOpen(false)} />
      <PolicyPanel isOpen={policyOpen} onClose={() => setPolicyOpen(false)} />
    </>
  );
}
