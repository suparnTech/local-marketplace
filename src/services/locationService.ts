// src/services/locationService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { api } from '../lib/api';

const SELECTED_TOWN_KEY = '@selected_town';

export interface Town {
    id: string;
    name: string;
    state: string;
    latitude?: number;
    longitude?: number;
}

/**
 * Get user's current GPS location
 */
export async function getCurrentLocation() {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.log('Location permission denied');
            return null;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        console.log('📍 GPS Location:', {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
        });

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
    } catch (error) {
        console.error('Error getting location:', error);
        return null;
    }
}

/**
 * Find nearest town based on GPS coordinates
 */
export async function findNearestTown(latitude: number, longitude: number): Promise<Town | null> {
    try {
        console.log(`🔍 Finding nearest town for: ${latitude}, ${longitude}`);
        const response = await api.get('/api/towns/nearest', {
            params: { latitude, longitude }
        });
        console.log('✅ Nearest town found:', response.data.name);
        return response.data;
    } catch (error) {
        console.error('Error finding nearest town:', error);
        return null;
    }
}

/**
 * Save selected town to AsyncStorage
 */
export async function saveSelectedTown(town: Town) {
    try {
        await AsyncStorage.setItem(SELECTED_TOWN_KEY, JSON.stringify(town));
        console.log('💾 Saved town:', town.name);
    } catch (error) {
        console.error('Error saving town:', error);
    }
}

/**
 * Get saved town from AsyncStorage
 */
export async function getSavedTown(): Promise<Town | null> {
    try {
        const townJson = await AsyncStorage.getItem(SELECTED_TOWN_KEY);
        if (townJson) {
            const town = JSON.parse(townJson);
            console.log('📂 Retrieved saved town:', town.name);
            return town;
        }
        return null;
    } catch (error) {
        console.error('Error getting saved town:', error);
        return null;
    }
}

/**
 * Clear saved town (useful for forcing fresh GPS detection)
 */
export async function clearSavedTown() {
    try {
        await AsyncStorage.removeItem(SELECTED_TOWN_KEY);
        console.log('🗑️ Cleared saved town');
    } catch (error) {
        console.error('Error clearing saved town:', error);
    }
}

/**
 * Auto-detect and set town based on GPS (ALWAYS uses fresh GPS)
 */
export async function autoDetectTown(): Promise<Town | null> {
    console.log('🎯 Starting auto-detect town...');

    // ALWAYS try GPS first for accurate, real-time location
    const location = await getCurrentLocation();
    if (location) {
        const nearestTown = await findNearestTown(location.latitude, location.longitude);
        if (nearestTown) {
            await saveSelectedTown(nearestTown);
            return nearestTown;
        }
    }

    // Only fall back to saved town if GPS completely fails
    console.log('⚠️ GPS failed, checking saved town...');
    const savedTown = await getSavedTown();
    return savedTown;
}
