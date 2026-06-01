import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:userapp/viewmodel/auth_viewmodel.dart';
import '../../../utils/app_colors.dart';
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

  void _handlePaymentSuccess(
      PaymentSuccessResponse response) {

    ScaffoldMessenger.of(context).showSnackBar(

      const SnackBar(
        content: Text("Payment Successful"),
      ),
    );

    print(response.paymentId);
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
    final authVM = Provider.of<AuthViewmodel>(context, listen: false);
    final userPhone = authVM.user.phone.isNotEmpty ? authVM.user.phone : '9199953391';
    final userEmail = authVM.user.email.isNotEmpty ? authVM.user.email : 'test@gmail.com';
    final parsedAmount = double.tryParse(widget.amount) ?? 0.0;
    final amountInPaise = (parsedAmount * 100).toInt();

    var options = {
      'key': 'rzp_live_SwFaJKQjU5ZOsH',
      'amount': amountInPaise > 0 ? amountInPaise : 100, // Fallback to 100 paise (₹1) if amount is 0 or invalid
      'currency': 'INR',
      'name': 'HomeFaciliti',
      'description': widget.title,
     // 'order_id': 'order_mock_fukJZ6SYa', // backend se aaye to hi do
      'prefill': {
        'contact': userPhone,
        'email': userEmail,
      },
      'notes': {
        'product_id': widget.productId,
      },
      'theme': {
        'color': '#0000FF',
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
                onPressed: () {
                  if (selectedPayment == 2) {
                    ScaffoldMessenger.of(context)
                        .showSnackBar(
                      const SnackBar(
                        content:
                        Text("Order Placed"),
                      ),
                    );

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