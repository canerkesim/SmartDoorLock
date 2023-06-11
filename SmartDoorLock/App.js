import { Button, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, push, set, onValue, update, remove } from "firebase/database";

// ------------------------------------------------------------------------------- //

const Stack = createNativeStackNavigator();

const firebaseConfig = {
  apiKey: "AIzaSyA3XPgio-e9jXO8xG7Pef5BBs9CSULI5io",
  authDomain: "servo-feea4.firebaseapp.com",
  databaseURL:
    "https://servo-feea4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "servo-feea4",
  storageBucket: "servo-feea4.appspot.com",
  messagingSenderId: "1050597292265",
  appId: "1:1050597292265:web:788226471df7aed42a1878",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase();


// ------------------------------------------------------------------------------- //

function useAuthentication() {
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

function firebaseGetUserData(userUid) {
  const userRef = ref(db, 'users/' + userUid);
  return new Promise((resolve, reject) => {
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function firebaseSetUserData(userUid, email) {
  const userRef = ref(db, 'users/' + userUid, email);

  set(userRef, {
    uid: userUid,
    isAdmin: false,
    isAuth: false,
    expirationDate: null,
    createdTokens: null,
    usedTokens: null,
    email: email
  })
}

function firebasePushUserData(userUid, body, route) {
  const userRef = ref(db, 'users/' + userUid + "/" + route);
  set(userRef, body)
}

function firebaseUpdateUserData(userUid, body) {
  const userRef = ref(db, 'users/' + userUid)
  update(userRef, body)
}

function firebaseGetTokenData(tokenId) {
  const tokenRef = ref(db, 'tokens/' + tokenId);
  return new Promise((resolve, reject) => {
    onValue(tokenRef, (snapshot) => {
      const data = snapshot.val();
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function firebaseUpdateTokenData(tokenId, deauthorize) {
  const tokenRef = ref(db, 'tokens/' + tokenId);

  let user = auth.currentUser.uid;
  let used = true
  if (deauthorize) {
    user = null;
    used = false
  }

  update(tokenRef, {
    used: used,
    user: user,
    expirationDate: Date.now() + 7200,
  })
}

function firebaseDeleteTokenData(userUid, tokenId) {
  console.log("userTokenRef");
  const tokenRef = ref(db, 'tokens/' + tokenId);
  const userTokenRef = ref(db, 'users/' + userUid + "/createdTokens/" + tokenId);
  console.log(userTokenRef);

  remove(userTokenRef)
  remove(tokenRef)
}

function firebasePushToken(body) {
  const userRef = ref(db, 'tokens/' + body.id);
  set(userRef, body)
}

function firebaseGetLocks(userUid) {
  const userRef = ref(db, 'users/' + userUid + "/usedTokens");
  return new Promise((resolve, reject) => {
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      resolve(data);
    }, (error) => {
      reject(error);
    });
  });
}

function firebaseGetServo() {
  return new Promise((resolve, reject) => {
    onValue(ref(db, "/"), (snapshot) => {
      resolve(snapshot.val());
    }, (error) => {
      reject(error);
    });
  });
}

async function checkAuth(userUid) {
  let user = await firebaseGetUserData(userUid);
  let tokenId = user.usedTokens[Object.keys(user.usedTokens)[0]].tokenId

  let expiracy = await firebaseGetTokenData(tokenId)
  expiracy = expiracy.expirationDate

  let today = new Date().getTime();
  if (expiracy < today) {
    deauthorize(userUid)
    return false
  } else { return expiracy }
}

async function deauthorize(userUid, tokenId) {
  let body = {
    isAuth: false,
    usedTokens: ""
  }

  firebaseUpdateUserData(userUid, body);
  firebaseUpdateTokenData(tokenId, true)
}


// ------------------------------------------------------------------------------- //

function HomeScreen({ navigation }) {

  const [modal1Visible, setModal1Visible] = useState(false);
  const [modal2Visible, setModal2Visible] = useState(false);
  const [token, setToken] = useState("");
  const [tokenName, setTokenName] = useState("")
  const [lockState, setLockState] = useState(null);
  const [error, setError] = useState("");
  const [isAuth, setIsAuth] = useState();
  const [isAdmin, setIsAdmin] = useState();


  useEffect(() => {
    getAuth();
  }, []);

  // ---- //

  async function handleNewToken() {
    let tokenData = await firebaseGetTokenData(token);

    if (!tokenData) {
      setError("invalid token")
      return
    }
    if (tokenData.used) {
      setError("already used")
      return
    }

    firebaseUpdateTokenData(tokenData.id)
    firebasePushUserData(auth.currentUser.uid, {
      tokenId: tokenData.id,
      name: tokenName
    }, "usedTokens/" + tokenData.id)
    firebaseUpdateUserData(auth.currentUser.uid, {
      isAuth: true
    })
    getAuth();
    navigation.navigate("Home");
    setModal1Visible(false)
  }

  // ---- //

  async function getAuth() {
    let user = await firebaseGetUserData(auth.currentUser.uid);

    setIsAuth(user.isAuth);
    setIsAdmin(user.isAdmin);
    checkAuth(user.uid);
  }

  // ---- //

  async function getServo() {
    const servo = await firebaseGetServo()
    setLockState(servo.servo_locked)
  }
  async function unlockServo() {
    const userRef = ref(db, '/');

    update(userRef, {
      servo_locked: false,
      servo_value: 0
    })

    setLockState(false);
  }
  async function lockServo() {
    const userRef = ref(db, '/');

    update(userRef, {
      servo_locked: true,
      servo_value: 180
    })

    setLockState(true);
  }
  async function generateToken() {
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let result = '';
    const charactersLength = characters.length;
    const length = 16;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    let bodyToken = {
      id: result,
      used: false,
      user: "",
      userUid: "",
      expirationDate: "",
    }

    let bodyUser = result
    firebasePushUserData(auth.currentUser.uid, bodyUser, "createdTokens/" + result);
    firebasePushToken(bodyToken);
    setModal2Visible(false);
    navigation.navigate("Tokens");
  }

  // ---- //

  function handleLockClick() {
    getServo();
    setModal2Visible(true);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Locks</Text>

      {isAuth && (
        <TouchableOpacity onPress={() => { handleLockClick() }}>
          <View style={styles.lockDiv} >
            <Text style={{ fontSize: "30" }}>My Lock</Text>
          </View>
        </TouchableOpacity>
      )}

      <Button title="+" onPress={() => setModal1Visible(true)} disabled={isAuth}></Button>

      {/* ADD LOCK */}
      <Modal
        visible={modal1Visible}
        onRequestClose={() => {
          setModal1Visible(!modal1Visible);
        }}>

        <View style={modalStyles.container}>

          {/* NAVBAR */}
          <View style={modalStyles.navbar}>
            <Button title='back' onPress={() => setModal1Visible(false)}></Button>
          </View>

          {/* FORM */}
          <View style={styles.tokensContainer}>
            <Text style={styles.header}>Add New Token</Text>
            <TextInput style={styles.input4} placeholder='Token' onChangeText={setToken}></TextInput>
            <Button title="Submit" onPress={handleNewToken}></Button>
            {error && (
              <Text style={{ color: 'red', fontSize: 16, marginBottom: 20 }}>
                Error: {error}
              </Text>
            )}
          </View>

          {/* EMPTY */}
          <View>
          </View>
        </View>
      </Modal>

      {/* INSIDE LOCK */}
      <Modal
        visible={modal2Visible}
        onRequestClose={() => {
          Alert.alert('Modal has been closed.');
          setModal2Visible(!modal2Visible);
        }}>
        <View style={modalStyles.container}>
          <View style={modalStyles.navbar}>
            <Button title='back' onPress={() => setModal2Visible(false)}></Button>
          </View>

          <View style={modalStyles.middleContents}>
            <Text style={styles.header}>My Lock</Text>

            {lockState !== null && lockState ? (
              <Text style={{}}>System is locked</Text>
            ) : (
              lockState !== null && <Text style={{}}>System is unlocked</Text>
            )}
            <View style={modalStyles.lockButtonsContainer}>
              <Button title='Lock' onPress={() => lockServo()}></Button>
              <Button title='Unlock' onPress={() => unlockServo()}></Button>
            </View>
            <Button title='Generate Token' disabled={!isAdmin} onPress={() => generateToken()}></Button>
            <Button title="Generated Tokens" disabled={!isAdmin} onPress={() => { setModal2Visible(false); navigation.navigate("Tokens") }}></Button>
          </View>

          <View>

          </View>
        </View>
      </Modal>

    </View>
  );
}

function TokensScreen({ navigation }) {
  const [userTokens, setUserTokens] = useState([]);
  const [tokenData, setTokenData] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    fetchTokenData();
  }, [userTokens]);

  async function loadUserData() {
    const user = await firebaseGetUserData(auth.currentUser.uid);
    setUserTokens(Object.keys(user.createdTokens));
  }

  async function fetchTokenData() {
    if (userTokens.length > 0) {
      const fetchedData = await Promise.all(userTokens.map(async (tokenId) => {
        const tokenInfo = await firebaseGetTokenData(tokenId);
        let userInfo = '';
        let userMail = '';

        if (tokenInfo) {
          if (tokenInfo.user) {
            userInfo = await firebaseGetUserData(tokenInfo.user);
            userMail = userInfo[Object.keys(userInfo)[0]]
          }

          return {
            tokenId: tokenId,
            used: tokenInfo.used,
            userMail: userMail
          };
        } else {
          return {
            tokenId: tokenId,
            used: false,
            userMail: userMail
          };
        }
      }));
      setTokenData(fetchedData);
    }
  }

  function disableToken(tokenId, userUid) {
    console.log(tokenId);
    deauthorize(userUid, tokenId);
    loadUserData();
  }

  function deleteToken(tokenId, userUid) {
    console.log(tokenId);
    deauthorize(userUid, tokenId);
    firebaseDeleteTokenData(auth.currentUser.uid, tokenId);
    loadUserData();
  }

  function copyToClipboard(textToCopy) {
    Clipboard.setString(textToCopy);
    Alert.alert('Text copied to clipboard');
  };

  function renderTokenInterface(data) {
    return (
      <View style={styles.tokenContainer}>
        <TouchableOpacity onPress={() => { copyToClipboard(data.tokenId) }}>
          <Text>{data.tokenId}</Text>
          <Text>used: {JSON.stringify(data.used)}</Text>
          <Text>user: {data.userMail}</Text>
        </TouchableOpacity>
        <Button title="disable" value="tokenId" disabled={!data.used} onPress={() => disableToken(data.tokenId, data.user)} />
        <Button title="delete token" value="tokenId" onPress={() => deleteToken(data.tokenId, data.user)} />

      </View>
    );
  }

  return (
    <View style={modalStyles.container}>
      <View style={modalStyles.navbar}>
        <Button title='back' onPress={() => navigation.navigate("Home")}></Button>
      </View>

      <View style={styles.tokensContainer}>
        {tokenData.map((data) => renderTokenInterface(data))}
      </View>

      <View>
      </View>
    </View>


  );
}

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState()
  const [password, setPassword] = useState()

  function handle() {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in 
        user = userCredential.user;

        navigation.navigate('Home')
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ..
      });

  }

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <Text style={styles.header}>Please Sign In</Text>

        <View style={styles.inputContainer}>
          <TextInput style={styles.input1} placeholder='Email address' onChangeText={setEmail}></TextInput>
          <TextInput style={styles.input2} placeholder='Password' onChangeText={setPassword} secureTextEntry></TextInput>
        </View>

        <Button style={styles.submit} title='Submit' onPress={() => handle()} ></Button>
        <Button style={styles.submit} title='or register' onPress={() => navigation.navigate('Register')}></Button>
      </View>
    </View>
  );

}

function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [passwordConf, setPasswordConf] = useState();
  const [error, setError] = useState();

  let user;

  function handle() {
    if (password != passwordConf) {
      setError("Passwords do not match")
      return
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in 
        user = userCredential.user;

        firebaseSetUserData(user.uid, email);
        navigation.navigate('Home')
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ..
      });
  }

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <Text style={styles.header}>Please Register</Text>

        <View style={styles.inputContainer}>
          <TextInput style={styles.input1} placeholder='Email address' onChangeText={setEmail}></TextInput>
          <TextInput style={styles.input3} placeholder='Password' onChangeText={setPassword} secureTextEntry></TextInput>
          <TextInput style={styles.input2} placeholder='Password again' onChangeText={setPasswordConf} secureTextEntry></TextInput>
        </View>

        <Button style={styles.submit} title='Submit' onPress={handle}></Button>
        <Button title='or sign in' onPress={() => navigation.navigate('Login')}></Button>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    </View>
  );
}


// ------------------------------------------------------------------------------- //

export default function App() {

  const { user } = useAuthentication();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          cardStyle: {
            backgroundColor: '#0e1529'
          },
          headerShown: false
        }}>

        <Stack.Screen name="Login">
          {(props) => <LoginScreen {...props} />}
        </Stack.Screen>
        <Stack.Screen name="Register">
          {(props) => <RegisterScreen {...props} />}
        </Stack.Screen>
        <Stack.Screen name="Home">
          {(props) => <HomeScreen {...props} />}
        </Stack.Screen>
        <Stack.Screen name="Tokens">
          {(props) => <TokensScreen {...props} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {

  },
  input1: {
    width: 300,
    height: 50,
    borderWidth: 1,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    padding: 10
  },
  input2: {
    width: 300,
    height: 50,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    padding: 10
  },
  input3: {
    width: 300,
    height: 50,
    borderWidth: 1,
    borderTopWidth: 0,
    padding: 10
  },
  input4: {
    width: 300,
    height: 50,
    borderWidth: 1,
    borderRadius: 7,
    padding: 10
  },
  header: {
    fontSize: 30,
    marginBottom: 30
  },
  submit: {
    marginTop: 15,
    borderWidth: 1
  },
  addToken: {
    fontSize: 30
  },
  lockDiv: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignContent: "center",
    borderWidth: 2,
    padding: 10,
    borderRadius: 7
  },
  tokenContainer: {
    width: 300,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingTop: 20,
    paddingBottom: 20
  },
  tokensContainer: {
    alignItems: "center",
  }
});

const modalStyles = StyleSheet.create({
  navbar: {
    //backgroundColor:"whitesmoke", 
    paddingTop: "10%",
    display: "flex",
    alignItems: "flex-start"
  },
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    justifyContent: "space-between",
  },
  middleContents: {
    alignContent: "center",
    alignItems: "center"
  },
  lockButtonsContainer: {
    display: "flex",
    flexDirection: "row",
    marginTop: 5,
    marginBottom: 20
  }
})
