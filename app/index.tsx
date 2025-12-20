// app/index.tsx - Always show welcome/splash first
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/contexts/AuthContext";
import { colors } from "../src/theme/colors";

export default function Index() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Always show welcome screen (handles routing internally)
    return <Redirect href="/welcome" />;
}
