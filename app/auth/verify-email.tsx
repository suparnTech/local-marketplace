// app/auth/verify-email.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeView } from '../../src/components/ui/SafeView';
import { colors } from '../../src/theme/colors';

export default function VerifyEmailScreen() {
    return (
        <SafeView>
            <View style={styles.container}>
                <Text style={styles.text}>Verify Email</Text>
            </View>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: colors.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
});
