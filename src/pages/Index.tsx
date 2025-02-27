
import React from "react";
import Layout from "../components/Layout";
import Hero from "../components/Hero";
import ProductShowcase from "../components/ProductShowcase";
import AnimatedButton from "../components/AnimatedButton";
import { ArrowRight } from "lucide-react";

const Index: React.FC = () => {
  return (
    <Layout>
      <Hero />
      <ProductShowcase />
      
      {/* Features section */}
      <section id="features" className="py-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-on-scroll">
            <span className="inline-block py-1 px-4 bg-foreground/10 rounded-full text-sm font-medium mb-4">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl font-medium mb-4">
              Thoughtfully Designed
            </h2>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              Every detail has been carefully considered to create a seamless 
              experience that elevates everyday moments.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="flex flex-col p-8 rounded-2xl bg-card border border-border/50 animate-on-scroll"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center mb-6">
                  <feature.icon size={24} className="text-foreground/80" />
                </div>
                <h3 className="text-xl font-medium mb-3">{feature.title}</h3>
                <p className="text-foreground/70 mb-4">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Showcase/About section */}
      <section id="about" className="py-20 px-6 md:px-10 bg-secondary/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-on-scroll order-2 lg:order-1">
              <span className="inline-block py-1 px-4 bg-foreground/10 rounded-full text-sm font-medium mb-4">
                Our Philosophy
              </span>
              <h2 className="text-3xl md:text-4xl font-medium mb-6">
                Less, But Better
              </h2>
              <p className="text-foreground/70 mb-6 text-lg">
                We believe in the power of thoughtful design. Everything we create 
                is guided by the principle that good design is as little design as possible.
              </p>
              <p className="text-foreground/70 mb-8">
                Each product goes through an extensive refinement process, where we 
                continuously question and improve every element until only what's 
                essential remains.
              </p>
              
              <AnimatedButton href="#products">
                <span>Discover our products</span>
                <ArrowRight size={16} className="ml-2" />
              </AnimatedButton>
            </div>
            
            <div className="animate-on-scroll order-1 lg:order-2">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1507646227500-4d389b0012be?q=80&w=2070&auto=format&fit=crop"
                  alt="Workspace with minimal products" 
                  className="rounded-2xl shadow-elevated w-full"
                />
                <div className="absolute -bottom-6 -right-6 md:-bottom-8 md:-right-8 bg-white p-4 md:p-6 rounded-xl shadow-elevated animate-float">
                  <p className="text-sm md:text-base font-medium">Thoughtfully crafted</p>
                  <p className="text-xs md:text-sm text-foreground/70">Every detail matters</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Newsletter/CTA section */}
      <section className="py-20 px-6 md:px-10">
        <div className="max-w-3xl mx-auto text-center animate-on-scroll">
          <span className="inline-block py-1 px-4 bg-foreground/10 rounded-full text-sm font-medium mb-4">
            Stay Connected
          </span>
          <h2 className="text-3xl md:text-4xl font-medium mb-4">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-foreground/70 mb-8">
            Be the first to know about new products, exclusive offers, and design insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-grow py-3 px-4 rounded-full bg-secondary border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <AnimatedButton>Subscribe</AnimatedButton>
          </div>
        </div>
      </section>
    </Layout>
  );
};

// Feature data
const features = [
  {
    title: "Intuitive Design",
    description: "Products that feel natural to use, with interfaces that disappear into the experience.",
    icon: ({ size, className }: { size: number; className: string }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  },
  {
    title: "Premium Materials",
    description: "Carefully selected materials that look beautiful and stand the test of time.",
    icon: ({ size, className }: { size: number; className: string }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Sustainable Approach",
    description: "Designed for longevity, with materials and processes that minimize environmental impact.",
    icon: ({ size, className }: { size: number; className: string }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 3c.3 5-4.6 6-8 6 0 0 2 6 8 6-9 0-8 6-8 6" />
        <path d="M2 15h20" />
        <path d="M2 9h20" />
      </svg>
    ),
  },
  {
    title: "Seamless Integration",
    description: "Products that work together effortlessly, creating a cohesive ecosystem.",
    icon: ({ size, className }: { size: number; className: string }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M7 7h10" />
        <path d="M7 12h10" />
        <path d="M7 17h10" />
      </svg>
    ),
  },
  {
    title: "Attention to Detail",
    description: "Every element has been carefully considered, from materials to packaging.",
    icon: ({ size, className }: { size: number; className: string }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
      </svg>
    ),
  },
  {
    title: "Future-Proof",
    description: "Products designed to evolve and improve over time through thoughtful updates.",
    icon: ({ size, className }: { size: number; className: string }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export default Index;
