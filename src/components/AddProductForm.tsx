"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  addProductFormSchema,
  type AddProductFormInput,
} from "@/lib/validators/product";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddProductFormProps {
  onSuccess?: () => void;
}

export function AddProductForm({ onSuccess }: AddProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<AddProductFormInput>({
    resolver: zodResolver(addProductFormSchema),
    defaultValues: {
      url: "",
      targetPrice: undefined,
    },
  });

  async function onSubmit(values: AddProductFormInput) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add product");
      }

      toast.success("Product added successfully!", {
        description: "We'll start tracking the price for you.",
      });

      form.reset();
      router.refresh(); // Refresh the page data
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to add product", {
        description:
          error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Product to Track</CardTitle>
        <CardDescription>
          Paste an Amazon product URL to start tracking its price
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://www.amazon.com/dp/B01234567..."
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Paste a product page URL (e.g., amazon.com/dp/B08N5...), not
                    a search page
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Price (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="99.99"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Get notified when the price drops below this amount
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Product...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Track This Product
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
