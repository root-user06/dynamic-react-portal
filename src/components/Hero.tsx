
import React, { useEffect, useRef } from "react";
import AnimatedButton from "./AnimatedButton";

const Hero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Set up interactive background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let width = window.innerWidth;
    let height = 650;
    
    // Set canvas dimensions
    const updateDimensions = () => {
      width = window.innerWidth;
      height = Math.min(650, window.innerHeight * 0.7);
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener("resize", updateDimensions);
    updateDimensions();
    
    // Create particles
    const particlesArray: Particle[] = [];
    const particleCount = width > 768 ? 20 : 12;
    
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 15 + 5;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.opacity = Math.random() * 0.2 + 0.1;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x > width) this.x = 0;
        else if (this.x < 0) this.x = width;
        
        if (this.y > height) this.y = 0;
        else if (this.y < 0) this.y = height;
      }
      
      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(200, 200, 205, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
    }
    
    const init = () => {
      for (let i = 0; i < particleCount; i++) {
        particlesArray.push(new Particle());
      }
    };
    
    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      
      for (const particle of particlesArray) {
        particle.update();
        particle.draw();
      }
      
      requestAnimationFrame(animate);
    };
    
    init();
    animate();
    
    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  return (
    <section className="relative pt-28 md:pt-36 pb-20 overflow-hidden">
      {/* Interactive background */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-[650px] -z-10"
      />
      
      {/* Hero content */}
      <div className="container px-6 md:px-10 mx-auto">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <span className="inline-block animate-fade-in py-1 px-4 bg-foreground/10 rounded-full text-sm font-medium">
            Introducing a new era of design
          </span>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold leading-tight text-balance animate-fade-in [animation-delay:200ms]">
            Elevate Your Experience with Simplicity
          </h1>
          
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed text-balance animate-fade-in [animation-delay:400ms]">
            A harmonious blend of form and function, crafted with meticulous attention to detail and dedication to user experience.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in [animation-delay:600ms]">
            <AnimatedButton size="lg" href="#products">
              Explore Products
            </AnimatedButton>
            <AnimatedButton size="lg" variant="outline" href="#features">
              Learn More
            </AnimatedButton>
          </div>
        </div>
      </div>
      
      {/* Gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-40 hero-gradient -z-10"></div>
    </section>
  );
};

export default Hero;
