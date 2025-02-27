
import React from "react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  const sections = [
    {
      title: "Products",
      links: [
        { name: "Speakers", href: "#" },
        { name: "Watches", href: "#" },
        { name: "Headphones", href: "#" },
        { name: "Accessories", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Press", href: "#" },
        { name: "Sustainability", href: "#" },
      ],
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", href: "#" },
        { name: "Contact Us", href: "#" },
        { name: "Shipping", href: "#" },
        { name: "Returns", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-secondary pt-16 pb-8 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <a href="/" className="inline-flex items-center gap-2 mb-4">
              <span className="inline-block w-3 h-3 bg-black rounded-full"></span>
              <span className="text-xl font-medium">Essence</span>
            </a>
            <p className="text-foreground/70 mb-6 max-w-md">
              Creating products that embody the harmony of form and function, 
              designed with intention and crafted with precision.
            </p>
            <div className="flex space-x-4">
              {["Twitter", "Instagram", "YouTube", "LinkedIn"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary-foreground/5 text-foreground/80 transition-colors hover:bg-secondary-foreground/10 hover:text-foreground"
                  aria-label={social}
                >
                  {social.charAt(0)}
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="font-medium mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-foreground/70 hover:text-foreground transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-foreground/60 text-sm mb-4 md:mb-0">
            © {currentYear} Essence. All rights reserved.
          </p>
          <div className="flex space-x-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm text-foreground/60 hover:text-foreground transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
