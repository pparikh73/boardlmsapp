import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { BRAND } from '../constants/skilljar';

interface LoginButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  style?: ViewStyle;
}

export default function LoginButton({ label, onPress, loading = false, variant = 'primary', style }: LoginButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? BRAND.white : BRAND.primary} />
      ) : (
        <Text style={[styles.label, variant !== 'primary' && styles.labelDark]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primary: {
    backgroundColor: BRAND.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: BRAND.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.white,
    letterSpacing: 0.2,
  },
  labelDark: {
    color: BRAND.primary,
  },
});
