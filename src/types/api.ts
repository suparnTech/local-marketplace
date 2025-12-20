// src/types/api.ts
export interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    images: string[];
    image_url?: string;
    rating: number;
    stock_quantity: number;
    shop_id?: string;
    store_id?: string;
    shop_name?: string;
    category_name?: string;
    variants?: any;
    store?: { name: string };
}

export interface Shop {
    id: string;
    name: string;
    description: string;
    logo_url?: string;
    rating: number;
    address_line1: string;
    phone: string;
    category_name: string;
    city?: string;
    state?: string;
}
