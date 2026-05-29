import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:userapp/viewmodel/order_viewmodel.dart';
import 'package:userapp/viewmodel/wallet_viewmodel.dart';
import 'package:userapp/viewmodel/address_viewmodel.dart';
import 'package:userapp/viewmodel/auth_viewmodel.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../model/order_model.dart';
import '../../model/address_model.dart';
import '../../viewmodel/booking_flow_viewmodel.dart';
import '../../viewmodel/service_viewmodel.dart';
import '../booking_map/searching_partner_screen.dart';
import '../../services/api_service.dart';
import 'payment_success_screen.dart';



class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {

  double walletUsed = 0;
  double finalAmount = 0;

  bool useWallet = true; // 🔥 toggle (use wallet ON/OFF)

  String selectedPayment = "Online";

  @override
  Widget build(BuildContext context) {

    final walletVM = Provider.of<WalletViewmodel>(context);

    final vm = Provider.of<ServiceViewModel>(context);
    final service = vm.selectedService;

    double servicePrice = service?.price.toDouble() ?? 0;

    double walletBalance = walletVM.balance;

    /// 🔥 CALCULATION (sirf yaha hota hai, deduct nahi)
    walletUsed = 0;
    finalAmount = servicePrice;

    if (useWallet && walletBalance > 0) {

      if (walletBalance >= servicePrice) {
        walletUsed = servicePrice;
        finalAmount = 0;
      } else {
        walletUsed = walletBalance;
        finalAmount = servicePrice - walletBalance;
      }
    }

    return Scaffold(
      backgroundColor: Colors.grey.shade100,

      appBar: AppBar(
        title: Text("Payment"),
      ),

      body: Column(
        children: [

          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [

                  /// SERVICE CARD
                  Container(
                    padding: EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(color: Colors.black12, blurRadius: 5)
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Service Name: ${service?.title ?? ""}"),
                        SizedBox(height: 8),
                        Text("Price: ₹ $servicePrice"),
                      ],
                    ),
                  ),

                  SizedBox(height: 20),

                  ///  WALLET TOGGLE
                  SwitchListTile(
                    value: useWallet,
                    onChanged: (value) {
                      setState(() {
                        useWallet = value;
                      });
                    },
                    title: Text("Use Wallet"),
                  ),

                  ///  AMOUNT BREAKDOWN
                  Container(
                    padding: EdgeInsets.all(16),
                    color: Colors.green.shade50,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [

                        Text("Service Price: ₹ $servicePrice"),

                        SizedBox(height: 5),

                        Text("Wallet Used: ₹ $walletUsed"),

                        SizedBox(height: 5),

                        Text(
                          "Payable Amount: ₹ $finalAmount",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                  ),

                  SizedBox(height: 20),

                  /// PAYMENT OPTIONS
                  RadioListTile(
                    value: "Online",
                    groupValue: selectedPayment,
                    onChanged: (value) {
                      setState(() => selectedPayment = value.toString());
                    },
                    title: Text("Pay Online"),
                  ),

                  RadioListTile(
                    value: "Cash",
                    groupValue: selectedPayment,
                    onChanged: (value) {
                      setState(() => selectedPayment = value.toString());
                    },
                    title: Text("Cash on Delivery"),
                  ),
                ],
              ),
            ),
          ),

          ///  PAY BUTTON
          Container(
            padding: EdgeInsets.all(16),
            color: Colors.white,
            child: SizedBox(
              width: double.infinity,
              height: 50,
              child: InkWell(
                onTap: () async {

                  final walletVM =
                  Provider.of<WalletViewmodel>(context, listen: false);

                  ///  ACTUAL DEDUCTION YAHI HOGA
                  if (walletUsed > 0) {
                    await walletVM.deductMoney(walletUsed);
                  }

                  final serviceVM =
                  Provider.of<ServiceViewModel>(context, listen: false);

                  final orderVM =
                  Provider.of<OrderViewmodel>(context, listen: false);

                  final addressVM =
                  Provider.of<AddressViewmodel>(context, listen: false);

                  final authVM =
                  Provider.of<AuthViewmodel>(context, listen: false);

                  final service = serviceVM.selectedService;
                  
                  final String dateStr = serviceVM.selectedDate != null
                      ? serviceVM.selectedDate.toString().split(' ')[0]
                      : DateTime.now().toString().split(' ')[0];
                  final String timeSlotStr = serviceVM.selectedSlot ?? "9 AM - 11 AM";

                  final currentAddress = addressVM.address ?? AddressModel(
                    type: "Home",
                    houseNo: "N/A",
                    society: "N/A",
                    floor: "N/A",
                    landmark: "N/A",
                    city: "N/A",
                    locality: "N/A",
                    pincode: "N/A",
                  );

                  /// ORDER CHECKOUT (returns generated order ID)
                  final orderId = await orderVM.checkout(
                    product: OrderModel(
                      serviceName: service?.title ?? "",
                      price: service?.price ?? 0,
                      date: dateStr,
                      status: "Pending",
                      productId: service?.title,
                      description: service?.description,
                      timeSlot: timeSlotStr,
                    ),
                    address: currentAddress,
                    paymentMethod: selectedPayment,
                    amountPaid: walletUsed,
                    userId: authVM.user.phone.isNotEmpty ? authVM.user.phone : "9876543210",
                  );

                  if (orderId == null) {
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Failed to place order. Please try again.")),
                    );
                    return;
                  }

                  if (!context.mounted) return;

                  if (selectedPayment.toLowerCase() != "cash") {
                    // --- ONLINE / RAZORPAY PAYMENT FLOW ---
                    final paymentUrl = Uri.parse("${ApiService.baseUrl}/api/payments/pay/$orderId");
                    
                    try {
                      await launchUrl(paymentUrl, mode: LaunchMode.externalApplication);
                    } catch (e) {
                      debugPrint("Failed to launch payment URL: $e");
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text("Could not open payment page: $e")),
                      );
                    }

                    if (!context.mounted) return;

                    // Show dialog asking user to verify payment once done in browser
                    showDialog(
                      context: context,
                      barrierDismissible: false,
                      builder: (dialogContext) {
                        bool verifying = false;
                        return StatefulBuilder(
                          builder: (context, setDialogState) {
                            return AlertDialog(
                              title: const Text("Payment in Progress"),
                              content: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text("We have opened the secure checkout page in your browser. Please complete the payment there."),
                                  if (verifying) ...[
                                    const SizedBox(height: 20),
                                    const CircularProgressIndicator(),
                                    const SizedBox(height: 10),
                                    const Text("Verifying your payment status...", style: TextStyle(fontSize: 12)),
                                  ]
                                ],
                              ),
                              actions: [
                                TextButton(
                                  onPressed: verifying ? null : () => Navigator.pop(dialogContext),
                                  child: const Text("Cancel"),
                                ),
                                ElevatedButton(
                                  onPressed: verifying ? null : () async {
                                    setDialogState(() => verifying = true);
                                    
                                    bool paymentSuccess = false;
                                    String razorpayMsg = "Payment not verified yet. Please complete the transaction in your browser.";

                                    try {
                                      final verifyRes = await ApiService.get('/api/payments/verify/$orderId');
                                      if (verifyRes != null && verifyRes['success'] == true) {
                                        if (verifyRes['paymentStatus'] == 'captured') {
                                          paymentSuccess = true;
                                          razorpayMsg = verifyRes['message'] ?? "Payment Successful";
                                        }
                                      }
                                    } catch (e) {
                                      debugPrint("Verification call failed: $e");
                                    }

                                    setDialogState(() => verifying = false);

                                    if (paymentSuccess) {
                                      if (!context.mounted) return;
                                      Navigator.pop(dialogContext); // Close payment-in-progress dialog

                                      // Navigate to the full-screen payment confirmation page
                                      final verifyRes2 = await ApiService.get('/api/payments/verify/$orderId');
                                      final paymentId = verifyRes2?['paymentDetails']?['razorpay_payment_id']
                                          ?? verifyRes2?['paymentDetails']?['id']
                                          ?? 'Verified';
                                      final orderData = verifyRes2?['order'] ?? {};

                                      if (!context.mounted) return;
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => PaymentSuccessScreen(
                                            orderId: orderId,
                                            amount: (service?.price ?? 0).toDouble(),
                                            serviceName: service?.title ?? 'Home Service',
                                            paymentId: paymentId.toString(),
                                            date: orderData['date']?.toString() ?? dateStr,
                                            timeSlot: orderData['timeSlot']?.toString() ?? timeSlotStr,
                                          ),
                                        ),
                                      );
                                    } else {
                                      if (!context.mounted) return;
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(content: Text(razorpayMsg)),
                                      );
                                    }
                                  },
                                  child: const Text("Verify Payment"),
                                ),
                              ],
                            );
                          },
                        );
                      },
                    );
                  } else {
                    // --- CASH PAYMENT FLOW ---
                    final bookingVM = Provider.of<BookingFlowViewModel>(context, listen: false);
                    bookingVM.startSearching(orderId);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const SearchingPartnerScreen(),
                      ),
                    );
                  }
                },

                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(30),
                    gradient: LinearGradient(
                      colors: [Colors.blue, Colors.green],
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    "Pay Now",
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          )
        ],
      ),
    );
  }
}