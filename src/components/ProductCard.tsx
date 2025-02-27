
import React, { useState } from "react";
import AnimatedButton from "./AnimatedButton";

interface ProductCardProps {
  title: string;
  description: string;
  image: string;
  price: string;
  isNew?: boolean;
  delay?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  title,
  description,
  image,
  price,
  isNew = false,
  delay = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`animate-on-scroll relative flex flex-col rounded-2xl overflow-hidden transition-all duration-500 ease-apple bg-card shadow-subtle hover:shadow-elevated`}
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container with zoom effect */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className={`w-full h-full object-cover transition-transform duration-700 ease-apple ${
            isHovered ? "scale-105" : "scale-100"
          }`}
          loading="lazy"
        />
        
        {/* "New" badge */}
        {isNew && (
          <span className="absolute top-4 right-4 bg-foreground text-white text-xs font-medium px-2 py-1 rounded-full">
            New
          </span>
        )}
      </div>
      
      {/* Content */}
      <div className="flex flex-col p-6 flex-grow">
        <h3 className="text-xl md:text-2xl font-medium mb-2">{title}</h3>
        <p className="text-foreground/70 mb-6 flex-grow">{description}</p>
        
        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg font-medium">{price}</span>
          <AnimatedButton size="sm">Add to Cart</AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
