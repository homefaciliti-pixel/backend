import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../utils/app_colors.dart';
import '../../viewmodel/auth_viewmodel.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController referralController = TextEditingController();
  bool _isApplyingReferral = false;

  final TextEditingController phoneController = TextEditingController();
  String? phoneError;
  bool showPhoneError = false;
  String phoneErrorText = '';
  bool _showCard = false;
  // bool _isApplyingReferral = false;
  //
  // final TextEditingController phoneController =
  // TextEditingController();
  //
  // String? phoneError;
  //
  // bool showPhoneError = false;
  //
  // String phoneErrorText = '';
  //
  // bool _showCard = false;

  /// ✅ ADD THIS
  bool _isSendingOtp = false;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      setState(() {
        _showCard = true;
      });
    });
  }
  @override
  void dispose() {
    referralController.dispose();
    phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmall = size.width < 400;

    final logoWidth = isSmall ? 210.0 : 280.0;
    final titleSize = isSmall ? 24.0 : 30.0;
    final mainTitleSize = isSmall ? 30.0 : 38.0;
    final cardTitleSize = isSmall ? 22.0 : 28.0;

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
              // TOP SECTION
              Column(
                children: [
                  SizedBox(height: isSmall ? 28 : 50),

                  Center(
                    child: Image.asset(
                      'assets/images/login_logo.png', // your logo path
                      width: logoWidth,
                      fit: BoxFit.contain,
                    ),
                  ),
                ],
              ),

              // BOTTOM POP-UP WHITE CARD
              AnimatedPositioned(
                duration: const Duration(milliseconds: 700),
                curve: Curves.easeOutCubic,
                left: 7,
                right: 7,
                bottom: _showCard ? 0 : -size.height * 0.56,
                child: Container(
                  width: double.infinity,
                  height: isSmall ? size.height * 0.68 : size.height * 0.56,
                  padding: EdgeInsets.symmetric(
                    horizontal: isSmall ? 18 : 22,
                    vertical: isSmall ? 24 : 30,
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
                        Text(
                          'Enter your mobile\nnumber to get started',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: cardTitleSize,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF0F172A),
                            height: 1.15,
                          ),
                        ),

                        SizedBox(height: isSmall ? 24 : 32),

                        // PHONE FIELD
                        Container(
                          height: 58,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: const Color(0xFFB8BFCB),
                              width: 1.2,
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                ),
                                decoration: const BoxDecoration(
                                  border: Border(
                                    right: BorderSide(
                                      color: Color(0xFFE5E7EB),
                                      width: 1,
                                    ),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: const [
                                    Text(
                                      '🇮🇳',
                                      style: TextStyle(fontSize: 20),
                                    ),
                                    SizedBox(width: 8),
                                    Text(
                                      '+91',
                                      style: TextStyle(
                                        fontSize: 16,
                                        color: Color(0xFF111827),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    SizedBox(width: 6),
                                    Icon(
                                      Icons.keyboard_arrow_down_rounded,
                                      size: 22,
                                      color: Color(0xFF6B7280),
                                    ),
                                  ],
                                ),
                              ),
                              Expanded(
                                child: TextField(
                                  controller: phoneController,
                                  keyboardType: TextInputType.number,
                                  maxLength: 10,
                                  onChanged: (value) {
                                    if (showPhoneError) {
                                      setState(() {
                                        if (value.isEmpty) {
                                          phoneErrorText =
                                              'Mobile number is required';
                                        } else if (value.length < 10) {
                                          phoneErrorText =
                                              'Enter valid 10-digit mobile number';
                                        } else {
                                          showPhoneError = false;
                                          phoneErrorText = '';
                                        }
                                      });
                                    }
                                  },
                                  decoration: InputDecoration(
                                    hintText: 'Mobile Number',
                                    counterText: '',
                                    filled: true,
                                    fillColor: Colors.white,
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 16,
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: BorderSide(
                                        color: showPhoneError
                                            ? Colors.red
                                            : const Color(0xFFB8BFCB),
                                        width: 1.2,
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: BorderSide(
                                        color: showPhoneError
                                            ? Colors.red
                                            : const Color(0xFF1F5A93),
                                        width: 1.4,
                                      ),
                                    ),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (showPhoneError) ...[
                          const SizedBox(height: 8),

                          Text(
                            phoneErrorText,

                            style: const TextStyle(
                              color: Colors.red,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],

                        SizedBox(height: isSmall ? 22 : 28),

                        // BUTTON
                        SizedBox(
                          height: 56,

                          child: Container(

                            decoration: BoxDecoration(

                              gradient: LinearGradient(

                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,

                                colors: [

                                  AppColors.primaryButton,
                                  AppColors.secondaryButton,
                                ],
                              ),

                              borderRadius:
                              BorderRadius.circular(16),

                              boxShadow: [

                                BoxShadow(

                                  color: AppColors.background
                                      .withOpacity(0.30),

                                  blurRadius: 12,

                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),

                            child: ElevatedButton(

                              /// ✅ BUTTON DISABLE DURING API CALL
                              onPressed: _isSendingOtp
                                  ? null
                                  : () async {

                                final phone =
                                phoneController.text.trim();

                                setState(() {

                                  if (phone.isEmpty) {

                                    showPhoneError = true;

                                    phoneErrorText =
                                    'Mobile number is required';

                                  } else if (!RegExp(
                                      r'^[6-9]\d{9}$')
                                      .hasMatch(phone)) {

                                    showPhoneError = true;

                                    phoneErrorText =
                                    'Enter valid mobile number';

                                  } else {

                                    showPhoneError = false;

                                    phoneErrorText = '';
                                  }
                                });

                                if (showPhoneError) return;

                                /// ✅ START LOADING
                                setState(() {
                                  _isSendingOtp = true;
                                });

                                try {

                                  final authVM =
                                  Provider.of<AuthViewmodel>(

                                    context,
                                    listen: false,
                                  );

                                  final success =
                                  await authVM.sendOtp(

                                    phone: phone,
                                    countryCode: "+91",
                                  );

                                  if (!mounted) return;

                                  if (success) {

                                    ScaffoldMessenger.of(context)
                                        .showSnackBar(

                                      const SnackBar(

                                        content: Text(
                                            'OTP sent successfully'),
                                      ),
                                    );

                                    Navigator.pushNamed(

                                      context,
                                      "/otp",

                                      arguments: phone,
                                    );

                                  } else {

                                    ScaffoldMessenger.of(context)
                                        .showSnackBar(

                                      SnackBar(
                                        content:
                                        Text(authVM.message ?? 'Failed to send OTP'),
                                        backgroundColor: Colors.red,
                                        duration: const Duration(seconds: 4),
                                      ),
                                    );
                                  }

                                } finally {

                                  /// ✅ STOP LOADING
                                  if (mounted) {

                                    setState(() {
                                      _isSendingOtp = false;
                                    });
                                  }
                                }
                              },

                              style: ElevatedButton.styleFrom(

                                backgroundColor: Colors.transparent,

                                shadowColor: Colors.transparent,

                                foregroundColor: Colors.white,

                                disabledBackgroundColor:
                                Colors.transparent,

                                disabledForegroundColor:
                                Colors.white,

                                shape: RoundedRectangleBorder(

                                  borderRadius:
                                  BorderRadius.circular(16),
                                ),
                              ),

                              /// ✅ LOADING UI
                              child: _isSendingOtp

                                  ? const SizedBox(

                                width: 24,
                                height: 24,

                                child: CircularProgressIndicator(

                                  color: Colors.white,

                                  strokeWidth: 2.5,
                                ),
                              )

                                  : const Text(

                                'Get OTP',

                                style: TextStyle(

                                  fontSize: 17,

                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ),
                        ),
                        // SizedBox(
                        //   height: 56,
                        //
                        //   child: Container(
                        //     decoration: BoxDecoration(
                        //       gradient: LinearGradient(
                        //         begin: Alignment.centerLeft,
                        //         end: Alignment.centerRight,
                        //
                        //         colors: [
                        //           AppColors.primaryButton,
                        //           AppColors.secondaryButton,
                        //         ],
                        //       ),
                        //
                        //       borderRadius: BorderRadius.circular(16),
                        //
                        //       boxShadow: [
                        //         BoxShadow(
                        //           color: AppColors.background.withOpacity(0.30),
                        //           blurRadius: 12,
                        //           offset: const Offset(0, 6),
                        //         ),
                        //       ],
                        //     ),
                        //
                        //     child: ElevatedButton(
                        //       onPressed: () async {
                        //         final phone = phoneController.text.trim();
                        //         setState(() {
                        //           if (phone.isEmpty) {
                        //             showPhoneError = true;
                        //             phoneErrorText = 'Mobile number is required';
                        //           } else if (!RegExp(r'^[6-9]\d{9}$').hasMatch(phone)) {
                        //             showPhoneError = true;
                        //             phoneErrorText = 'Enter valid mobile number';
                        //           } else {
                        //             showPhoneError = false;
                        //             phoneErrorText = '';
                        //           }
                        //         });
                        //
                        //         if (showPhoneError) return;
                        //
                        //         final authVM = Provider.of<AuthViewmodel>(
                        //           context,
                        //           listen: false,
                        //         );
                        //
                        //         final success = await authVM.sendOtp(
                        //           phone: phone,
                        //           countryCode: "91",
                        //         );
                        //
                        //         if (!mounted) return;
                        //
                        //         if (success) {
                        //           ScaffoldMessenger.of(context).showSnackBar(
                        //             const SnackBar(
                        //               content: Text('OTP sent successfully'),
                        //             ),
                        //           );
                        //
                        //           Navigator.pushNamed(
                        //             context,
                        //             "/otp",
                        //             arguments: phone,
                        //           );
                        //         } else {
                        //           ScaffoldMessenger.of(context).showSnackBar(
                        //             const SnackBar(
                        //               content: Text('Failed to send OTP'),
                        //             ),
                        //           );
                        //         }
                        //       },
                        //       // onPressed: () {
                        //       //   final phone = phoneController.text.trim();
                        //       //
                        //       //   setState(() {
                        //       //     if (phone.isEmpty) {
                        //       //       showPhoneError = true;
                        //       //
                        //       //       phoneErrorText =
                        //       //           'Mobile number is required';
                        //       //     } else if (phone.length < 10) {
                        //       //       showPhoneError = true;
                        //       //
                        //       //       phoneErrorText =
                        //       //           'Enter valid 10-digit mobile number';
                        //       //     } else {
                        //       //       showPhoneError = false;
                        //       //       phoneErrorText = '';
                        //       //     }
                        //       //   });
                        //       //
                        //       //   if (!showPhoneError) {
                        //       //     Navigator.pushNamed(
                        //       //       context,
                        //       //       "/otp",
                        //       //       arguments: phoneController.text,
                        //       //     );
                        //       //   }
                        //       //
                        //       // },
                        //       //
                        //       style: ElevatedButton.styleFrom(
                        //         backgroundColor: Colors.transparent,
                        //
                        //         shadowColor: Colors.transparent,
                        //
                        //         foregroundColor: Colors.white,
                        //
                        //         shape: RoundedRectangleBorder(
                        //           borderRadius: BorderRadius.circular(16),
                        //         ),
                        //       ),
                        //       child: const Text(
                        //         'Get OTP',
                        //         style: TextStyle(
                        //           fontSize: 17,
                        //           fontWeight: FontWeight.w700,
                        //         ),
                        //       ),
                        //     ),
                        //   ),
                        // ),

                        const SizedBox(height: 22),

                        Text(
                          'We will send you a verification code\nvia SMS.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: isSmall ? 13 : 14,
                            color: const Color(0xFF111827),
                            height: 1.35,
                          ),
                        ),

                        SizedBox(height: 25),

                        InkWell(
                          onTap: () {
                            _showReferralDialog(context);
                          },
                          child: Text(
                            'Have a referral code',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: isSmall ? 14 : 16,
                              color: AppColors.primaryButton,
                              height: 2,
                            ),
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

  Future<void> _showReferralDialog(BuildContext context) async {
    referralController.clear();

    await showDialog(
      context: context,
      barrierDismissible: true,
      builder: (dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: const Text(
            'Enter Referral Code',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: referralController,
                textCapitalization: TextCapitalization.characters,

                decoration: InputDecoration(


                  hintText: 'Referral code',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(15),

                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext);
              },
              child: const Text('Cancel'),
            ),
            Container(
              height: 46,

              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,

                  colors: [AppColors.primaryButton, AppColors.secondaryButton],
                ),

                borderRadius: BorderRadius.circular(12),

                boxShadow: [
                  BoxShadow(
                    color: AppColors.primaryBlue.withOpacity(0.25),
                    blurRadius: 10,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),

              child: ElevatedButton(
                onPressed: _isApplyingReferral
                    ? null
                    : () async {
                        final code = referralController.text.trim();

                        if (code.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Please enter referral code'),
                            ),
                          );

                          return;
                        }

                        setState(() {
                          _isApplyingReferral = true;
                        });

                        try {
                          final authVM = Provider.of<AuthViewmodel>(
                            context,
                            listen: false,
                          );

                          final success = await authVM.applyReferralCode(code);

                          if (!mounted) return;

                          Navigator.pop(dialogContext);

                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                success
                                    ? 'Referral code applied successfully'
                                    : 'Invalid referral code',
                              ),
                            ),
                          );
                        } finally {
                          if (mounted) {
                            setState(() {
                              _isApplyingReferral = false;
                            });
                          }
                        }
                      },

                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,

                  shadowColor: Colors.transparent,

                  foregroundColor: Colors.white,

                  shape: RoundedRectangleBorder(

                    borderRadius: BorderRadius.circular(12),
                  ),
                ),

                child: _isApplyingReferral
                    ? const SizedBox(
                        width: 18,
                        height: 18,

                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        'Apply',

                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
              ),
            ),
          ],
        );
      },
    );
  }
}
