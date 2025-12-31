// Payment calculation utilities for delivery partner system
import { Decimal } from 'decimal.js';

/**
 * Calculate delivery fee based on distance
 * Formula: Base Fee (₹20) + (Distance × ₹8/km)
 */
export function calculateDeliveryFee(distanceKm: number): number {
    const BASE_FEE = 20;
    const PER_KM_RATE = 8;

    const fee = BASE_FEE + (distanceKm * PER_KM_RATE);
    return Math.round(fee);
}

/**
 * Calculate complete order payment breakdown
 */
export interface OrderPaymentBreakdown {
    // Product
    productPrice: number;
    platformProductCommission: number;
    customerPaysProduct: number;
    shopEarnings: number;

    // Delivery
    deliveryFee: number;
    platformDeliveryCommission: number;
    partnerEarnings: number;

    // Platform
    platformTotalCommission: number;
    gstAmount: number;
    platformNetEarnings: number;

    // Total
    customerPaysTotal: number;
}

export function calculateOrderPayment(
    productPrice: number,
    deliveryFee: number,
    deliveryType: 'shop_delivery' | 'platform_delivery'
): OrderPaymentBreakdown {

    // Product calculations (5% platform commission)
    const platformProductCommission = new Decimal(productPrice).times(0.05).toNumber();
    const customerPaysProduct = new Decimal(productPrice).plus(platformProductCommission).toNumber();
    const shopEarnings = productPrice;

    // Delivery calculations
    let platformDeliveryCommission = 0;
    let partnerEarnings = 0;

    if (deliveryType === 'platform_delivery') {
        // Platform delivery: 10% commission
        platformDeliveryCommission = new Decimal(deliveryFee).times(0.10).toNumber();
        partnerEarnings = new Decimal(deliveryFee).times(0.90).toNumber();
    } else {
        // Shop delivery: no platform commission
        platformDeliveryCommission = 0;
        partnerEarnings = 0; // Shop pays their partner directly
    }

    // Platform earnings with GST
    const platformTotalCommission = new Decimal(platformProductCommission)
        .plus(platformDeliveryCommission)
        .toNumber();

    const gstAmount = new Decimal(platformTotalCommission).times(0.18).toNumber(); // 18% GST
    const platformNetEarnings = new Decimal(platformTotalCommission)
        .minus(gstAmount)
        .toNumber();

    // Customer total
    const customerPaysTotal = new Decimal(customerPaysProduct)
        .plus(deliveryFee)
        .toNumber();

    return {
        productPrice,
        platformProductCommission: Math.round(platformProductCommission * 100) / 100,
        customerPaysProduct: Math.round(customerPaysProduct * 100) / 100,
        shopEarnings: Math.round(shopEarnings * 100) / 100,
        deliveryFee: Math.round(deliveryFee * 100) / 100,
        platformDeliveryCommission: Math.round(platformDeliveryCommission * 100) / 100,
        partnerEarnings: Math.round(partnerEarnings * 100) / 100,
        platformTotalCommission: Math.round(platformTotalCommission * 100) / 100,
        gstAmount: Math.round(gstAmount * 100) / 100,
        platformNetEarnings: Math.round(platformNetEarnings * 100) / 100,
        customerPaysTotal: Math.round(customerPaysTotal * 100) / 100
    };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Generate random 6-digit OTP
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if partner can deliver to location
 */
export function canPartnerDeliver(
    partner: {
        service_area_pincodes: string[];
        max_delivery_radius_km: number;
        latitude: number;
        longitude: number;
    },
    deliveryLocation: {
        pincode: string;
        latitude: number;
        longitude: number;
    }
): boolean {

    // Check pincode
    if (partner.service_area_pincodes.includes(deliveryLocation.pincode)) {
        return true;
    }

    // Check radius
    const distance = calculateDistance(
        partner.latitude,
        partner.longitude,
        deliveryLocation.latitude,
        deliveryLocation.longitude
    );

    return distance <= partner.max_delivery_radius_km;
}

/**
 * Calculate daily settlement for a partner
 */
export interface DailySettlement {
    partnerId: string;
    settlementDate: Date;
    totalDeliveries: number;
    totalEarnings: number;
    bonus: number;
    deductions: number;
    netAmount: number;
    deliveryAssignmentIds: string[];
}

export function calculateDailySettlement(
    deliveries: Array<{ id: string; partner_earnings: number }>,
    partnerId: string,
    date: Date
): DailySettlement {

    const totalDeliveries = deliveries.length;
    const totalEarnings = deliveries.reduce(
        (sum, d) => sum + parseFloat(d.partner_earnings.toString()),
        0
    );

    // Bonus: ₹50 for 5+ deliveries, ₹100 for 10+ deliveries
    let bonus = 0;
    if (totalDeliveries >= 10) {
        bonus = 100;
    } else if (totalDeliveries >= 5) {
        bonus = 50;
    }

    // Deductions (penalties, cancellations, etc.)
    const deductions = 0; // TODO: Calculate based on complaints/cancellations

    const netAmount = totalEarnings + bonus - deductions;

    return {
        partnerId,
        settlementDate: date,
        totalDeliveries,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        bonus,
        deductions,
        netAmount: Math.round(netAmount * 100) / 100,
        deliveryAssignmentIds: deliveries.map(d => d.id)
    };
}

/**
 * Get financial year from date
 */
export function getFinancialYear(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0-indexed

    if (month >= 4) {
        return `${year}-${(year + 1).toString().slice(2)}`;
    } else {
        return `${year - 1}-${year.toString().slice(2)}`;
    }
}

/**
 * Get quarter from date
 */
export function getQuarter(date: Date): string {
    const month = date.getMonth() + 1;

    if (month >= 4 && month <= 6) return 'Q1';
    if (month >= 7 && month <= 9) return 'Q2';
    if (month >= 10 && month <= 12) return 'Q3';
    return 'Q4'; // Jan-Mar
}
