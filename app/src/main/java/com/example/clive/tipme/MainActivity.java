package com.example.clive.tipme;

import android.content.Intent;
import android.net.wifi.WifiManager;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.text.format.Formatter;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import static android.content.Context.WIFI_SERVICE;

public class MainActivity extends AppCompatActivity {

    private FirebaseAuth auth = FirebaseAuth.getInstance();
    protected DatabaseReference mDatabase = FirebaseDatabase.getInstance().getReferenceFromUrl("https://tipme-5075f.firebaseio.com/");

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Button mSaveCard = (Button) findViewById(R.id.save_card);
        Button mLogout = (Button) findViewById(R.id.logout);
        Button mSendTip = (Button) findViewById(R.id.send_tip);
//        Button mTermsButton = findViewById(R.id.terms_button);
        //TextView mScreenMessage = (TextView) findViewById(R.id.screen_message);
        //mScreenMessage.setText("Welcome to your dashboard " + getUserName());

        mSaveCard.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                addCard();
            }
        });

        mLogout.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                logout();
            }
        });

        mSendTip.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                sendTip();
            }
        });

       /* mTermsButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                confirmAgreement();
            }
        }); */
    }

    /* private void confirmAgreement() {
        WifiManager wm = (WifiManager) getSystemService(WIFI_SERVICE);
        //TODO: Find up-to-date method for formatting ip address
        String ip = Formatter.formatIpAddress(wm.getConnectionInfo().getIpAddress());
        mDatabase.child(this.getUserName()).child("ip_address").push();
        mDatabase.child(this.getUserName()).child("ip_address").setValue(ip);
        mDatabase.child(this.getUserName()).child("terms_agreement").push().setValue(true);
    } */

    //Opens tip sending page
    private void sendTip() {
        Intent tipPage = new Intent(MainActivity.this, SendTips.class);
        startActivity(tipPage);
    }

    //Opens page to save card info
    private void addCard() {
        Intent saveCard = new Intent(MainActivity.this, CardInfo.class);
        startActivity(saveCard);
    }

    //Log out of TipMe account
    private void logout() {
        auth.signOut();
        Intent returnToLogin = new Intent(MainActivity.this, LoginActivity.class);
        startActivity(returnToLogin);
    }

    //Returns the unique identifier of the user (email)
    public String getEmail() {
        return auth.getCurrentUser().getEmail();
    }

    public String getUserName() {
        StringBuffer userName = new StringBuffer("");
        String email = auth.getCurrentUser().getEmail();
        int pos = 0;
        while (email.charAt(pos) != '@') {
            userName.append(email.charAt(pos));
            pos++;
        }
        return userName.toString();
    }

    //Returns the current user of the app
    public FirebaseUser getUser() {
        return auth.getCurrentUser();
    }
}
