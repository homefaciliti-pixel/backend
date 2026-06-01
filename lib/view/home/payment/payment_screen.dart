import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:userapp/view/mainScreen/main_screen.dart';
import '../../../utils/app_colors.dart';
import '../order/order_screen.dart';

class PaymentScreenNew extends StatefulWidget {
  final String paymentOrderId;
  final String userPhoneNumber;
  final int orderId;
  final String productId;
  final String title;
  final String amount;
  const PaymentScreenNew({
    super.key,
    required this.paymentOrderId,
    required this.userPhoneNumber,
    required this.orderId,
    required this.productId,
    required this.title,
    required this.amount,
  });
  @override
  State<PaymentScreenNew> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreenNew> {

  int selectedPayment = 0;

  late Razorpay _razorpay;

  @override
  void initState() {

    super.initState();

    _razorpay = Razorpay();

    _razorpay.on(
      Razorpay.EVENT_PAYMENT_SUCCESS,
      _handlePaymentSuccess,
    );

    _razorpay.on(
      Razorpay.EVENT_PAYMENT_ERROR,
      _handlePaymentError,
    );

    _razorpay.on(
      Razorpay.EVENT_EXTERNAL_WALLET,
      _handleExternalWallet,
    );
  }

  @override
  void dispose() {

    _razorpay.clear();

    super.dispose();
  }
  bool isPlacingOrder = false;

  Future<void> placeCodOrder() async {
    try {
      setState(() {
        isPlacingOrder = true;
      });

      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("token");

      if (token == null || token.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Token not found. Please login again."),
          ),
        );
        return;
      }

      final response = await http.post(
        Uri.parse(
          "https://backend-1-ux3b.onrender.com/api/payments/cod/${widget.orderId}",
        ),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
      );

      debugPrint("Status Code : ${response.statusCode}");
      debugPrint("Response : ${response.body}");

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 ||
          response.statusCode == 201) {

        await showOrderSuccessDialog();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              data["message"] ??
                  "Failed to place order",
            ),
          ),
        );
      }
    } catch (e) {
      debugPrint(e.toString());

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Error : $e"),
        ),
      );
    } finally {
      setState(() {
        isPlacingOrder = false;
      });
    }
  }

  Future<void> showOrderSuccessDialog() async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.check_circle,
                color: Colors.green,
                size: 80,
              ),
              const SizedBox(height: 16),
              const Text(
                "Order Successful!",
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                "Your order has been placed successfully.\nWe are currently searching for a service partner.",
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 15),
            ],
          ),
        );
      },
    );

    await Future.delayed(const Duration(seconds: 3));

    if (!mounted) return;

    Navigator.of(context).pop(); // dialog close

    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(
        builder: (_) => const MainScreen(),
      ),
          (route) => false,
    );
  }

  Future<void> _handlePaymentSuccess(PaymentSuccessResponse response) async {
    print("RAZORPAY PAYMENT SUCCESS: ${response.paymentId}");
    
    // Show a sleek loading dialog while verifying payment on server
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(
          color: Colors.green,
        ),
      ),
    );

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("token") ?? "";

      // Call payment verification endpoint
      final verifyRes = await http.post(
        Uri.parse("https://backend-1-ux3b.onrender.com/api/payments/verify"),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          "orderId": widget.orderId,
          "razorpay_payment_id": response.paymentId
        }),
      );

      // Dismiss loading dialog
      if (verifyRes.statusCode == 200) {
        final data = jsonDecode(verifyRes.body);
        if (mounted) {
          Navigator.pop(context); // Close loading dialog
        }
        if (data["success"] == true) {
          await showOrderSuccessDialog();
        } else {
          _showErrorSnackBar(data["message"] ?? "Payment verification failed on server");
        }
      } else {
        if (mounted) {
          Navigator.pop(context);
        }
        _showErrorSnackBar("Payment verification returned status code ${verifyRes.statusCode}");
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
      }
      _showErrorSnackBar("Payment verification connection error: $e");
    }
  }

  void _showErrorSnackBar(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {

    print("====================================");
    print("RAZORPAY PAYMENT ERROR");
    print("Code       : ${response.code}");
    print("Message    : ${response.message}");
    print("Error Data : ${response.error}");
    print("====================================");

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          "Payment Failed\n${response.message ?? 'Unknown Error'}",
        ),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _handleExternalWallet(
      ExternalWalletResponse response) {

    print(response.walletName);
  }

  void openCheckout() {
    var options = {
      'key':  'rzp_live_SwFaJKQjU5ZOsH',
      'amount': int.parse(widget.amount) * 100,
      'currency': 'INR',
      'name': 'HomeFaciliti',
      'description': widget.title,
      'order_id': widget.paymentOrderId, // Pass the real dynamic Razorpay Order ID from backend!
      'prefill': {
       'contact': widget.userPhoneNumber,
      },
      'notes': {
        'product_id': widget.productId,
        'order_id': widget.orderId.toString()
      },
      'theme': {
        'color': '#1F5A93',
      }
    };

    try {
      _razorpay.open(options);
    } catch (e) {
      debugPrint("Checkout Error: $e");
    }
  }

  Widget paymentTile({

    required int index,
    required IconData icon,
    required String title,

  }) {

    return GestureDetector(

      onTap: () {

        setState(() {
          selectedPayment = index;
        });
      },

      child: Container(

        margin:
        const EdgeInsets.only(bottom: 14),

        padding:
        const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 14,
        ),

        decoration: BoxDecoration(

          color: Colors.white,

          border: Border.all(

            color: selectedPayment == index
                ? Colors.green
                : Colors.grey.shade300,

            width: 1.5,
          ),

          borderRadius:
          BorderRadius.circular(16),
        ),

        child: Row(

          children: [

            Icon(
              icon,
              size: 28,
              color: Colors.green,
            ),

            const SizedBox(width: 14),

            Expanded(

              child: Text(

                title,

                style: const TextStyle(

                  fontSize: 15,

                  fontWeight:
                  FontWeight.w600,
                ),
              ),
            ),

            Radio(

              value: index,

              groupValue: selectedPayment,

              activeColor: Colors.green,

              onChanged: (value) {

                setState(() {
                  selectedPayment = value!;
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      backgroundColor: Colors.grey.shade100,

      appBar: AppBar(

        elevation: 0,

        backgroundColor: Colors.white,

        centerTitle: true,

        title: const Text(

          "Payment",

          style: TextStyle(

            color: Colors.black,

            fontWeight: FontWeight.bold,
          ),
        ),

        leading: IconButton(

          onPressed: () {
            Navigator.pop(context);
          },

          icon: const Icon(
            Icons.arrow_back_ios_new,
            color: Colors.black,
          ),
        ),
      ),

      body: SafeArea(

        child: SingleChildScrollView(

          padding: const EdgeInsets.all(16),

          child: Column(

            children: [

              /// PRODUCT CARD
              Container(

                padding: const EdgeInsets.all(16),

                decoration: BoxDecoration(

                  color: Colors.white,

                  borderRadius:
                  BorderRadius.circular(20),

                  boxShadow: const [

                    BoxShadow(
                      color: Colors.black12,
                      blurRadius: 8,
                    ),
                  ],
                ),

                child: Row(

                  children: [

                    Container(

                      height: 70,
                      width: 70,

                      decoration: BoxDecoration(

                        color: Colors.green.shade50,

                        borderRadius:
                        BorderRadius.circular(14),
                      ),

                      child: const Icon(

                        Icons.home_repair_service,

                        color: Colors.green,

                        size: 35,
                      ),
                    ),

                    const SizedBox(width: 14),

                    Expanded(

                      child: Column(

                        crossAxisAlignment:
                        CrossAxisAlignment.start,

                        children: [

                          Text(

                            widget.title,

                            style: const TextStyle(

                              fontSize: 16,

                              fontWeight:
                              FontWeight.bold,
                            ),
                          ),

                          const SizedBox(height: 6),

                          Text(

                            "₹ ${widget.amount}",

                            style: const TextStyle(

                              fontSize: 18,

                              color: Colors.green,

                              fontWeight:
                              FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              /// PAYMENT METHODS
              Container(

                padding: const EdgeInsets.all(16),

                decoration: BoxDecoration(

                  color: Colors.white,

                  borderRadius:
                  BorderRadius.circular(20),

                  boxShadow: const [

                    BoxShadow(
                      color: Colors.black12,
                      blurRadius: 8,
                    ),
                  ],
                ),

                child: Column(

                  crossAxisAlignment:
                  CrossAxisAlignment.start,

                  children: [

                    const Text(

                      "Payment Method",

                      style: TextStyle(

                        fontSize: 16,

                        fontWeight:
                        FontWeight.bold,
                      ),
                    ),

                    const SizedBox(height: 16),

                    paymentTile(

                      index: 0,

                      icon:
                      Icons.account_balance_wallet,

                      title: "UPI ",
                    ),

                    paymentTile(

                      index: 1,

                      icon: Icons.credit_card,

                      title:
                      "Credit / Debit Card",
                    ),

                    paymentTile(

                      index: 2,

                      icon: Icons.payments,

                      title: "Cash on Service",
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 100),
            ],
          ),
        ),
      ),

      /// BOTTOM BUTTON
      bottomNavigationBar: Container(

        padding: const EdgeInsets.all(16),

        decoration: const BoxDecoration(

          color: Colors.white,

          borderRadius: BorderRadius.only(

            topLeft: Radius.circular(25),

            topRight: Radius.circular(25),
          ),
        ),

        child: SafeArea(

          child: SizedBox(

            height: 56,

            child: Container(

              decoration: BoxDecoration(

                gradient:  LinearGradient(

                  colors: [

                    AppColors.primaryButton,

                    AppColors.secondaryButton,
                  ],
                ),

                borderRadius:
                BorderRadius.circular(30),
              ),

              child: ElevatedButton(

                  onPressed: () async {
                    if (selectedPayment == 2) {
                      await placeCodOrder();
                    } else {
                      openCheckout();
                    }
                },

                style:
                ElevatedButton.styleFrom(

                  backgroundColor:
                  Colors.transparent,

                  shadowColor:
                  Colors.transparent,

                  shape: RoundedRectangleBorder(

                    borderRadius:
                    BorderRadius.circular(30),
                  ),
                ),

                child: Row(

                  mainAxisAlignment:
                  MainAxisAlignment.center,

                  children: [

                    Icon(

                      selectedPayment == 2
                          ? Icons.shopping_bag
                          : Icons.lock,

                      color: Colors.white,
                    ),

                    const SizedBox(width: 10),

                    Text(

                      selectedPayment == 2
                          ? "Place Order"
                          : "Pay ₹${widget.amount}",

                      style: const TextStyle(

                        color: Colors.white,

                        fontSize: 17,

                        fontWeight:
                        FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}