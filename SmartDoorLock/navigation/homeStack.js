import React from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from "../Screens/HomeScreen";

const Stack = createNativeStackNavigator();

export default function HomeStack() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    cardStyle: {
                        backgroundColor: '#0e1529'
                    },
                    headerShown: false
                }}>
                <Stack.Screen name="Home" component={HomeScreen} />
                
            </Stack.Navigator>
        </NavigationContainer>
    );
}