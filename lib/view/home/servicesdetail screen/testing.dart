import 'package:flutter/material.dart';

import '../../../utils/app_colors.dart';
class CheckoutScreenDemo extends StatefulWidget {
  const CheckoutScreenDemo({super.key});
  @override
  State<CheckoutScreenDemo> createState() =>
      _CheckoutScreenState();
}
class _CheckoutScreenState
    extends State<CheckoutScreenDemo> {

  int selectedPayment = 0;

  double servicePrice = 799;
  double platformFee = 49;
  double gst = 18;

  @override
  Widget build(BuildContext context) {

    double total =
        servicePrice + platformFee + gst;

    return Scaffold(

      backgroundColor: const Color(0xffF5F7FB),

      appBar: AppBar(

        elevation: 0,

        backgroundColor: Colors.white,

        centerTitle: true,

        title: const Text(

          "Checkout",

          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.bold,
          ),
        ),

        leading: IconButton(

          icon: const Icon(
            Icons.arrow_back_ios_new,
            color: Colors.black,
          ),

          onPressed: () {
            Navigator.pop(context);
          },
        ),
      ),

      /// BOTTOM PAYMENT BUTTON
      bottomNavigationBar: Container(

        padding: const EdgeInsets.all(16),

        decoration: const BoxDecoration(

          color: Colors.white,

          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(25),
            topRight: Radius.circular(25),
          ),

          boxShadow: [

            BoxShadow(
              color: Colors.black12,
              blurRadius: 10,
            ),
          ],
        ),

        child: SafeArea(

          child: SizedBox(

            height: 56,

            child: Container(

              decoration: BoxDecoration(

                gradient: LinearGradient(
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

                  /// PAYMENT API
                },

                style:
                ElevatedButton.styleFrom(

                  backgroundColor:
                  Colors.transparent,

                  shadowColor:
                  Colors.transparent,
                ),

                child: Row(

                  mainAxisAlignment:
                  MainAxisAlignment.center,

                  children: [

                    const Icon(
                      Icons.lock,
                      color: Colors.white,
                    ),

                    const SizedBox(width: 10),

                    Text(

                      "Pay ₹${total.toStringAsFixed(0)}",

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

      body: SingleChildScrollView(

        padding: const EdgeInsets.all(16),

        child: Column(

          crossAxisAlignment:
          CrossAxisAlignment.start,

          children: [

            /// SERVICE CARD
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

                  /// IMAGE
                  ClipRRect(

                    borderRadius:
                    BorderRadius.circular(16),

                    child: Image.network(

                      "https://images.unsplash.com/photo-1581578731548-c64695cc6952",

                      height: 95,
                      width: 95,

                      fit: BoxFit.cover,
                    ),
                  ),

                  const SizedBox(width: 14),

                  /// DETAILS
                  Expanded(

                    child: Column(

                      crossAxisAlignment:
                      CrossAxisAlignment.start,

                      children: [

                        const Text(

                          "Home Deep Cleaning",

                          style: TextStyle(
                            fontSize: 18,
                            fontWeight:
                            FontWeight.bold,
                          ),
                        ),

                        const SizedBox(height: 6),

                        const Text(

                          "Professional cleaning service for your home",

                          style: TextStyle(
                            color: Colors.grey,
                            height: 1.4,
                          ),
                        ),

                        const SizedBox(height: 12),

                        Row(

                          children: [

                            Container(

                              padding:
                              const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 5,
                              ),

                              decoration: BoxDecoration(

                                color: Colors.orange
                                    .withOpacity(0.12),

                                borderRadius:
                                BorderRadius.circular(
                                    20),
                              ),

                              child: const Row(

                                children: [

                                  Icon(
                                    Icons.star,
                                    color: Colors.orange,
                                    size: 16,
                                  ),

                                  SizedBox(width: 4),

                                  Text(
                                    "4.8",
                                    style: TextStyle(
                                      fontWeight:
                                      FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            const Spacer(),

                            Text(

                              "₹799",

                              style: TextStyle(

                                fontSize: 22,

                                fontWeight:
                                FontWeight.bold,

                                color:
                                AppColors.primaryButton,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            /// ADDRESS CARD
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

                  Row(

                    children: [

                      Icon(
                        Icons.location_on,
                        color:
                        AppColors.primaryButton,
                      ),

                      const SizedBox(width: 8),

                      const Text(

                        "Service Address",

                        style: TextStyle(
                          fontSize: 18,
                          fontWeight:
                          FontWeight.bold,
                        ),
                      ),

                      const Spacer(),

                      TextButton(

                        onPressed: () {},

                        child: Text(

                          "Change",

                          style: TextStyle(
                            color:
                            AppColors.primaryButton,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 10),

                  const Text(

                    "Home",

                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),

                  const SizedBox(height: 6),

                  const Text(

                    "221B Baker Street,\nJaipur, Rajasthan - 302001",

                    style: TextStyle(
                      color: Colors.grey,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            /// PAYMENT SUMMARY
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

                    "Payment Summary",

                    style: TextStyle(
                      fontSize: 18,
                      fontWeight:
                      FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 20),

                  buildPriceRow(
                    "Service Price",
                    "₹799",
                  ),

                  const SizedBox(height: 14),

                  buildPriceRow(
                    "Platform Fee",
                    "₹49",
                  ),

                  const SizedBox(height: 14),

                  buildPriceRow(
                    "GST & Taxes",
                    "₹18",
                  ),

                  const Padding(

                    padding:
                    EdgeInsets.symmetric(
                      vertical: 16,
                    ),

                    child: Divider(),
                  ),

                  buildPriceRow(
                    "Total Amount",
                    "₹${total.toStringAsFixed(0)}",
                    isTotal: true,
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
                      fontSize: 18,
                      fontWeight:
                      FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 16),

                  paymentTile(
                    index: 0,
                    icon:
                    Icons.account_balance_wallet,
                    title: "UPI / Wallet",
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

            const SizedBox(height: 120),
          ],
        ),
      ),
    );
  }

  /// PRICE ROW
  Widget buildPriceRow(
      String title,
      String value, {
        bool isTotal = false,
      }) {

    return Row(

      children: [

        Text(

          title,

          style: TextStyle(

            fontSize: isTotal ? 18 : 15,

            fontWeight:
            isTotal
                ? FontWeight.bold
                : FontWeight.w500,
          ),
        ),

        const Spacer(),

        Text(

          value,

          style: TextStyle(

            fontSize: isTotal ? 20 : 15,

            fontWeight:
            isTotal
                ? FontWeight.bold
                : FontWeight.w700,

            color:
            isTotal
                ? AppColors.primaryButton
                : Colors.black,
          ),
        ),
      ],
    );
  }

  /// PAYMENT TILE
  Widget paymentTile({

    required int index,
    required IconData icon,
    required String title,
  }) {

    bool isSelected =
        selectedPayment == index;

    return GestureDetector(

      onTap: () {

        setState(() {
          selectedPayment = index;
        });
      },

      child: Container(

        margin:
        const EdgeInsets.only(bottom: 14),

        padding: const EdgeInsets.all(15),

        decoration: BoxDecoration(

          border: Border.all(

            color:
            isSelected
                ? AppColors.primaryButton
                : Colors.grey.shade300,

            width: 1.5,
          ),

          borderRadius:
          BorderRadius.circular(16),

          color:
          isSelected
              ? AppColors.primaryButton
              .withOpacity(0.08)
              : Colors.white,
        ),

        child: Row(

          children: [

            Container(

              padding: const EdgeInsets.all(10),

              decoration: BoxDecoration(

                color: AppColors.primaryButton
                    .withOpacity(0.12),

                borderRadius:
                BorderRadius.circular(12),
              ),

              child: Icon(
                icon,
                color:
                AppColors.primaryButton,
              ),
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

            Icon(

              isSelected
                  ? Icons.radio_button_checked
                  : Icons.radio_button_off,

              color:
              isSelected
                  ? AppColors.primaryButton
                  : Colors.grey,
            ),
          ],
        ),
      ),
    );
  }
}