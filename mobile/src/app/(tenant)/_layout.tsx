import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { shadow } from '@/constants/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

const icon = (name: IoniconName, focused: boolean): IoniconName =>
  focused ? name : (`${name}-outline` as IoniconName);

export default function TenantLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: '#9a9a8f',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: Platform.OS === 'ios' ? 0 : 6 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 86 : 66,
          paddingTop: 8,
          ...shadow.float,
        },
        tabBarItemStyle: { paddingTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={icon('home', focused)} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Tìm phòng',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={icon('search', focused)} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={icon('person', focused)} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
