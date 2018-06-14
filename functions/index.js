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
	var customer_source; 	//source variable for the customer to be saved here
	var customer_obj; 		//customer object to be created and saved here	
	var saved_customer_ref = db.ref("/"+userId+"/customer/");
	var customer_id;
	
	source_ref.on("value", function(snapshot) {
		customer_source = snapshot.val();
		console.log("retrieved: " + customer_source);
		if (snapshot.val() === null) {
			console.error("Source not retrieved!");
			return;
		}
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
	}, function(errorObject) {
		console.log("The read failed: " + errorObject);
	});
	
	const currency = 'usd';
    
    return admin.database().ref(`/${userId}`).once('value').then(snapshot => {
        return snapshot.val();
    }).then(customers => {
		
		//Create a Customer:
		customer_obj = stripe.customers.create({
			source: customer_source
		}, function(err, customer_obj) {
			//async call
			console.log("Creating customer resulted in "+err);
			if (customer_obj !== null) {
				admin.database().ref(`/${userId}/customer`).set(customer_obj["id"]);
				customer_id = customer_obj["id"];
				console.log("Non-null customer id retrieved is "+customer_id);
				console.log("Non-null customer object retrieved is "+customer_obj);
			}
		});
		return;	
    }).then(tip_amount => {
		saved_customer_ref.on("value", function(snapshot) {
		customer_id = snapshot.val();
		console.log("retrieved customer id: " + customer_id);
		if (snapshot.val() === null) {
			console.error("Customer not retrieved!");
			return;
		}
		
		const charge = stripe.charges.create({
			amount: amountTip,
			currency: 'usd',
			customer: customer_id,
			source: customer_source
		}, {
			idempotency_key: idemp_key
		}, function(err, charge) {
			console.log("Error: "+err+" on charge");
		});
        admin.database().ref(`/${userId}/charge`).set("$"+amountTip/100);
		admin.database().ref(`/${userId}/stripe_charge`).set(charge);
		console.log("Stripe charge object created is: "+charge);
	}, 	function(errorObject) {
			console.log("The read failed: " + errorObject);
		});
		return;
    })
});
