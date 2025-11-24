import { View, Text, StyleSheet } from 'react-native';

export default function TestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ ROUTING WORKS!</Text>
      <Text style={styles.subtext}>GoShop Mobile App</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  subtext: {
    fontSize: 16,
    marginTop: 10,
    color: '#666',
  },
});
