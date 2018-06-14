package com.example.clive.tipme;

import android.os.Bundle;
import android.app.Activity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import java.util.ArrayList;

public class SendTips extends Activity {

    private String amountToTip;
    protected EditText amount;

    private DatabaseReference mDatabase;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_send_tips);

        amount = (EditText) findViewById(R.id.tip_amount);
        Button sendTip = (Button) findViewById(R.id.send_tip);

        mDatabase = FirebaseDatabase.getInstance().getReferenceFromUrl("https://tipme-5075f.firebaseio.com/");

        sendTip.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                setTipAmount();
            }
        });
    }

    //Set charge amount based on user's input
    private void setTipAmount() {
        amountToTip = amount.getText().toString();
        double numAmount = Double.parseDouble(amountToTip);
        numAmount = numAmount*100;
        MainActivity main = new MainActivity();
        String userID = ""; int wordCount = 0;
        while (main.getEmail().charAt(wordCount) != '@') {
            userID = userID + main.getEmail().charAt(wordCount);
            wordCount++;
        }
        mDatabase.child(userID).child("idempotency_key").setValue(createIdempotencyKey());
        mDatabase.child(userID).child("tip_amount").setValue(numAmount);
    }

    public String getTipAmount() {
        return amountToTip;
    }

    private ArrayList<Character> idempotencyArray = new ArrayList<Character>();

    private String createIdempotencyKey() {
        int randomNum;
        StringBuilder idempString = new StringBuilder("idemp_");
        for (char s = 'A'; s <= 'z'; s++) {
            if (!"[\\]_^`".contains(s+"")) {
                idempotencyArray.add(s);
            }
        }
        for (int i = 0; i < 10; i++) {
            randomNum = (int) (Math.random()*53);
            idempString.append(idempotencyArray.get(randomNum));
        }
        return idempString.toString();
    }
}
