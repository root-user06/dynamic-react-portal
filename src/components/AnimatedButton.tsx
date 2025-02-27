
import React from "react";

interface AnimatedButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  href?: string;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  href,
}) => {
  // Style variants
  const variants = {
    primary:
      "bg-foreground text-white hover:bg-foreground/90 active:bg-foreground/80",
    secondary:
      "bg-muted text-foreground hover:bg-muted/80 active:bg-muted/70",
    outline:
      "bg-transparent border border-foreground/20 text-foreground hover:bg-foreground/5 active:bg-foreground/10",
  };

  // Size variants
  const sizes = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-5 py-2.5",
    lg: "px-6 py-3 text-lg",
  };

  const baseClasses = `
    inline-flex items-center justify-center rounded-full
    font-medium transition-all duration-300 ease-apple
    shadow-button hover:shadow-button-hover hover:-translate-y-0.5
    active:translate-y-0 active:shadow-button
    focus:outline-none focus:ring-2 focus:ring-primary/20
    ${variants[variant]} ${sizes[size]} ${className}
  `;

  const ButtonContent = (
    <>
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </>
  );

  if (href) {
    return (
      <a href={href} className={baseClasses} onClick={onClick}>
        {ButtonContent}
      </a>
    );
  }

  return (
    <button className={baseClasses} onClick={onClick}>
      {ButtonContent}
    </button>
  );
};

export default AnimatedButton;
