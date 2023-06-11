
// SERVO
#include <ESP32Servo.h>
#include <analogWrite.h>
#include <ESP32Tone.h>
#include <ESP32PWM.h>


// WIFI 
#include <Arduino.h>
#if defined(ESP32)
#include <WiFi.h>
#include <FirebaseESP32.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#elif defined(ARDUINO_RASPBERRY_PI_PICO_W)
#include <WiFi.h>
#include <FirebaseESP8266.h>
#endif


// HELPERS
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>


// REQUIRED VARIABLES
#define WIFI_SSID "0xIPhone"
#define WIFI_PASSWORD "wehaveacitytoburn"

#define API_KEY "AIzaSyA3XPgio-e9jXO8xG7Pef5BBs9CSULI5io"
#define DATABASE_URL "https://servo-feea4-default-rtdb.europe-west1.firebasedatabase.app" //<databaseName>.firebaseio.com or <databaseName>.<region>.firebasedatabase.app

#define USER_EMAIL "admin@admin.com"
#define USER_PASSWORD "admin12345"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long sendDataPrevMillis = 0;
unsigned long count = 0;

Servo myServo;
#define SERVO_PIN 13

// -------------------------------------------------------------------------------------- //

void setup()
{
  myServo.attach(SERVO_PIN);

  Serial.begin(115200);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  Serial.printf("Firebase Client v%s\n\n", FIREBASE_CLIENT_VERSION);

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  /* Assign the callback function for the long running token generation task */
  config.token_status_callback = tokenStatusCallback; // see addons/TokenHelper.h

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Firebase.setDoubleDigits(5);
}

void loop()
{

  // Firebase.ready() should be called repeatedly to handle authentication tasks.

  if (Firebase.ready() && (millis() - sendDataPrevMillis > 1500 || sendDataPrevMillis == 0))
  {
    sendDataPrevMillis = millis();

    int readValue = fbdo.intData();

    if (Firebase.getInt(fbdo, "/servo_value")) {

      if (fbdo.dataTypeEnum() == fb_esp_rtdb_data_type_integer) {
      Serial.println();
      myServo.write(fbdo.to<int>());
    }

  } else {
    Serial.println(fbdo.errorReason());
  }

    Serial.println();
    count++;
  }
}

