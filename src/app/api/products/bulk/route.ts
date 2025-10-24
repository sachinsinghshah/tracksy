import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bulkActionSchema = z.object({
  action: z.enum(["delete", "activate", "deactivate", "updateCategory"]),
  productIds: z.array(z.string()).min(1, "At least one product ID is required"),
  category: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = bulkActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { action, productIds, category } = validation.data;

    // Verify all products belong to the user
    const { data: products, error: fetchError } = await (supabase as any)
      .from("products")
      .select("id")
      .eq("user_id", user.id)
      .in("id", productIds);

    if (fetchError) {
      console.error("Error fetching products:", fetchError);
      return NextResponse.json(
        { error: "Failed to verify products" },
        { status: 500 }
      );
    }

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Some products not found or don't belong to you" },
        { status: 403 }
      );
    }

    let result;
    const validProductIds = products.map((p: any) => p.id);

    switch (action) {
      case "delete":
        // Delete products and their associated data
        const { error: deleteError } = await (supabase as any)
          .from("products")
          .delete()
          .in("id", validProductIds)
          .eq("user_id", user.id);

        if (deleteError) {
          console.error("Error deleting products:", deleteError);
          return NextResponse.json(
            { error: "Failed to delete products" },
            { status: 500 }
          );
        }

        result = { message: "Products deleted successfully", count: validProductIds.length };
        break;

      case "activate":
        const { error: activateError } = await (supabase as any)
          .from("products")
          .update({ is_active: true })
          .in("id", validProductIds)
          .eq("user_id", user.id);

        if (activateError) {
          console.error("Error activating products:", activateError);
          return NextResponse.json(
            { error: "Failed to activate products" },
            { status: 500 }
          );
        }

        result = { message: "Products activated successfully", count: validProductIds.length };
        break;

      case "deactivate":
        const { error: deactivateError } = await (supabase as any)
          .from("products")
          .update({ is_active: false })
          .in("id", validProductIds)
          .eq("user_id", user.id);

        if (deactivateError) {
          console.error("Error deactivating products:", deactivateError);
          return NextResponse.json(
            { error: "Failed to deactivate products" },
            { status: 500 }
          );
        }

        result = { message: "Products deactivated successfully", count: validProductIds.length };
        break;

      case "updateCategory":
        if (!category) {
          return NextResponse.json(
            { error: "Category is required for updateCategory action" },
            { status: 400 }
          );
        }

        const { error: categoryError } = await (supabase as any)
          .from("products")
          .update({ category })
          .in("id", validProductIds)
          .eq("user_id", user.id);

        if (categoryError) {
          console.error("Error updating category:", categoryError);
          return NextResponse.json(
            { error: "Failed to update category" },
            { status: 500 }
          );
        }

        result = { message: "Category updated successfully", count: validProductIds.length };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in bulk operations API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}