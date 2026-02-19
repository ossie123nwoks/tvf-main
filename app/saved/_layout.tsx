import { Stack } from 'expo-router';

export default function SavedLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        presentation: 'card',
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen 
        name="sermons" 
        options={{
          title: 'Saved Sermons',
        }}
      />
      <Stack.Screen 
        name="articles"
        options={{
          title: 'Saved Articles',
        }}
      />
    </Stack>
  );
}

