import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../Screens/LoginScreen';
import RegisterScreen from '../Screens/RegisterScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    cardStyle: {
                        backgroundColor: '#0e1529'
                    },
                    headerShown: false
                }}>
                <Stack.Screen name="Sign In" component={LoginScreen} />
                <Stack.Screen name="Sign Up" component={RegisterScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}