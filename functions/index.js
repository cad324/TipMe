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
	var destination_ref = db.ref("/"+userId+"/destination/");
	var recipient_ref; //referenced from the recipient's user info
	var customer_id;
	var dest_name; //name of the user the tip is being sent to
	var destination_account;
	
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
	
	destination_ref.on("value", function(snapshot) {
		dest_name = snapshot.val();
		console.log("Designated user is "+dest_name);
		recipient_ref = db.ref("/"+dest_name+"/account");
		console.log("Tip to be sent to " + dest_name);
		recipient_ref.on("value", function(snapshot) {
			destination_account = snapshot.val();
			console.log("Destination account is "+destination_account);
		}, function(errorObject) {
			console.log("Error trying to get other user's account info");
		});
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
			source: customer_source,
			application_fee: 15
		}, {
			stripe_account: destination_account,
		},
		function(err, charge) {
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

exports.stripeAccountCreate = functions.database.ref('/{userID}/account').onCreate((change, context) => {
	
	const userId = context.params.userID;
	
	var account = stripe.accounts.create({
		country: "US",
		type: "custom"
	}).then(function(acct) {
		// asynchronously called
		console.log("Account id: "+acct["id"]);
		var acc_id = acct["id"];
		admin.database().ref(`/${userId}/account`).set(acc_id);
		return acc_id;
	}, function(err, acct) {
		console("Account: "+acc+" couldn't be created because "+err);
	});
	
});

exports.stripeAgreement = functions.database.ref('/{userID}/terms_agreement').onCreate((change, context) => {
	
	const userId = context.params.userID;
	var account_ref = db.ref("/"+userId+"/account/");
	var ip_ref = db.ref("/"+userId+"/ip_address/");
	var acc_id;
	var ip_add;
	
	return account_ref.on("value", function(snapshot) {
		acc_id = snapshot.val();
		console.log("Account for term agreement is "+acc_id);
		ip_ref.on("value", function(snapshot) {
			ip_add = snapshot.val();
			console.log("IP address: "+ip_add);
		}, function(errorObject) {
			console.log("Error trying to get ip address "+errorObject);
		});
		stripe.accounts.update(
			acc_id,
			{
				tos_acceptance: {
				  date: Math.floor(Date.now() / 1000),
				  ip: '192.168.1.68', // Assumes you're not using a proxy
				}
			}
		)
		if (snapshot.val() === null) {
			console.error("Account not retrieved!");
			return;
		}
	}, function(errorObject) {
		console.log("The read failed: " + errorObject);
		
	});
});
