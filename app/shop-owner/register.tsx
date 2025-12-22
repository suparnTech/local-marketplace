// app/shop-owner/register.tsx
// Shop Owner Registration - Multi-Step Form

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassHeader } from '../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../src/components/ui/SafeView';
import { api } from '../../src/lib/api';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';

type RegistrationStep = 1 | 2 | 3 | 4;

interface FormData {
    // Step 1: Basic Info
    businessName: string;
    ownerName: string;
    phone: string;
    email: string;
    password: string; // Added password field for account creation

    // Step 2: Address
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    landmark: string;

    // Step 3: Category & Operational
    categoryId: string;
    openingTime: string;
    closingTime: string;
    weeklyOff: string[];
    deliveryRadius: number;
    minimumOrderValue: number;
}

export default function ShopOwnerRegisterScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const mode = params.mode as string;
    const [currentStep, setCurrentStep] = useState<RegistrationStep>(1);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/api/categories');
                setCategories(response.data);
            } catch (error) {
                console.error('Failed to fetch categories', error);
                // Silent error or retry logic
            }
        };
        fetchCategories();
    }, []);

    const [formData, setFormData] = useState<FormData>({
        businessName: '',
        ownerName: '',
        phone: '',
        email: '',
        password: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        categoryId: '',
        openingTime: '09:00',
        closingTime: '21:00',
        weeklyOff: ['Sunday'],
        deliveryRadius: 5,
        minimumOrderValue: 0,
    });

    const updateFormData = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        // Validate current step
        if (currentStep === 1) {
            if (!formData.businessName || !formData.ownerName || !formData.phone || !formData.password) {
                Alert.alert('Error', 'Please fill all required fields');
                return;
            }
        } else if (currentStep === 2) {
            if (!formData.addressLine1 || !formData.city || !formData.state || !formData.pincode) {
                Alert.alert('Error', 'Please fill all required fields');
                return;
            }
        }

        if (currentStep < 4) {
            setCurrentStep((prev) => (prev + 1) as RegistrationStep);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => (prev - 1) as RegistrationStep);
        } else {
            router.back();
        }
    };

    const handleSubmit = async () => {
        setLoading(true);

        try {
            let token: string | null = null;

            if (mode !== 'setup') {
                // 1. Create User Account (Only for new registration)
                const userResponse = await api.post('/auth/register', {
                    name: formData.ownerName,
                    phone: formData.phone,
                    email: formData.email,
                    password: formData.password,
                    role: 'STORE_OWNER',
                    city: formData.city,
                    pincode: formData.pincode,
                    address: formData.addressLine1
                });

                const data = userResponse.data;
                token = data.token;
                const user = data.user;

                if (!token) {
                    throw new Error('Registration failed - No access token received');
                }

                // 2. Save Token & Set Header
                await SecureStore.setItemAsync('auth_token', token);
                await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
                // We are already logged in, so we have the token
                // Ensure header is set (it should be if app is initialized, but safe to check?)
                // api.ts interceptors handle it usually.
            }

            // 3. Register Shop
            await api.post('/api/shop-owner/register', formData);

            Alert.alert(
                'Success',
                'Shop registered successfully! Please complete KYC verification.',
                [
                    {
                        text: 'Continue',
                        onPress: () => router.push('/shop-owner/kyc-upload'),
                    },
                ]
            );
        } catch (error: any) {
            console.error('Registration Error:', error);
            const errorMessage = error.response?.data?.error || 'Failed to register shop';
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map((step) => (
                <View
                    key={step}
                    style={[
                        styles.progressDot,
                        step <= currentStep && styles.progressDotActive,
                    ]}
                />
            ))}
        </View>
    );

    const renderStep1 = () => (
        <Animated.View
            entering={FadeInRight}
            exiting={FadeOutLeft}
            style={styles.stepContainer}
        >
            <Text style={styles.stepTitle}>Basic Information</Text>
            <Text style={styles.stepSubtitle}>Tell us about your business</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>
                    Business Name <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="storefront-outline" size={20} color={colors.textMuted} />
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Sharma Kirana Store"
                        placeholderTextColor={colors.textMuted}
                        value={formData.businessName}
                        onChangeText={(value) => updateFormData('businessName', value)}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>
                    Owner Name <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color={colors.textMuted} />
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Rajesh Sharma"
                        placeholderTextColor={colors.textMuted}
                        value={formData.ownerName}
                        onChangeText={(value) => updateFormData('ownerName', value)}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>
                    Phone Number <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={20} color={colors.textMuted} />
                    <TextInput
                        style={styles.input}
                        placeholder="10-digit mobile number"
                        placeholderTextColor={colors.textMuted}
                        value={formData.phone}
                        onChangeText={(value) => updateFormData('phone', value)}
                        keyboardType="phone-pad"
                        maxLength={10}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>
                    Password <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                    <TextInput
                        style={styles.input}
                        placeholder="Create a password"
                        placeholderTextColor={colors.textMuted}
                        value={formData.password}
                        onChangeText={(value) => updateFormData('password', value)}
                        secureTextEntry
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Email (Optional)</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
                    <TextInput
                        style={styles.input}
                        placeholder="your@email.com"
                        placeholderTextColor={colors.textMuted}
                        value={formData.email}
                        onChangeText={(value) => updateFormData('email', value)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>
            </View>
        </Animated.View>
    );

    const renderStep2 = () => (
        <Animated.View
            entering={FadeInRight}
            exiting={FadeOutLeft}
            style={styles.stepContainer}
        >
            <Text style={styles.stepTitle}>Shop Address</Text>
            <Text style={styles.stepSubtitle}>Where is your shop located?</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>
                    Address Line 1 <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="location-outline" size={20} color={colors.textMuted} />
                    <TextInput
                        style={styles.input}
                        placeholder="Shop number, building name"
                        placeholderTextColor={colors.textMuted}
                        value={formData.addressLine1}
                        onChangeText={(value) => updateFormData('addressLine1', value)}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Address Line 2 (Optional)</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="location-outline" size={20} color={colors.textMuted} />
                    <TextInput
                        style={styles.input}
                        placeholder="Street, area"
                        placeholderTextColor={colors.textMuted}
                        value={formData.addressLine2}
                        onChangeText={(value) => updateFormData('addressLine2', value)}
                    />
                </View>
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>
                        City <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="City"
                            placeholderTextColor={colors.textMuted}
                            value={formData.city}
                            onChangeText={(value) => updateFormData('city', value)}
                        />
                    </View>
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>
                        State <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="State"
                            placeholderTextColor={colors.textMuted}
                            value={formData.state}
                            onChangeText={(value) => updateFormData('state', value)}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>
                    Pincode <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="pin-outline" size={20} color={colors.textMuted} />
                    <TextInput
                        style={styles.input}
                        placeholder="6-digit pincode"
                        placeholderTextColor={colors.textMuted}
                        value={formData.pincode}
                        onChangeText={(value) => updateFormData('pincode', value)}
                        keyboardType="number-pad"
                        maxLength={6}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Landmark (Optional)</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="navigate-outline" size={20} color={colors.textMuted} />
                    <TextInput
                        style={styles.input}
                        placeholder="Nearby landmark"
                        placeholderTextColor={colors.textMuted}
                        value={formData.landmark}
                        onChangeText={(value) => updateFormData('landmark', value)}
                    />
                </View>
            </View>
        </Animated.View>
    );

    const renderStep3 = () => (
        <Animated.View
            entering={FadeInRight}
            exiting={FadeOutLeft}
            style={styles.stepContainer}
        >
            <Text style={styles.stepTitle}>Business Category</Text>
            <Text style={styles.stepSubtitle}>What type of business do you run?</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>
                    Select Category <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                    style={[
                        styles.selectButton,
                        isCategoryDropdownOpen && styles.selectButtonActive
                    ]}
                    onPress={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                >
                    <Ionicons name="grid-outline" size={20} color={colors.textMuted} />
                    <Text style={styles.selectText}>
                        {formData.categoryId
                            ? categories.find(c => c.id === formData.categoryId)?.name || 'Grocery'
                            : 'Choose category'}
                    </Text>
                    <Ionicons
                        name={isCategoryDropdownOpen ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={colors.textMuted}
                    />
                </TouchableOpacity>

                {isCategoryDropdownOpen && (
                    <View style={styles.dropdownList}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={[
                                    styles.dropdownItem,
                                    formData.categoryId === category.id && styles.dropdownItemActive
                                ]}
                                onPress={() => {
                                    updateFormData('categoryId', category.id);
                                    setIsCategoryDropdownOpen(false);
                                }}
                            >
                                <Text style={[
                                    styles.dropdownItemText,
                                    formData.categoryId === category.id && styles.dropdownItemTextActive
                                ]}>
                                    {category.name}
                                </Text>
                                {formData.categoryId === category.id && (
                                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <Text style={styles.sectionTitle}>Operational Details</Text>

            <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Opening Time</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                        <TextInput
                            style={styles.input}
                            placeholder="09:00"
                            placeholderTextColor={colors.textMuted}
                            value={formData.openingTime}
                            onChangeText={(value) => updateFormData('openingTime', value)}
                        />
                    </View>
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Closing Time</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                        <TextInput
                            style={styles.input}
                            placeholder="21:00"
                            placeholderTextColor={colors.textMuted}
                            value={formData.closingTime}
                            onChangeText={(value) => updateFormData('closingTime', value)}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Delivery Radius (km)</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="bicycle-outline" size={20} color={colors.textMuted} />
                    <TextInput
                        style={styles.input}
                        placeholder="5"
                        placeholderTextColor={colors.textMuted}
                        value={formData.deliveryRadius.toString()}
                        onChangeText={(value) => updateFormData('deliveryRadius', parseInt(value) || 5)}
                        keyboardType="number-pad"
                    />
                </View>
            </View>
        </Animated.View>
    );

    const renderStep4 = () => (
        <Animated.View
            entering={FadeInRight}
            exiting={FadeOutLeft}
            style={styles.stepContainer}
        >
            <Text style={styles.stepTitle}>Review & Submit</Text>
            <Text style={styles.stepSubtitle}>Please verify your information</Text>

            <GlassCard style={styles.reviewCard}>
                <View style={styles.reviewSection}>
                    <Text style={styles.reviewLabel}>Business Name</Text>
                    <Text style={styles.reviewValue}>{formData.businessName}</Text>
                </View>

                <View style={styles.reviewSection}>
                    <Text style={styles.reviewLabel}>Owner Name</Text>
                    <Text style={styles.reviewValue}>{formData.ownerName}</Text>
                </View>

                <View style={styles.reviewSection}>
                    <Text style={styles.reviewLabel}>Phone</Text>
                    <Text style={styles.reviewValue}>{formData.phone}</Text>
                </View>

                <View style={styles.reviewSection}>
                    <Text style={styles.reviewLabel}>Address</Text>
                    <Text style={styles.reviewValue}>
                        {formData.addressLine1}, {formData.city}, {formData.state} - {formData.pincode}
                    </Text>
                </View>

                <View style={styles.reviewSection}>
                    <Text style={styles.reviewLabel}>Timings</Text>
                    <Text style={styles.reviewValue}>
                        {formData.openingTime} - {formData.closingTime}
                    </Text>
                </View>
            </GlassCard>

            <View style={styles.noteContainer}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={styles.noteText}>
                    After registration, you'll need to complete KYC verification to start selling.
                </Text>
            </View>
        </Animated.View>
    );

    return (
        <SafeView gradient={gradients.background as any}>
            <ImmersiveBackground />
            <GlassHeader
                title={`Step ${currentStep} of 4`}
                showBackButton
                onBackPress={handleBack}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.content}>
                        {renderProgressBar()}

                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <GlassCard style={styles.formCard}>
                                {currentStep === 1 && renderStep1()}
                                {currentStep === 2 && renderStep2()}
                                {currentStep === 3 && renderStep3()}
                                {currentStep === 4 && renderStep4()}
                            </GlassCard>
                        </ScrollView>

                        {/* Navigation Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonPrimary]}
                                onPress={handleNext}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>
                                    {currentStep === 4 ? (loading ? 'Submitting...' : 'Submit') : 'Next'}
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    progressDot: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    progressDotActive: {
        backgroundColor: colors.primary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    formCard: {
        padding: 20,
    },
    stepContainer: {
        gap: 16,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
    },
    stepSubtitle: {
        fontSize: 14,
        color: colors.textMuted,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 8,
    },
    required: {
        color: colors.error,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        gap: 12,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: colors.text,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        gap: 12,
    },
    selectText: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
    },
    reviewCard: {
        padding: 16,
        gap: 16,
    },
    reviewSection: {
        gap: 4,
    },
    reviewLabel: {
        fontSize: 12,
        color: colors.textMuted,
    },
    reviewValue: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    noteContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        marginTop: 16,
    },
    noteText: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
        lineHeight: 20,
    },
    buttonContainer: {
        padding: 20,
        paddingBottom: 30,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        height: 56,
        gap: 8,
    },
    buttonPrimary: {
        backgroundColor: colors.primary,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    selectButtonActive: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
    },
    dropdownList: {
        marginTop: 8,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    dropdownItemActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    dropdownItemText: {
        fontSize: 16,
        color: colors.textMuted,
    },
    dropdownItemTextActive: {
        color: colors.primary,
        fontWeight: '500',
    },
});
