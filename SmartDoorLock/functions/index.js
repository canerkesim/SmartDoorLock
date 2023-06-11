/* eslint-disable */
const functions = require("firebase-functions");

const admin = require('firebase-admin');
admin.initializeApp();

exports.setUserRole = functions.https.onCall(async (data, context) => {
    if (context.auth.token.admin !== true) {
        return { error: "Not allowed. Only admins can update user roles." };
    }

    try {
        const user = await admin.auth().getUserByEmail(data.email);
        await admin.auth().setCustomUserClaims(user.uid, { role: data.role });
        return { message: `Successfully updated role to "${data.role}" for user: ${data.email}` };
    } catch (error) {
        return { error: error.message };
    }
});

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
