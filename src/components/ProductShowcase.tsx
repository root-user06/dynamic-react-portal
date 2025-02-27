
import React from "react";
import ProductCard from "./ProductCard";

const ProductShowcase: React.FC = () => {
  const products = [
    {
      id: 1,
      title: "Minimal Speaker",
      description: "Exceptional clarity with a design that fits any space.",
      image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=2069&auto=format&fit=crop",
      price: "$299",
      isNew: true,
      delay: 0,
    },
    {
      id: 2,
      title: "Essence Watch",
      description: "Precision timekeeping with thoughtful design elements.",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
      price: "$349",
      isNew: false,
      delay: 100,
    },
    {
      id: 3,
      title: "Harmony Headphones",
      description: "Immersive sound wrapped in minimalist elegance.",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop",
      price: "$249",
      isNew: false,
      delay: 200,
    },
  ];

  return (
    <section id="products" className="py-20 px-6 md:px-10 bg-secondary/50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center animate-on-scroll">
          <span className="inline-block py-1 px-4 bg-foreground/10 rounded-full text-sm font-medium mb-4">
            Our Products
          </span>
          <h2 className="text-3xl md:text-4xl font-medium mb-4">
            Designed for Everyday Life
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            Each product is created with a focus on simplicity, usability, and timeless design that enhances your everyday experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              title={product.title}
              description={product.description}
              image={product.image}
              price={product.price}
              isNew={product.isNew}
              delay={product.delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
