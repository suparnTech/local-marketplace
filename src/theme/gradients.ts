// src/theme/gradients.ts - Dark Green Gradient Theme
export const gradients = {
    // Primary Green Gradients - Deep forest to emerald
    primary: ['#047857', '#10B981'] as const, // Emerald 700 to 500
    primaryVertical: ['#065F46', '#047857', '#10B981'] as const, // Emerald 800 to 700 to 500
    primaryDark: ['#064E3B', '#047857'] as const, // Emerald 900 to 700

    // Background Gradients - DARK GREEN like the image
    background: ['#0A0F0A', '#1A2318'] as const, // Almost black to dark forest green
    backgroundDark: ['#000000', '#0A0F0A'] as const, // Pure black to almost black green
    backgroundGreen: ['#0F1410', '#1A2318', '#243020'] as const, // Dark green gradient

    // Surface Gradients (for cards) - Subtle dark green surfaces
    surface: ['rgba(26, 35, 24, 0.6)', 'rgba(36, 48, 32, 0.4)'] as const,
    surfaceLight: ['rgba(36, 48, 32, 0.7)', 'rgba(52, 64, 48, 0.5)'] as const,

    // Glassmorphism - Green tinted
    glass: ['rgba(16, 185, 129, 0.08)', 'rgba(16, 185, 129, 0.04)'] as const,
    glassLight: ['rgba(16, 185, 129, 0.12)', 'rgba(16, 185, 129, 0.06)'] as const,
    glassDark: ['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.2)'] as const,

    // Accent Gradients
    accent: ['#84CC16', '#A3E635'] as const, // Lime gradient
    success: ['#10B981', '#34D399'] as const, // Emerald gradient
    error: ['#EF4444', '#F87171'] as const,

    // Button Gradients - Emerald for primary actions
    button: ['#10B981', '#34D399'] as const,
    buttonDark: ['#047857', '#10B981'] as const,
    buttonLight: ['#34D399', '#6EE7B7'] as const,
};

export default gradients;
