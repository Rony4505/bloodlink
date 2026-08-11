export function formatBdt(amount: number): string {
  return `৳ ${amount.toLocaleString("en-BD")}`;
}

export function cartItemKey(productId: string, size: string, color: string): string {
  return `${productId}:${size}:${color}`;
}
