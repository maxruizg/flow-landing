import { Container } from "~/components/ui/Container";

const shopLinks = ["New Arrivals", "Best Sellers", "Tops", "Bottoms", "Outerwear", "Accessories"];
const companyLinks = ["About Us", "Sustainability", "Careers", "Press", "Contact"];
const socialLinks = ["Instagram", "TikTok", "Twitter/X", "Pinterest"];

export function Footer() {
  return (
    <footer className="bg-flow-950 border-t border-flow-800">
      <Container className="py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-display text-xl font-bold tracking-[0.15em] text-white mb-4">
              FLOW
            </h3>
            <p className="text-sm text-flow-500 leading-relaxed max-w-xs">
              Premium urban streetwear for those who move with intention. Based in New York City.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.25em] text-flow-300 font-medium mb-4">
              Shop
            </h4>
            <ul className="space-y-2.5">
              {shopLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-flow-500 hover:text-white transition-colors">
                    {link}
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
                <li key={link}>
                  <a href="#" className="text-sm text-flow-500 hover:text-white transition-colors">
                    {link}
                  </a>
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
            <a href="#" className="hover:text-flow-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-flow-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-flow-300 transition-colors">Cookies</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
