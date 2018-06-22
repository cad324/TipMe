package com.example.clive.tipme;

import android.content.Intent;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.stripe.android.model.Source;
import com.stripe.android.model.SourceParams;
import com.stripe.android.view.CardInputWidget;
import com.stripe.android.model.Card;
import com.stripe.android.Stripe;
import com.stripe.android.model.Token;
import com.stripe.android.SourceCallback;
import com.stripe.android.TokenCallback;

import static com.example.clive.tipme.R.id.activity_card_info;
import static com.example.clive.tipme.R.id.email;


public class CardInfo extends AppCompatActivity {

    private DatabaseReference mDatabase;
    private Token userToken;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_card_info);
        mDatabase = FirebaseDatabase.getInstance().getReferenceFromUrl("https://tipme-5075f.firebaseio.com/");
        //Button to save credit card details after info is entered
        Button mSaveCardButton = (Button) findViewById(R.id.save_card);
        mSaveCardButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                saveCard();
            }
        });
    }

    //Securely save the card details for future use
    protected void saveCard() {
        CardInputWidget mCardInputWidget = findViewById(R.id.card_input_widget);
        Card savedCardInfo = mCardInputWidget.getCard();
        SourceParams cardSourceParams = SourceParams.createCardParams(savedCardInfo);
        if (savedCardInfo == null) {
            Toast mError = Toast.makeText(getApplicationContext(), "Invalid Card Data", Toast.LENGTH_SHORT);
            mError.show();
        } else if (!savedCardInfo.validateCard()) {
            Toast validateMsg = Toast.makeText(getApplicationContext(), "Incorrect card details", Toast.LENGTH_SHORT);
        } else {
            final Stripe stripe = new Stripe(getApplicationContext(), "pk_test_nzwViYut0XigNZKRYFS5AzB8");
            stripe.createToken(
                    savedCardInfo,
                    new TokenCallback() {
                        @Override
                        public void onSuccess(Token token) {
                            // Send token to your server
                            //setUserToken(token);
                            MainActivity main = new MainActivity();
                            String userID = ""; int wordCount = 0;
                            while (main.getEmail().charAt(wordCount) != '@') {
                                userID = userID + main.getEmail().charAt(wordCount);
                                wordCount++;
                            }
                            Toast.makeText(getApplication(), "Connection to server made", Toast.LENGTH_SHORT).show();
                            mDatabase.child(userID).push();
                            mDatabase.child(userID).child("card_token").push();
                            mDatabase.child(userID).child("tip_amount").push();
                            mDatabase.child(userID).child("account").push();
                            mDatabase.child(userID).child("account").setValue("acc_");
                            mDatabase.child(userID).child("card_token").setValue(token);
                            Intent backToMain = new Intent(CardInfo.this, MainActivity.class);
                            startActivity(backToMain);
                        }
                        @Override
                        public void onError(Exception error) {
                            // Show localized error message
                            Toast.makeText(getApplicationContext(),
                                    "Card could not be saved", Toast.LENGTH_LONG).show();
                        }
                    }
            );
            stripe.createSource(
                    cardSourceParams,
                    new SourceCallback() {
                        @Override
                        public void onSuccess(Source source) {
                            // Store the source somewhere, use it, etc
                            MainActivity main = new MainActivity();
                            String userID = ""; int wordCount = 0;
                            while (main.getEmail().charAt(wordCount) != '@') {
                                userID = userID + main.getEmail().charAt(wordCount);
                                wordCount++;
                            }
                            source.setUsage(Source.REUSABLE);
                            mDatabase.child(userID).push();
                            mDatabase.child(userID).child("source").push();
                            mDatabase.child(userID).child("idempotency_key").push();
                            mDatabase.child(userID).child("source").setValue(source.getId().toString());
                            Toast.makeText(getApplication(), "Connection to server made", Toast.LENGTH_SHORT).show();
                            Intent backToMain = new Intent(CardInfo.this, MainActivity.class);
                            startActivity(backToMain);
                        }
                        @Override
                        public void onError(Exception error) {
                            // Tell the user that something went wrong
                            Toast.makeText(getApplicationContext(),
                                    "Source could not be saved "+error, Toast.LENGTH_LONG).show();
                        }
                    });
        }
    }
}
