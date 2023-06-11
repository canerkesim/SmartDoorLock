import React from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

import { useState, useEffect } from 'react';

import { auth } from "../../firebase"

export function useAuthentication() {
    const [user, setUser] = useState();

    useEffect(() => {
        const unsubscribeFromAuthStateChanged = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in, see docs for a list of available properties
                // https://firebase.google.com/docs/reference/js/firebase.User
                setUser(user);
            } else {
                // User is signed out
                setUser(undefined);
            }
        });

        return unsubscribeFromAuthStateChanged;
    }, []);

    return {
        user
    };
}