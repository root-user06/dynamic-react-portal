
import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import AnimatedButton from "./AnimatedButton";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-apple px-6 md:px-10 ${
        isScrolled
          ? "py-4 bg-white/80 backdrop-blur-md shadow-subtle"
          : "py-6 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <a 
          href="/" 
          className="text-xl md:text-2xl font-medium flex items-center gap-2 z-10 transition-transform hover:scale-[1.02] duration-300"
        >
          <span className="inline-block w-3 h-3 bg-black rounded-full"></span>
          Essence
        </a>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <NavLinks />
          <AnimatedButton>Get Started</AnimatedButton>
        </nav>

        {/* Mobile menu toggle */}
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden z-10 focus:outline-none"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile navigation */}
        <div
          className={`fixed inset-0 bg-white flex flex-col justify-center items-center space-y-8 transition-all duration-500 ease-apple ${
            mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        >
          <NavLinks mobile onClick={() => setMobileMenuOpen(false)} />
          <AnimatedButton onClick={() => setMobileMenuOpen(false)}>
            Get Started
          </AnimatedButton>
        </div>
      </div>
    </header>
  );
};

interface NavLinksProps {
  mobile?: boolean;
  onClick?: () => void;
}

const NavLinks: React.FC<NavLinksProps> = ({ mobile, onClick }) => {
  const links = [
    { name: "Products", href: "#products" },
    { name: "Features", href: "#features" },
    { name: "About", href: "#about" },
  ];

  return (
    <>
      {links.map((link) => (
        <a
          key={link.name}
          href={link.href}
          onClick={onClick}
          className={`relative text-foreground/80 hover:text-foreground transition-colors duration-300 
            after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-foreground 
            after:origin-bottom-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform 
            after:duration-300 ease-apple ${mobile ? "text-xl py-2" : ""}`}
        >
          {link.name}
        </a>
      ))}
    </>
  );
};

export default Navbar;
