import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../viewmodel/auth_viewmodel.dart';
import '../Refer/apply_referral_screen.dart';

class OtpScreen extends StatelessWidget {
  const OtpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    TextEditingController otpController =TextEditingController();
    
    return Scaffold(
      appBar: AppBar(
        title:Text("OPT Verification"),
      ),
      body: Column(
        children: [
          SizedBox(height: 40),
          Text("Enter OTP",
          style: TextStyle(fontSize: 20),
          ),
          
          SizedBox(height: 20,),
          TextField(
            controller:otpController,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              border: OutlineInputBorder(),
              hintText: "Enter OTP"
            ),
          ),
          
          SizedBox(height: 20,),

          ElevatedButton(
            onPressed: () async {

              final authVM =
              Provider.of<AuthViewmodel>(context, listen: false);

              await authVM.login();

              print("OTP Verified");
              print(authVM.isLoggedIn);

              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (_) => ApplyReferralScreen(),
                ),
              );
            },
            child: Text("Verify OTP"),
          )
        ],
      ),
    );
  }
}
