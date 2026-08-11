import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/fashion/customer-auth";
import { addReview, listReviews } from "@/lib/fashion/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId") ?? undefined;
  const reviews = await listReviews(productId);
  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  const customer = await getCurrentCustomer();
  const body = await request.json();
  const { productId, rating, comment, customerName } = body;

  if (!productId || !rating || !comment) {
    return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  }

  const review = await addReview({
    productId,
    customerId: customer?.id,
    customerName: customerName || customer?.name || "Guest",
    rating: Math.min(5, Math.max(1, Number(rating))),
    comment: String(comment).trim(),
  });

  return NextResponse.json({ review });
}
