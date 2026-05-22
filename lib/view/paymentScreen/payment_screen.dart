import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:userapp/viewmodel/order_viewmodel.dart';
import 'package:userapp/viewmodel/wallet_viewmodel.dart';
import '../../model/order_model.dart';
import '../../viewmodel/booking_flow_viewmodel.dart';
import '../../viewmodel/service_viewmodel.dart';
import '../booking_map/searching_partner_screen.dart';

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
                onTap: () {

                  final walletVM =
                  Provider.of<WalletViewmodel>(context, listen: false);

                  ///  ACTUAL DEDUCTION YAHI HOGA
                  if (walletUsed > 0) {
                    walletVM.deductMoney(walletUsed);
                  }

                  final serviceVM =
                  Provider.of<ServiceViewModel>(context, listen: false);

                  final orderVM =
                  Provider.of<OrderViewmodel>(context, listen: false);

                  final service = serviceVM.selectedService;

                  /// ORDER SAVE
                  orderVM.addOrder(
                    OrderModel(
                      serviceName: service?.title ?? "",
                      price: service?.price ?? 0,
                      date: DateTime.now().toString(),
                      status: "Pending",
                    ),
                  );

                  /// SUCCESS POPUP
                  showDialog(
                    context: context,
                    builder: (_) => AlertDialog(
                      title: Text("Success"),
                      content: Text("Payment Successful 🎉"),
                      actions: [
                        TextButton(
                          onPressed: () {
                            Navigator.pop(context); // dialog close

                            final bookingVM =
                            Provider.of<BookingFlowViewModel>(context, listen: false);

                            bookingVM.startSearching();

                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const SearchingPartnerScreen(),
                              ),
                            );
                          },
                          child: Text("OK"),
                        ) 
                      ],
                    ),
                  );
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