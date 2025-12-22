import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../../src/components/ui/SafeView';
import { useAuth } from '../../../src/contexts/AuthContext';
import { colors } from '../../../src/theme/colors';
import { gradients } from '../../../src/theme/gradients';

export default function AdminRejectedScreen() {
  const { logout } = useAuth();

  return (
    <SafeView gradient={gradients.background as any}>
      <ImmersiveBackground />
      <GlassHeader
        title="Rejected Shops"
        rightElement={
          <TouchableOpacity onPress={() => logout()} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        }
      />
      <View style={styles.container}>
        <Text style={styles.text}>Rejected shops list (Coming soon)</Text>
      </View>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, color: colors.textMuted },
});
