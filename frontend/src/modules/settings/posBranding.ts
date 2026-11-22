export const businessTypes = ["Grocery / Supermarket", "Fashion / Clothing", "Bakery", "Restaurant", "Pharmacy", "Electronics", "Other"] as const;
export type BrandIcon = "cart" | "shirt" | "bakery" | "restaurant" | "pharmacy" | "electronics" | "store";
export type POSBranding = { displayName: string; businessType: string; icon: BrandIcon };
export const defaultPOSBranding: POSBranding = { displayName: "Priyasaman POS", businessType: "Grocery / Supermarket", icon: "cart" };
export const brandIcons: { id: BrandIcon; label: string }[] = [
  { id: "cart", label: "Shopping Cart" }, { id: "shirt", label: "Clothing" },
  { id: "bakery", label: "Bakery" }, { id: "restaurant", label: "Restaurant" },
  { id: "pharmacy", label: "Pharmacy" }, { id: "electronics", label: "Electronics" },
  { id: "store", label: "Store" }
];
export const iconForBusinessType = (type: string): BrandIcon => ({
  "Grocery / Supermarket": "cart", "Fashion / Clothing": "shirt", "Bakery": "bakery",
  "Restaurant": "restaurant", "Pharmacy": "pharmacy", "Electronics": "electronics", "Other": "store"
} as Record<string, BrandIcon>)[type] ?? "store";
