
import { cn } from "@/lib/utils";
import React from "react";

interface MessageBubbleProps {
  children: React.ReactNode;
  isCurrentUser: boolean;
  className?: string;
}

export function MessageBubble({ children, isCurrentUser, className }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "max-w-[80%] px-4 py-2 rounded-2xl text-sm",
        isCurrentUser 
          ? "bg-[#46C8B6] text-white self-end rounded-br-none" 
          : "bg-gray-100 text-gray-900 self-start rounded-bl-none",
        className
      )}
    >
      {children}
    </div>
  );
}
