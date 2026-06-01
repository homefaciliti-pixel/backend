import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../services/banner/banner_auth api.dart';
import '../../services/category/category_auth_api.dart';
import '../../services/product/all_service_auth_api.dart';
import '../../services/product/trending_auth_api.dart';
import '../../utils/app_colors.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  // Alag-alag animations ke liye variables
  late Animation<double> _iconScaleAnimation;
  late Animation<double> _iconOpacityAnimation;
  late Animation<int> _textCharacterCountAnimation;
  late Animation<double> _subtitleOpacityAnimation;

  final String _mainTitle = "HOME FACILITI";

  @override
  @override
  void initState() {
    super.initState();
     preloadData();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    );

    // Icon Animation
    _iconOpacityAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.3, curve: Curves.easeIn),
      ),
    );

    _iconScaleAnimation = Tween<double>(
      begin: 0.5,
      end: 1.0,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.3, curve: Curves.easeOutBack),
      ),
    );

    // Title Animation
    _textCharacterCountAnimation = StepTween(
      begin: 0,
      end: _mainTitle.length,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.3, 0.75, curve: Curves.linear),
      ),
    );

    // Subtitle Animation
    _subtitleOpacityAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.75, 1.0, curve: Curves.easeIn),
      ),
    );

    _controller.forward();

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {

        Timer(const Duration(milliseconds: 800), () async {

          final prefs = await SharedPreferences.getInstance();

          String? token = prefs.getString("token");

//print("token>>>>>>>>>>$token");
          if (token != null && token.isNotEmpty) {

            Navigator.pushReplacementNamed(
              context,
              "/main",
            );

          } else {

            Navigator.pushReplacementNamed(
              context,
              "/login",
            );
          }
        });
      }
    });
  }
  Future<void> preloadData() async {

    await Future.wait([

      Provider.of<BannerViewmodel>(
        context,
        listen: false,
      ).fetchBanners(),

      Provider.of<CategoryViewmodelApi>(
        context,
        listen: false,
      ).fetchCategories(),

      Provider.of<TrendingServiceViewmodel>(
        context,
        listen: false,
      ).fetchTrendingServices(),

      Provider.of<AllServiceViewmodel>(
        context,
        listen: false,
      ).fetchTrendingServices(),

    ]);
  }
//   void initState() {
//     super.initState();
//
//     // Total animation duration 3 seconds rakhi hai
//     _controller = AnimationController(
//       vsync: this,
//       duration: const Duration(milliseconds: 3000),
//     );
//
//     // 1. Icon Animation (0 to 1 second) - Fade in aur slight zoom (Scale)
//     _iconOpacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
//       CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.3, curve: Curves.easeIn)),
//     );
//     _iconScaleAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
//       CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.3, curve: Curves.easeOutBack)),
//     );
//
//     // 2. Main Title (1 second to 2.2 seconds) - Letter by letter typing
//     _textCharacterCountAnimation = StepTween(begin: 0, end: _mainTitle.length).animate(
//       CurvedAnimation(parent: _controller, curve: const Interval(0.3, 0.75, curve: Curves.linear)),
//     );
//
//     // 3. Subtitle (2.2 seconds to 3 seconds) - Fade in
//     _subtitleOpacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
//       CurvedAnimation(parent: _controller, curve: const Interval(0.75, 1.0, curve: Curves.easeIn)),
//     );
//
//     // Animation start karna
//     _controller.forward();
//
//     // Jab poori animation complete ho jaye, tab thoda pause leke navigate karna
//     _controller.addStatusListener((status) {
//       if (status == AnimationStatus.completed) {
//         // Animation ke baad 800ms hold karega, taaki user final logo dekh sake
// Timer(const Duration(milliseconds: 800), () {
//           Navigator.pushReplacementNamed(context, "/login");
//        });
//       }
//     });
//   }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Container(

        // background color
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.loginbackgroundprimary,
              AppColors.loginbackgroundsecondary
            ]

          )
        ),


        child: Center(
          // AnimatedBuilder har frame par UI update karega jab animation chalegi
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // --- Step 1: House Icon ---
                  Transform.scale(
                    scale: _iconScaleAnimation.value,
                    child: Opacity(
                      opacity: _iconOpacityAnimation.value,
                      // Yahan apna crop kiya hua house icon lagayein
                      child: Image.asset(
                        'assets/images/home3.png', // Update your path here
                        height:150,
                        // Adjust size as needed
                      ),
                    ),
                  ),
                  const SizedBox(height:15),


                  // --- Step 2: Letter-by-Letter Title ---
                  // Yahan hum string ko substring kar rahe hain animation value ke hisaab se
                  Text(
                    _mainTitle.substring(0, _textCharacterCountAnimation.value),
                    style: const TextStyle(
                      fontSize: 42,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF003B73), // Logo ka blue color hex
                      letterSpacing: 2.5,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // --- Step 3: Subtitle ---
                  Opacity(
                    opacity: _subtitleOpacityAnimation.value,
                    child: const Text(
                      "MULTI SERVICES 24/7 EVERYWHERE",
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF003B73),
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}