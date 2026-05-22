import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../viewmodel/auth_viewmodel.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {

  @override
  void initState() {
    super.initState();

           // user data load kar rahe hain (referral code + profile)


    Provider.of<AuthViewmodel>(context, listen: false).loadUser();

    Future.delayed(const Duration(seconds: 2), () async {

      final authVM =
      Provider.of<AuthViewmodel>(context, listen: false);

      await authVM.checkLogin();

      if (authVM.isLoggedIn) {
        Navigator.pushReplacementNamed(context, "/main");
      } else {
        Navigator.pushReplacementNamed(context, "/login");
      }

    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text(
          "HomeFaciliti",
          style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}