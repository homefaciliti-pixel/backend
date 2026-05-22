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
              final otp = otpController.text.trim();
              if (otp.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("Please enter OTP")),
                );
                return;
              }
              final authVM = Provider.of<AuthViewmodel>(context, listen: false);
              try {
                final verified = await authVM.verifyOtp(otp);
                if (verified) {
                  print("OTP Verified");
                  print(authVM.isLoggedIn);

                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const ApplyReferralScreen(),
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Invalid OTP, please try again")),
                  );
                }
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text("Error: $e")),
                );
              }
            },
            child: const Text("Verify OTP"),
          )
        ],
      ),
    );
  }
}
