import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PasswordInput(props: TextInputProps) {
  const [show, setShow] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextInput
        placeholderTextColor="#999"
        {...props}
        secureTextEntry={!show}
        style={[styles.input, props.style]}
      />
      <Pressable style={styles.eye} hitSlop={10} onPress={() => setShow((s) => !s)}>
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={22} color="#666" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    paddingRight: 48,
    fontSize: 16,
  },
  eye: { position: 'absolute', right: 12 },
});
