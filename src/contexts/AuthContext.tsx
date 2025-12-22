// src/contexts/AuthContext.tsx
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

interface User {
    id: string;
    name: string;
    phone: string;
    email?: string;
    role: "CUSTOMER" | "STORE_OWNER" | "ADMIN";
    address?: string;
    city?: string;
    pincode?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, phone: string, password?: string, email?: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Load token and user on mount
    useEffect(() => {
        loadAuth();
    }, []);

    // Set auth header when token changes
    useEffect(() => {
        if (token) {
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common["Authorization"];
        }
    }, [token]);

    const loadAuth = async () => {
        try {
            const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
            const storedUser = await SecureStore.getItemAsync(USER_KEY);

            if (storedToken && storedUser) {
                // Restore from cache immediately - no server call!
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;

                // Optional: Verify in background (don't block UI)
                // This will catch expired tokens but won't show loading spinner
                api.get("/auth/me").catch(() => {
                    // Token expired, clear auth
                    logout();
                });
            }
        } catch (error) {
            console.error("Load auth error:", error);
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(USER_KEY);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post("/cognito-auth/login", { email, password });
            const { user: userData, token: authToken } = response.data;

            await SecureStore.setItemAsync(TOKEN_KEY, authToken);
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
            setToken(authToken);
            setUser(userData);

            // Navigate based on role
            if (userData.role === "ADMIN") {
                router.replace("/admin/(tabs)/pending" as any);
            } else if (userData.role === "STORE_OWNER") {
                router.replace("/store-owner/dashboard");
            } else {
                // Customers go to welcome screen (acts as splash with location detection)
                router.replace("/welcome");
            }
        } catch (error: any) {
            console.error("Login error:", error);
            throw error;
        }
    };

    const register = async (name: string, phone: string, password?: string, email?: string) => {
        try {
            const response = await api.post("/auth/register", {
                name,
                phone,
                password,
                email,
            });
            const { user: userData, token: authToken } = response.data;

            await SecureStore.setItemAsync(TOKEN_KEY, authToken);
            setToken(authToken);
            setUser(userData);
        } catch (error: any) {
            console.error("Register error:", error);
            throw new Error(error.response?.data?.message || "Registration failed");
        }
    };

    const logout = async () => {
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(USER_KEY);
            setToken(null);
            setUser(null);
            router.replace("/welcome");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const updateProfile = async (data: Partial<User>) => {
        try {
            const response = await api.put("/auth/profile", data);
            setUser(response.data);
        } catch (error: any) {
            console.error("Update profile error:", error);
            throw new Error(error.response?.data?.message || "Update failed");
        }
    };

    const refreshUser = async () => {
        try {
            const response = await api.get("/auth/me");
            setUser(response.data);
        } catch (error) {
            console.error("Refresh user error:", error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                register,
                logout,
                updateProfile,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
