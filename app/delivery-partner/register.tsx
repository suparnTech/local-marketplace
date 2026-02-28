// Delivery Partner Registration - Complete with Document Upload
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { api } from '../../src/lib/api';

export default function DeliveryPartnerRegister() {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [step, setStep] = useState(1);

    // Step 1: Personal
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');

    // Step 2: Address
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');

    // Step 3: KYC Numbers
    const [aadhaarNumber, setAadhaarNumber] = useState('');
    const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('');
    const [panNumber, setPanNumber] = useState('');

    // Step 4: Vehicle
    const [vehicleType, setVehicleType] = useState('bike');
    const [vehicleNumber, setVehicleNumber] = useState('');

    // Step 5: Bank
    const [bankAccount, setBankAccount] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [upiId, setUpiId] = useState('');

    // Step 6: Document Photos
    const [aadhaarFront, setAadhaarFront] = useState<string | null>(null);
    const [aadhaarBack, setAadhaarBack] = useState<string | null>(null);
    const [drivingLicense, setDrivingLicense] = useState<string | null>(null);
    const [vehicleRC, setVehicleRC] = useState<string | null>(null);

    const pickImage = async (setter: (uri: string) => void) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to photos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setter(result.assets[0].uri);
        }
    };

    const uploadImage = async (uri: string): Promise<string> => {
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'document.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('file', {
            uri,
            name: filename,
            type,
        } as any);

        const response = await api.post('/api/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data.url;
    };

    const handleNext = () => {
        if (step < 6) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        // Validate required documents
        if (!aadhaarFront || !aadhaarBack || !drivingLicense) {
            Alert.alert('Missing Documents', 'Please upload Aadhaar (front & back) and Driving License');
            return;
        }

        setLoading(true);
        setUploading(true);

        try {
            // Upload all documents
            const [aadhaarFrontUrl, aadhaarBackUrl, dlUrl, rcUrl] = await Promise.all([
                uploadImage(aadhaarFront),
                uploadImage(aadhaarBack),
                uploadImage(drivingLicense),
                vehicleRC ? uploadImage(vehicleRC) : Promise.resolve(null),
            ]);

            // Submit registration
            const response = await api.post('/api/delivery-partner/register', {
                full_name: fullName,
                phone,
                email,
                password,
                date_of_birth: dateOfBirth,
                address_line1: addressLine1,
                address_line2: addressLine2,
                city,
                state,
                pincode,
                aadhaar_number: aadhaarNumber,
                aadhaar_front_url: aadhaarFrontUrl,
                aadhaar_back_url: aadhaarBackUrl,
                driving_license_number: drivingLicenseNumber,
                driving_license_url: dlUrl,
                pan_number: panNumber,
                vehicle_type: vehicleType,
                vehicle_number: vehicleNumber,
                vehicle_rc_url: rcUrl,
                bank_account_number: bankAccount,
                ifsc_code: ifsc,
                upi_id: upiId,
            });

            // Save auth token and user data
            const { token, user } = response.data;
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));

            // Navigate to pending verification screen
            router.replace('/delivery-partner/pending-verification');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Delivery Partner Registration</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {/* Progress */}
                <View style={styles.progress}>
                    {[1, 2, 3, 4, 5, 6].map((s) => (
                        <View key={s} style={[styles.dot, s <= step && styles.dotActive]} />
                    ))}
                </View>

                {/* STEP 1 - PERSONAL */}
                {step === 1 && (
                    <View style={styles.form}>
                        <Text style={styles.title}>📝 Personal Information</Text>

                        <Text style={styles.label}>Full Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Enter your full name"
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.label}>Phone Number *</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="10-digit mobile"
                            keyboardType="phone-pad"
                            maxLength={10}
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.label}>Email *</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="your@email.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.label}>Password *</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Min 6 characters"
                            secureTextEntry
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.label}>Date of Birth *</Text>
                        <TextInput
                            style={styles.input}
                            value={dateOfBirth}
                            onChangeText={setDateOfBirth}
                            placeholder="DD/MM/YYYY"
                            placeholderTextColor="#999"
                        />
                    </View>
                )}

                {/* STEP 2 - ADDRESS */}
                {step === 2 && (
                    <View style={styles.form}>
                        <Text style={styles.title}>📍 Address Details</Text>

                        <Text style={styles.label}>Address Line 1 *</Text>
                        <TextInput
                            style={styles.input}
                            value={addressLine1}
                            onChangeText={setAddressLine1}
                            placeholder="House no, Street"
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.label}>Address Line 2 (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={addressLine2}
                            onChangeText={setAddressLine2}
                            placeholder="Landmark, Area"
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.label}>City *</Text>
                        <TextInput
                            style={styles.input}
                            value={city}
                            onChangeText={setCity}
                            placeholder="City"
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.label}>State *</Text>
                        <TextInput
                            style={styles.input}
                            value={state}
                            onChangeText={setState}
                            placeholder="State"
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.label}>Pincode *</Text>
                        <TextInput
                            style={styles.input}
                            value={pincode}
                            onChangeText={setPincode}
                            placeholder="6-digit"
                            keyboardType="number-pad"
                            maxLength={6}
                            placeholderTextColor="#999"
                        />
                    </View>
                )}

                {/* STEP 3 - KYC NUMBERS */}
                {step === 3 && (
                    <View style={styles.form}>
                        <Text style={styles.title}>🔐 KYC Documents</Text>
                        <Text style={styles.subtitle}>Enter document numbers</Text>

                        <Text style={styles.label}>Aadhaar Number *</Text>
                        <TextInput
                            style={styles.input}
                            value={aadhaarNumber}
                            onChangeText={setAadhaarNumber}
                            placeholder="1234 5678 9012"
                            keyboardType="number-pad"
                            maxLength={12}
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.label}>Driving License Number *</Text>
                        <TextInput
                            style={styles.input}
                            value={drivingLicenseNumber}
                            onChangeText={setDrivingLicenseNumber}
                            placeholder="UK14 20190012345"
                            autoCapitalize="characters"
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.label}>PAN Number (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={panNumber}
                            onChangeText={setPanNumber}
                            placeholder="ABCDE1234F"
                            autoCapitalize="characters"
                            maxLength={10}
                            placeholderTextColor="#999"
                        />
                    </View>
                )}

                {/* STEP 4 - VEHICLE */}
                {step === 4 && (
                    <View style={styles.form}>
                        <Text style={styles.title}>🏍️ Vehicle Information</Text>

                        <Text style={styles.label}>Vehicle Type *</Text>
                        <View style={styles.vehicleRow}>
                            {['bike', 'scooter', 'bicycle'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.vehicleBtn, vehicleType === type && styles.vehicleBtnActive]}
                                    onPress={() => setVehicleType(type)}
                                >
                                    <Text style={styles.vehicleText}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Vehicle Number *</Text>
                        <TextInput
                            style={styles.input}
                            value={vehicleNumber}
                            onChangeText={setVehicleNumber}
                            placeholder="UK14AB1234"
                            autoCapitalize="characters"
                            placeholderTextColor="#999"
                        />
                    </View>
                )}

                {/* STEP 5 - BANK */}
                {step === 5 && (
                    <View style={styles.form}>
                        <Text style={styles.title}>💳 Bank Details</Text>

                        <Text style={styles.label}>Bank Account Number *</Text>
                        <TextInput
                            style={styles.input}
                            value={bankAccount}
                            onChangeText={setBankAccount}
                            placeholder="Account number"
                            keyboardType="number-pad"
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.label}>IFSC Code *</Text>
                        <TextInput
                            style={styles.input}
                            value={ifsc}
                            onChangeText={setIfsc}
                            placeholder="SBIN0001234"
                            autoCapitalize="characters"
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.label}>UPI ID (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={upiId}
                            onChangeText={setUpiId}
                            placeholder="yourname@upi"
                            autoCapitalize="none"
                            placeholderTextColor="#999"
                        />
                    </View>
                )}

                {/* STEP 6 - DOCUMENT PHOTOS */}
                {step === 6 && (
                    <View style={styles.form}>
                        <Text style={styles.title}>📸 Upload Documents</Text>
                        <Text style={styles.subtitle}>Clear photos required for verification</Text>

                        {/* Aadhaar Front */}
                        <Text style={styles.label}>Aadhaar Card (Front) *</Text>
                        <TouchableOpacity
                            style={styles.uploadBtn}
                            onPress={() => pickImage(setAadhaarFront)}
                        >
                            {aadhaarFront ? (
                                <Image source={{ uri: aadhaarFront }} style={styles.preview} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="camera" size={32} color="#10b981" />
                                    <Text style={styles.uploadText}>Tap to upload</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Aadhaar Back */}
                        <Text style={styles.label}>Aadhaar Card (Back) *</Text>
                        <TouchableOpacity
                            style={styles.uploadBtn}
                            onPress={() => pickImage(setAadhaarBack)}
                        >
                            {aadhaarBack ? (
                                <Image source={{ uri: aadhaarBack }} style={styles.preview} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="camera" size={32} color="#10b981" />
                                    <Text style={styles.uploadText}>Tap to upload</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Driving License */}
                        <Text style={styles.label}>Driving License *</Text>
                        <TouchableOpacity
                            style={styles.uploadBtn}
                            onPress={() => pickImage(setDrivingLicense)}
                        >
                            {drivingLicense ? (
                                <Image source={{ uri: drivingLicense }} style={styles.preview} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="camera" size={32} color="#10b981" />
                                    <Text style={styles.uploadText}>Tap to upload</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Vehicle RC (Optional) */}
                        <Text style={styles.label}>Vehicle RC (Optional)</Text>
                        <TouchableOpacity
                            style={styles.uploadBtn}
                            onPress={() => pickImage(setVehicleRC!)}
                        >
                            {vehicleRC ? (
                                <Image source={{ uri: vehicleRC }} style={styles.preview} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="camera" size={32} color="#999" />
                                    <Text style={styles.uploadText}>Tap to upload</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {uploading && (
                            <View style={styles.uploadingBox}>
                                <ActivityIndicator color="#10b981" />
                                <Text style={styles.uploadingText}>Uploading documents...</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* BUTTONS */}
                <View style={styles.buttons}>
                    {step > 1 && (
                        <TouchableOpacity
                            style={[styles.btn, styles.btnSecondary]}
                            onPress={() => setStep(step - 1)}
                        >
                            <Text style={styles.btnTextSecondary}>Back</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.btn, styles.btnPrimary, step === 1 && styles.btnFull]}
                        onPress={handleNext}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.btnText}>
                                {step === 6 ? 'Submit for Verification' : 'Next'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0f0a' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(16, 185, 129, 0.2)',
    },
    backButton: { padding: 8, marginRight: 12 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    scrollView: { flex: 1 },
    content: { padding: 20, paddingBottom: 100 },
    progress: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 30 },
    dot: { width: 28, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
    dotActive: { backgroundColor: '#10b981' },
    form: {
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#999', marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8, marginTop: 12 },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        marginBottom: 8,
    },
    vehicleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    vehicleBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2,
        borderColor: 'transparent',
        alignItems: 'center',
    },
    vehicleBtnActive: { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.2)' },
    vehicleText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    uploadBtn: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        borderStyle: 'dashed',
        marginBottom: 16,
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadText: { fontSize: 14, color: '#999', marginTop: 8 },
    preview: { width: '100%', height: 200, resizeMode: 'cover' },
    uploadingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderRadius: 12,
        marginTop: 16,
    },
    uploadingText: { fontSize: 14, color: '#fff' },
    buttons: { flexDirection: 'row', gap: 12, marginTop: 24 },
    btn: { flex: 1, padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    btnFull: { flex: 1 },
    btnPrimary: { backgroundColor: '#10b981' },
    btnSecondary: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    btnTextSecondary: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
