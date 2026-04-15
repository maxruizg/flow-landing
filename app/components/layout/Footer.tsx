import { useState } from "react";
import { Container } from "~/components/ui/Container";
import { brand } from "~/data/brand";
import { AboutPanel } from "./AboutPanel";
import { ContactPanel } from "./ContactPanel";
import { ShippingPanel } from "./ShippingPanel";
import { PolicyPanel } from "./PolicyPanel";

const socialLinks: { label: string; href: string }[] = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/flow_urbanwear?igsh=NTFuM25waWNkbzhl&utm_source=qr",
  },
  { label: "TikTok", href: "https://www.tiktok.com/@flowurbanwear" },
  { label: "Pinterest", href: "https://pin.it/4kEAnnRjx" },
];

interface CompanyLink {
  label: string;
  action: "about" | "contact";
}

const companyLinks: CompanyLink[] = [
  { label: "About Us", action: "about" },
  { label: "Contact", action: "contact" },
];

export function Footer() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);

  return (
    <>
      <footer className="bg-flow-950 border-t border-flow-800">
        <Container className="py-16 md:py-20">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-10">
            {/* Brand */}
            <div className="lg:max-w-sm">
              <img
                src="/images/logo/flow-white.png"
                alt="FLOW Urban Wear"
                className="h-7 w-auto mb-4"
              />
              <p className="text-sm text-flow-500 leading-relaxed max-w-xs">
                {brand.description}
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-16 sm:gap-24">
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
                          else if (link.action === "contact") setContactOpen(true);
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
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-flow-500 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
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
      <ContactPanel isOpen={contactOpen} onClose={() => setContactOpen(false)} />
      <ShippingPanel isOpen={shippingOpen} onClose={() => setShippingOpen(false)} />
      <PolicyPanel isOpen={policyOpen} onClose={() => setPolicyOpen(false)} />
    </>
  );
}
