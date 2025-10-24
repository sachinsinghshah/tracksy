"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Plus } from "lucide-react";

const CATEGORIES = [
  "Electronics",
  "Clothing & Fashion",
  "Home & Garden",
  "Books & Media",
  "Sports & Outdoors",
  "Health & Beauty",
  "Toys & Games",
  "Automotive",
  "Food & Grocery",
  "Office Supplies",
  "Jewelry & Watches",
  "Pet Supplies",
  "Travel & Luggage",
  "Baby & Kids",
  "Tools & Hardware",
  "Other",
];

interface CategorySelectorProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  disabled?: boolean;
}

export function CategorySelector({
  selectedCategory,
  onCategoryChange,
  disabled = false,
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCategorySelect = (category: string) => {
    onCategoryChange(category);
    setIsOpen(false);
  };

  const handleClear = () => {
    onCategoryChange(null);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="flex items-center gap-2">
            {selectedCategory ? (
              <Badge variant="secondary">{selectedCategory}</Badge>
            ) : (
              "Select Category"
            )}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full" align="start">
        <DropdownMenuItem onClick={handleClear}>
          <span className="text-muted-foreground">No Category</span>
        </DropdownMenuItem>
        {CATEGORIES.map((category) => (
          <DropdownMenuItem
            key={category}
            onClick={() => handleCategorySelect(category)}
            className="flex items-center justify-between"
          >
            <span>{category}</span>
            {selectedCategory === category && (
              <div className="w-2 h-2 bg-primary rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}