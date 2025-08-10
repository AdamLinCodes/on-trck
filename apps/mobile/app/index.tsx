import { View, Text, Button } from 'react-native';
import dayjs from 'dayjs';
import { useAppStore } from '../lib/store/useStore';

export default function HomeScreen() {
  const selectedDate = useAppStore(s => s.selectedDate);
  const setSelectedDate = useAppStore(s => s.setSelectedDate);
  const checkInHabit = useAppStore(s => s.checkInHabit);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Home</Text>
      <Text>Selected date: {dayjs(selectedDate).format('YYYY-MM-DD')}</Text>
      <Button title="Today" onPress={() => setSelectedDate(dayjs().toISOString())} />
      <Button title="Check-in demo habit" onPress={() => checkInHabit('demo-habit-id')} />
    </View>
  );
}