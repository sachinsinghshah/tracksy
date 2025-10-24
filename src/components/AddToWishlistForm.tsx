"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

const addToWishlistSchema = z.object({
  url: z.string().url("Please provide a valid URL"),
  title: z.string().optional(),
  notes: z.string().optional(),
});

type AddToWishlistFormInput = z.infer<typeof addToWishlistSchema>;

interface AddToWishlistFormProps {
  onSuccess?: () => void;
}

export function AddToWishlistForm({ onSuccess }: AddToWishlistFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<AddToWishlistFormInput>({
    resolver: zodResolver(addToWishlistSchema),
    defaultValues: {
      url: "",
      title: "",
      notes: "",
    },
  });

  async function onSubmit(values: AddToWishlistFormInput) {
    setIsLoading(true);

    try {
      // Extract site from URL
      const url = new URL(values.url);
      const site = url.hostname.replace("www.", "");

      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          site,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add to wishlist");
      }

      toast.success("Added to wishlist!", {
        description: "Item saved for later tracking.",
      });

      form.reset();
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to add to wishlist", {
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
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Add to Wishlist
        </CardTitle>
        <CardDescription>
          Save items for later price tracking
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
                  <FormLabel>Item URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://www.amazon.com/dp/B01234567..."
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Paste any product URL to save it
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Custom title for this item"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Leave blank to auto-detect from the page
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this item..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Personal notes about this item
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding to Wishlist...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  Add to Wishlist
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}