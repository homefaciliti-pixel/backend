import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../utils/app_colors.dart';
import '../../viewmodel/auth_viewmodel.dart';
import '../Refer/apply_referral_screen.dart';

class OtpScreen extends StatefulWidget {
  const OtpScreen({super.key});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final List<TextEditingController> otpControllers = List.generate(
    4,
    (_) => TextEditingController(),
  );

  final List<FocusNode> otpFocusNodes = List.generate(4, (_) => FocusNode());

  bool _showCard = false;
  bool showOtpError = false;
  String otpErrorText = '';
  int remainingSeconds = 30;
  Timer? timer;

  String phoneNumber = '';

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = ModalRoute.of(context)?.settings.arguments;

      if (args is String) {
        phoneNumber = args;
      } else if (args is Map && args['phone'] != null) {
        phoneNumber = args['phone'].toString();
      }

      setState(() {
        _showCard = true;
      });

      startTimer();
    });
  }

  @override
  void dispose() {
    timer?.cancel();
    for (final c in otpControllers) {
      c.dispose();
    }
    for (final f in otpFocusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void startTimer() {
    timer?.cancel();
    remainingSeconds = 30;

    timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;

      if (remainingSeconds == 0) {
        t.cancel();
      } else {
        setState(() {
          remainingSeconds--;
        });
      }
    });
  }

  String get maskedPhone {
    if (phoneNumber.isEmpty) return '+91 ****** ***';
    final clean = phoneNumber.replaceAll(RegExp(r'\D'), '');
    if (clean.length < 3) return '+91 ****** ***';
    final last3 = clean.substring(clean.length - 3);
    return '+91 ****** $last3';
  }

  String get enteredOtp {
    return otpControllers.map((e) => e.text).join();
  }
  Future<void> verifyOtp() async {

    final otp = enteredOtp;

    setState(() {
      if (otp.length != 4) {
        showOtpError = true;
        otpErrorText =
        'Please enter valid 4-digit OTP';
      } else {
        showOtpError = false;
        otpErrorText = '';
      }
    });

    if (showOtpError) return;

    final authVM = Provider.of<AuthViewmodel>(
      context,
      listen: false,
    );

    final success = await authVM.verifyOtp(
      phone: phoneNumber,
      otp: otp,
      countryCode: "91",
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authVM.message ?? ''),
        ),
      );
     // Navigator.pushReplacementNamed(context, "/main");
      Navigator.pushNamedAndRemoveUntil(
        context,
        "/main",
            (route) => false,
      );
      // Navigator.pushReplacement(
      //   context,
      //   MaterialPageRoute(
      //     builder: (_) =>
      //     const ApplyReferralScreen(),
      //   ),
      // );
    } else {
      setState(() {
        showOtpError = true;
        otpErrorText =
            authVM.message ?? "Invalid OTP";
      });
    }
  }
  // void verifyOtp() {

  //   final otp = enteredOtp;
  //
  //   setState(() {
  //     if (otp.length != 4) {
  //       showOtpError = true;
  //       otpErrorText = 'Please enter valid 4-digit OTP';
  //     } else {
  //       showOtpError = false;
  //       otpErrorText = '';
  //     }
  //   });
  //
  //   if (!showOtpError) {
  //     final authVM = Provider.of<AuthViewmodel>(context, listen: false);
  //     authVM.login();
  //
  //     Navigator.pushReplacement(
  //       context,
  //       MaterialPageRoute(builder: (_) => const ApplyReferralScreen()),
  //     );
  //   }
  // }

  void resendOtp() {
    if (remainingSeconds != 0) return;

    setState(() {
      showOtpError = false;
      otpErrorText = '';
      for (final c in otpControllers) {
        c.clear();
      }
      FocusScope.of(context).requestFocus(otpFocusNodes[0]);
    });

    startTimer();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmall = size.width < 400;

    final cardHeight = isSmall ? size.height * 0.68 : size.height * 0.62;
    final iconSize = isSmall ? 160.0 : 195.0;
    final titleSize = isSmall ? 24.0 : 28.0;
    final subTitleSize = isSmall ? 14.0 : 15.0;
    final otpBoxSize = isSmall ? 54.0 : 60.0;
    final buttonHeight = isSmall ? 54.0 : 56.0;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.loginbackgroundprimary,
              AppColors.loginbackgroundsecondary,
            ],
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Stack(
            children: [
              Positioned(
                top: 18,
                left: 12,

                child: GestureDetector(
                  onTap: () {
                    Navigator.pushReplacementNamed(context, '/login');
                  },

                  child: Container(
                    width: 44,
                    height: 44,

                    decoration: BoxDecoration(
                      color: Colors.white,

                      borderRadius: BorderRadius.circular(14),

                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.06),
                          blurRadius: 10,
                        ),
                      ],
                    ),

                    child: const Icon(
                      Icons.arrow_back_ios_new_rounded,
                      size: 20,
                      color: Color(0xFF111827),
                    ),
                  ),
                ),
              ),

              Positioned(
                top: 50,
                left: 0,
                right: 0,
                child: Center(
                  child: Container(
                    width: iconSize,
                    height: iconSize,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF1F5A93).withOpacity(0.06),
                          blurRadius: 18,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Image.asset(
                      'assets/images/verify_otp.png',
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
              ),

              // bottom popup card
              AnimatedPositioned(
                duration: const Duration(milliseconds: 700),
                curve: Curves.easeOutCubic,
                left: 7,
                right: 7,
                bottom: _showCard ? 0 : -cardHeight,
                child: Container(
                  width: double.infinity,
                  height: cardHeight,
                  padding: EdgeInsets.symmetric(
                    horizontal: isSmall ? 18 : 22,
                    vertical: isSmall ? 22 : 28,
                  ),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(38),
                    ),
                  ),

                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // icon at top inside white card
                        Text(
                          'Verify OTP',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: titleSize,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF0F172A),
                            height: 1.1,
                          ),
                        ),

                        const SizedBox(height: 18),

                        Text(
                          "We've sent a 4-digit verification code to",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: subTitleSize,
                            color: const Color(0xFF111827),
                            height: 1.4,
                          ),
                        ),

                        const SizedBox(height: 6),

                        Text(
                          maskedPhone,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: isSmall ? 20 : 22,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF0F172A),
                          ),
                        ),

                        const SizedBox(height: 22),

                        const Text(
                          'Enter OTP',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF111827),
                          ),
                        ),

                        const SizedBox(height: 14),

                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: List.generate(4, (index) {
                            return SizedBox(
                              width: otpBoxSize,
                              height: otpBoxSize,
                              child: TextField(
                                controller: otpControllers[index],
                                focusNode: otpFocusNodes[index],
                                keyboardType: TextInputType.number,
                                textAlign: TextAlign.center,
                                maxLength: 1,
                                inputFormatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                ],
                                onChanged: (value) {
                                  if (value.isNotEmpty && index < 3) {
                                    FocusScope.of(
                                      context,
                                    ).requestFocus(otpFocusNodes[index + 1]);
                                  }

                                  final isComplete = otpControllers.every(
                                    (c) => c.text.isNotEmpty,
                                  );
                                  if (isComplete) {
                                    Future.delayed(
                                      const Duration(microseconds: 100),
                                      () {
                                        if (mounted) {
                                          verifyOtp();
                                        }
                                        ;
                                      },
                                    );
                                  }

                                  if (showOtpError) {
                                    setState(() {
                                      showOtpError = false;
                                      otpErrorText = '';
                                    });
                                  }
                                },
                                decoration: InputDecoration(
                                  counterText: '',
                                  filled: true,
                                  fillColor: Colors.white,
                                  contentPadding: const EdgeInsets.symmetric(
                                    vertical: 18,
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: BorderSide(
                                      color: showOtpError
                                          ? Colors.red
                                          : const Color(0xFFB8BFCB),
                                      width: 1.3,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(16),
                                    borderSide: BorderSide(
                                      color: showOtpError
                                          ? Colors.red
                                          : const Color(0xFF1F5A93),
                                      width: 1.6,
                                    ),
                                  ),
                                ),
                              ),
                            );
                          }),
                        ),

                        if (showOtpError) ...[
                          const SizedBox(height: 10),
                          Text(
                            otpErrorText,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.red,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],

                        const SizedBox(height: 20),

                        Container(
                          height: 56,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppColors.primaryButton,
                                AppColors.secondaryButton,
                              ],
                              begin: Alignment.centerLeft,
                              end: Alignment.centerRight,
                            ),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(
                                  0xFF1F5A93,
                                ).withOpacity(0.25),
                                blurRadius: 12,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: ElevatedButton(
                            onPressed: verifyOtp,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              shadowColor: Colors.transparent,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),

                            child: Consumer<AuthViewmodel>(
                              builder: (context, authVM, child) {
                        return authVM.loading
                        ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                        ),
                        )
                            : const Text(
                        'Verify & Continue',
                        style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        ),
                        );
                        },
                        ),
                            // const Text(
                            //   'Verify & Continue',
                            //   style: TextStyle(
                            //     fontSize: 17,
                            //     fontWeight: FontWeight.w700,
                            //   ),
                            // ),
                          ),
                        ),

                        const SizedBox(height: 20),

                        GestureDetector(
                          onTap: resendOtp,
                          child: Text(
                            'Resend OTP',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: remainingSeconds == 0
                                  ? const Color(0xFF1F5A93)
                                  : Colors.grey,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ),

                        const SizedBox(height: 8),

                        Text(
                          remainingSeconds == 0
                              ? 'You can resend now'
                              : '$remainingSeconds seconds remaining',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF111827),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
