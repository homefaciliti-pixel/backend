import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:userapp/viewmodel/auth_viewmodel.dart';
import '../../../utils/app_colors.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:userapp/viewmodel/booking_flow_viewmodel.dart';
import 'package:userapp/view/booking_map/searching_partner_screen.dart';

class PaymentScreenNew extends StatefulWidget {
  final String productId;
  final String title;
  final String amount;
  const PaymentScreenNew({
    super.key,
    required this.productId,
    required this.title,
    required this.amount,
  });
  @override
  State<PaymentScreenNew> createState() => _PaymentScreenState();
}
class _PaymentScreenState extends State<PaymentScreenNew> {

  int selectedPayment = 0;
  int? _placedOrderId;

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

  Future<void> _handlePaymentSuccess(PaymentSuccessResponse response) async {
    print("RAZORPAY PAYMENT SUCCESS: ${response.paymentId}");
    if (_placedOrderId == null) {
      _showErrorSnackBar("Payment succeeded but order ID is missing. Please contact support.");
      return;
    }

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
          "orderId": _placedOrderId,
          "razorpay_payment_id": response.paymentId
        }),
      );

      // Dismiss loading dialog
      if (mounted) {
        Navigator.pop(context);
      }

      if (verifyRes.statusCode == 200) {
        final data = jsonDecode(verifyRes.body);
        if (data["success"] == true) {
          _showSuccessDialog();
        } else {
          _showErrorSnackBar(data["message"] ?? "Payment verification failed on server");
        }
      } else {
        _showErrorSnackBar("Payment verification returned status code ${verifyRes.statusCode}");
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
      }
      _showErrorSnackBar("Payment verification connection error: $e");
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

  Future<void> openCheckout() async {
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
      final authVM = Provider.of<AuthViewmodel>(context, listen: false);
      final userPhone = authVM.user.phone.isNotEmpty ? authVM.user.phone : (prefs.getString("phone") ?? '9199953391');
      final userEmail = authVM.user.email.isNotEmpty ? authVM.user.email : 'test@gmail.com';
      final parsedAmount = double.tryParse(widget.amount) ?? 0.0;
      final amountInPaise = (parsedAmount * 100).toInt();

      final response = await http.post(
        Uri.parse("https://backend-1-ux3b.onrender.com/api/checkout-api"),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          "productId": widget.productId,
          "payment": {
            "paymentMethod": "Online",
            "amountPaid": parsedAmount
          }
        }),
      );

      if (mounted) {
        Navigator.pop(context); // Dismiss loading dialog
      }

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data["success"] == true && data["razorpayOrderId"] != null) {
          _placedOrderId = data["orderId"];
          final razorpayOrderId = data["razorpayOrderId"];

          var options = {
            'key': 'rzp_live_SwFaJKQjU5ZOsH',
            'amount': amountInPaise > 0 ? amountInPaise : 100,
            'currency': 'INR',
            'name': 'HomeFaciliti',
            'description': widget.title,
            'order_id': razorpayOrderId,
            'prefill': {
              'contact': userPhone,
              'email': userEmail,
            },
            'notes': {
              'product_id': widget.productId,
              'order_id': data["orderId"].toString()
            },
            'theme': {
              'color': '#0000FF',
            }
          };

          _razorpay.open(options);
        } else {
          final errMsg = data["error"] ?? data["message"] ?? "Failed to create checkout on server";
          _showErrorSnackBar(errMsg);
        }
      } else {
        _showErrorSnackBar("Server returned status code ${response.statusCode}");
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
      }
      _showErrorSnackBar("Checkout connection error: $e");
    }
  }

  Future<void> placeCashOrder() async {
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

      final response = await http.post(
        Uri.parse("https://backend-1-ux3b.onrender.com/api/checkout-api"),
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          "productId": widget.productId,
          "payment": {
            "paymentMethod": "Cash",
            "amountPaid": 0
          }
        }),
      );

      if (mounted) {
        Navigator.pop(context); // Dismiss loading dialog
      }

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data["success"] == true) {
          _showSuccessDialog();
        } else {
          final errMsg = data["error"] ?? data["message"] ?? "Failed to place COD order";
          _showErrorSnackBar(errMsg);
        }
      } else {
        _showErrorSnackBar("Server returned status code ${response.statusCode}");
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
      }
      _showErrorSnackBar("Connection error: $e");
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

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        title: const Text("Success"),
        content: const Text("Order Placed Successfully 🎉"),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog

              final bookingVM = Provider.of<BookingFlowViewModel>(
                context,
                listen: false,
              );
              bookingVM.startSearching();

              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (_) => const SearchingPartnerScreen(),
                ),
              );
            },
            child: const Text("OK"),
          )
        ],
      ),
    );
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
    final parsedAmount = double.tryParse(widget.amount) ?? 0.0;
    final isFree = parsedAmount == 0.0;

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

                child: isFree
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "Booking Details",
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.green.shade50,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.green.shade200),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.card_giftcard,
                                  color: Colors.green,
                                  size: 30,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        "Free Booking Offered",
                                        style: TextStyle(
                                          color: Colors.green.shade800,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      const Text(
                                        "Enjoy this service at ₹0. No payment is required.",
                                        style: TextStyle(
                                          color: Colors.black54,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      )
                    : Column(

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
                onPressed: () {
                  if (isFree) {
                    placeCashOrder();
                  } else if (selectedPayment == 2) {
                    placeCashOrder();
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

                      (isFree || selectedPayment == 2)
                          ? Icons.shopping_bag
                          : Icons.lock,

                      color: Colors.white,
                    ),

                    const SizedBox(width: 10),

                    Text(

                      isFree
                          ? "Confirm Free Booking"
                          : selectedPayment == 2
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