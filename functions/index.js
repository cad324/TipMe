// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp(functions.config().firebase);

const stripe = require('stripe')(functions.config().stripe.testkey)

var db = admin.database(); 

exports.stripeCharge = functions.database.ref('/{userID}/tip_amount').onUpdate((change, context) => {
	
    const amountTip = change.after.val();
    const userId = context.params.userID;
	var source_ref = db.ref("/"+userId+"/source/");
	var idemp_key_ref = db.ref("/"+userId+"/idempotency_key/");
	var idemp_key = "";
	var customer_source; var customer_obj;
	
	source_ref.on("value", function(snapshot) {
		customer_source = snapshot.val();
		console.log("retrieved: " + customer_source);
		if (snapshot.val() === null) {
			console.error("Source not retrieved!");
			return;
		}
		tokenId = snapshot.val();
	}, function(errorObject) {
		console.log("The read failed: " + errorObject);
	});
	
	idemp_key_ref.on("value", function(snapshot) {
		idemp_key = snapshot.val();
		console.log("idemp key created " + idemp_key);
		if (snapshot.val() === null) {
			console.error("key not created!");
			return;
		}
		tokenId = snapshot.val();
	}, function(errorObject) {
		console.log("The read failed: " + errorObject);
	});
	
	const currency = 'usd';
    
    return admin.database().ref(`/${userId}`).once('value').then(snapshot => {
        return snapshot.val();
    }).then(customers => {
		//Create a Customer:
		customer_obj = stripe.customers.create({
			source: customer_source,
		}, function(err, customer_obj) {
			//async call
			console.log("customer "+customer_obj+" error "+err);
		});
		return;	
    }).then(tip_amount => {
		console.log("Customer is: "+customer_obj);
		console.log("Customer id is"+customer_obj.id);
		const charge = stripe.charges.create({
			amount: amountTip,
			currency: 'usd',
			customer: customer_obj,
			source: customer_source,
		}, idemp_key);
        admin.database().ref(`/${userId}/charge`).set("$"+amountTip/100);
		console.log("code successful");
		return charge;
    })
});
