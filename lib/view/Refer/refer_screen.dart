import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../utils/app_colors.dart';
import '../../viewmodel/auth_viewmodel.dart';

class ReferScreen extends StatelessWidget {
  const ReferScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authVM = Provider.of<AuthViewmodel>(context);

    final referralCode = authVM.user.referralCode;

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false, // we will add custom back button

        backgroundColor: Colors.transparent,
        elevation: 0,

        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.primaryButton,
                AppColors.secondaryButton,
              ],
            ),
          ),
        ),

        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new,
            color: Colors.white, // ✅ white arrow
            size: 20,
          ),
          onPressed: () {
            Navigator.pop(context);
          },
        ),

        title: const Text(
          "Refer & Earn",
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),

        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 20),
            /// 🎯 TITLE
            const Text(
              "Invite Friends & Earn Rewards 💰",
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 10),
            Text(
              "Share your referral code with friends and earn rewards when they join!",
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[700]),
            ),

            const SizedBox(height: 30),

            /// 🔥 REFERRAL CODE BOX
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: Colors.blue.shade50,
              ),
              child: Column(
                children: [

                  const Text(
                    "Your Referral Code",
                    style: TextStyle(fontSize: 14),
                  ),

                  const SizedBox(height: 10),

                  Text(
                    referralCode,
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 30),

            /// 🔥 SHARE BUTTON
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Share.share(
                    "Use my referral code: $referralCode\nDownload HomeFaciliti app now 🚀",
                  );

                  /// 🔥 FUTURE API
                  /// yaha track hoga referral share
                },
                icon: const Icon(Icons.share),
                label: const Text("Share via WhatsApp"),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),

            const SizedBox(height: 20),

            /// 🔥 HOW IT WORKS
            const Align(
              alignment: Alignment.centerLeft,
              child: Text(
                "How it works?",
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),

            const SizedBox(height: 10),
            _buildStep("1. Share your code with friends"),
            _buildStep("2. Friend signs up using your code"),
            _buildStep("3. You both earn rewards 🎉"),

          ],
        ),
      ),
    );
  }

  /// 🔹 STEP ITEM
  Widget _buildStep(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          const Icon(Icons.check_circle, size: 18, color: Colors.green),
          const SizedBox(width: 8),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}