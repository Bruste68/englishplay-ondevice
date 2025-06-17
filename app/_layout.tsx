// app/_layout.tsx
import { View, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useCallback, useState } from 'react';
import { PersistentChatHistoryProvider } from '../context/PersistentChatHistoryContext';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [ThemeProvider, setThemeProvider] = useState<React.ComponentType<any> | null>(null);
  const [themeValue, setThemeValue] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const {
        ThemeProvider: ImportedThemeProvider,
        DarkTheme,
        DefaultTheme,
      } = await import('@react-navigation/native');

      setThemeProvider(() => ImportedThemeProvider);
      setThemeValue(colorScheme === 'dark' ? DarkTheme : DefaultTheme);
    })();
  }, [colorScheme]);

  if (!ThemeProvider || !themeValue) return null;

  return (
    <ThemeProvider value={themeValue}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="language" />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="screens/TopicSelectScreen" />
        <Stack.Screen name="ChatScreen" />
        <Stack.Screen name="freechat" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  const onLayoutRootView = useCallback(async () => {
    if (loaded) {
      await SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <PersistentChatHistoryProvider>
        <RootLayoutNav />
      </PersistentChatHistoryProvider>
    </View>
  );
}
