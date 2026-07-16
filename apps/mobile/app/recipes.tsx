import { Redirect, router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Screen } from '@/components/Screen';
import { useRecipes } from '@/data/recipes';
import { useTranslations } from '@/i18n/LocaleProvider';
import { useTheme } from '@/theme/ThemeProvider';

/** §03 tarif listesi — MVP-06. */
export default function RecipesScreen() {
  const theme = useTheme();
  const t = useTranslations();
  const { isAuthenticated, isRestoring } = useAuth();

  const recipes = useRecipes();

  if (isRestoring) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background.default }]}>
        <ActivityIndicator color={theme.colors.brand.text} />
      </View>
    );
  }
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Screen edges={{ top: true, bottom: true }}>
      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          style={[theme.typography.heading, { color: theme.colors.text.primary }]}
        >
          {t.recipes.title}
        </Text>
        <Pressable
          onPress={() => router.push('/recipe-builder')}
          accessibilityRole="button"
          accessibilityLabel={t.recipes.newRecipe}
          style={({ pressed }) => [
            styles.newButton,
            {
              minHeight: theme.minTouchTarget,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.radius.md,
              backgroundColor: pressed ? theme.colors.brand.pressed : theme.colors.brand.default,
            },
          ]}
        >
          <Text style={[theme.typography.label, { color: theme.colors.brand.onBrand }]}>
            + {t.recipes.newRecipe}
          </Text>
        </Pressable>
      </View>

      {recipes.isPending && (
        <ActivityIndicator color={theme.colors.brand.text} style={{ marginTop: theme.spacing.xl }} />
      )}

      {recipes.data !== undefined && recipes.data.length === 0 && (
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.text.tertiary, marginTop: theme.spacing.xl, textAlign: 'center' },
          ]}
        >
          {t.recipes.empty}
        </Text>
      )}

      <FlatList
        data={recipes.data ?? []}
        keyExtractor={(item) => item.recipe_id}
        style={{ marginTop: theme.spacing.lg }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/recipe-builder', params: { recipeId: item.recipe_id } })}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            style={({ pressed }) => [
              styles.row,
              {
                minHeight: theme.minTouchTarget,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.sm,
                backgroundColor: pressed ? theme.colors.surface.pressed : theme.colors.surface.default,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.colors.border.default,
              },
            ]}
          >
            <Text style={[theme.typography.body, { color: theme.colors.text.primary }]}>
              {item.name}
            </Text>
            <Text style={[theme.typography.numericSm, { color: theme.colors.text.secondary }]}>
              {item.per_serving_energy_kcal === null ? '—' : Math.round(item.per_serving_energy_kcal)} kcal{' '}
              {t.recipes.perServing}
            </Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  newButton: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
