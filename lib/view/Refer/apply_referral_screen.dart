import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../viewmodel/auth_viewmodel.dart';

class ApplyReferralScreen extends StatefulWidget {
  const ApplyReferralScreen({super.key});

  @override
  State<ApplyReferralScreen> createState() => _ApplyReferralScreenState();
}

class _ApplyReferralScreenState extends State<ApplyReferralScreen> {

  final TextEditingController controller = TextEditingController();

  @override
  Widget build(BuildContext context) {

    final authVM = Provider.of<AuthViewmodel>(context);

    return Scaffold(
      appBar: AppBar(title: const Text("Apply Referral Code")),

      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [

            const SizedBox(height: 30),

            const Text(
              "Have a referral code?",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 10),

            const Text(
              "Enter code and earn rewards",
              style: TextStyle(color: Colors.grey),
            ),

            const SizedBox(height: 30),

            /// TEXTFIELD
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                hintText: "Enter Referral Code",
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 20),

            /// APPLY BUTTON
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {

                  if (controller.text.isNotEmpty) {
                    authVM.applyReferral(controller.text.trim(),context);
                  }

                  /// next screen

                  Navigator.pushReplacementNamed(context, "/main");
                },
                child: const Text("Apply & Continue"),
              ),
            ),

            const SizedBox(height: 10),

            /// SKIP BUTTON
            TextButton(
              onPressed: () {
                Navigator.pushReplacementNamed(context, "/main");
              },
              child: const Text("Skip"),
            ),
          ],
        ),
      ),
    );
  }
}