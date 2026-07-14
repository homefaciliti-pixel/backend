import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

 import '../../../services/checkout_services_auth/checkout_viewmodel.dart';
import '../../../utils/app_colors.dart';
import '../../paymentScreen/payment_screen.dart';
import '../payment/payment_screen.dart';
// import '../../utils/app_colors.dart';
// import '../../viewmodel/checkout_viewmodel.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() =>
      _CheckoutScreenState();
}

class _CheckoutScreenState
    extends State<CheckoutScreen> {

  int selectedPayment = 0;

  @override
  void initState() {
    super.initState();

    loadCheckout();
  }

  Future<void> loadCheckout() async {

    final prefs =
    await SharedPreferences.getInstance();

    String token =
        prefs.getString("token") ?? "";

    String phone = prefs.getString("phone") ?? "";

    // Read the service that was booked in ServiceDetailScreen.
    // Passing it to the API prevents the server from falling back
    // to the default "Tap Repair" draft when the user navigates
    // back to this screen after going to the payment page.
    String productId =
        prefs.getString("lastBookedProductId") ?? "";

    if (!mounted) return;

    Provider.of<CheckoutViewModel>(
      context,
      listen: false,
    ).fetchCheckout(
      phone: phone,
      token: token,
      productId: productId.isNotEmpty ? productId : null,
    );
  }

  @override
  Widget build(BuildContext context) {

    final vm =
    Provider.of<CheckoutViewModel>(context);

    final data = vm.checkoutModel;

    if (vm.loading) {

      return const Scaffold(

        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (data == null) {

      return const Scaffold(

        body: Center(
          child: Text("No Data Found"),
        ),
      );
    }

    return Scaffold(

      backgroundColor:
      //Colors.white,
      const Color(0xffF5F7FB),

      appBar: AppBar(

        backgroundColor: Colors.white,

        elevation: 0,

        centerTitle: true,

        title: const Text(

          "Checkout",

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
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => PaymentScreenNew(
                        paymentOrderId: data.razorpayOrderId ?? "",
                        userPhoneNumber: data.userId,
                        orderId: data.orderId,
                        productId: data.product.productId,
                        title: data.product.serviceName,
                        amount: data.payment.amountPaid.toString(),
                      ),
                    ),
                  );
                  /// PAYMENT API HERE
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

                      "Pay ₹${data.payment.amountPaid}",

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

                      data.product.image.isNotEmpty
                          ? data.product.image
                          : "https://images.unsplash.com/photo-1581578731548-c64695cc6952",

                      height: 95,
                      width: 95,

                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Image.network(
                          "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
                          height: 95,
                          width: 95,
                          fit: BoxFit.cover,
                        );
                      },
                    ),
                  ),

                  const SizedBox(width: 14),

                  /// DETAILS
                  Expanded(

                    child: Column(

                      crossAxisAlignment:
                      CrossAxisAlignment.start,

                      children: [

                        Text(

                          data.product.serviceName,

                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight:
                            FontWeight.bold,
                          ),
                        ),

                        const SizedBox(height: 6),

                        Text(

                          data.product.description,

                          style: const TextStyle(
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

                              "₹${data.product.price}",

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

            /// DATE & SLOT SECTION
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

                    "Booking Details",

                    style: TextStyle(
                      fontSize: 16,
                      fontWeight:
                      FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 18),

                  Row(

                    children: [

                      Container(

                        padding: const EdgeInsets.all(5),

                        decoration: BoxDecoration(

                          color: AppColors.primaryButton
                              .withOpacity(0.10),

                          borderRadius:
                          BorderRadius.circular(14),
                        ),

                        child: Icon(

                          Icons.calendar_month,

                          color:
                          AppColors.primaryButton,
                        ),
                      ),

                      const SizedBox(width: 14),

                      Expanded(

                        child: Column(

                          crossAxisAlignment:
                          CrossAxisAlignment.start,

                          children: [

                            const Text(

                              "Selected Date",

                              style: TextStyle(
                                color: Colors.grey,
                              ),
                            ),

                            const SizedBox(height: 4),

                            Text(

                              data.product.date,

                              style: const TextStyle(

                                fontSize: 15,

                                fontWeight:
                                FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  Row(

                    children: [

                      Container(

                        padding: const EdgeInsets.all(5),

                        decoration: BoxDecoration(

                          color: Colors.green
                              .withOpacity(0.10),

                          borderRadius:
                          BorderRadius.circular(14),
                        ),

                        child: const Icon(

                          Icons.access_time,

                          color: Colors.green,
                        ),
                      ),

                      const SizedBox(width: 14),

                      Expanded(

                        child: Column(

                          crossAxisAlignment:
                          CrossAxisAlignment.start,

                          children: [

                            const Text(

                              "Time Slot",

                              style: TextStyle(
                                color: Colors.grey,
                              ),
                            ),

                            const SizedBox(height: 4),

                            Text(

                              data.product.timeSlot,

                              style: const TextStyle(

                                fontSize: 15,

                                fontWeight:
                                FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            /// ADDRESS CARD
            Container(

              padding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 14,
              ),

              decoration: BoxDecoration(

                color: Colors.white,

                borderRadius: BorderRadius.circular(16),

                boxShadow: [

                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),

              child: Column(

                crossAxisAlignment: CrossAxisAlignment.start,

                children: [

                  /// HEADER
                  Row(

                    children: [

                      Icon(
                        Icons.location_on,
                        size: 20,
                        color: AppColors.primaryButton,
                      ),

                      const SizedBox(width: 6),

                      const Text(

                        "Service Address",

                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),

                      const Spacer(),

                      Container(

                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),

                        decoration: BoxDecoration(

                          color:
                          AppColors.primaryButton.withOpacity(0.08),

                          borderRadius: BorderRadius.circular(20),
                        ),

                        child: Text(

                          data.address.type,

                          style: TextStyle(
                            color: AppColors.primaryButton,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 14),

                  /// ADDRESS
                  Padding(
                    padding: const EdgeInsets.only(left: 4.0),

                    child: Text(

                      "${capitalize(data.address.name)} , ${capitalize(data.address.altPhoneNumber)}",


                      maxLines: 2,

                      overflow: TextOverflow.ellipsis,

                      style: const TextStyle(
                        fontSize: 15.5,
                        fontWeight: FontWeight.w600,
                        height: 1.4,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(left: 4.0),

                    child: Text(

                      "${capitalize(data.address.houseNo)}, "
                          "${capitalize(data.address.society)}, "
                          "${capitalize(data.address.floor)}",

                      maxLines: 2,

                      overflow: TextOverflow.ellipsis,

                      style: const TextStyle(
                        fontSize: 15.5,
                        fontWeight: FontWeight.w400,
                        height: 1.4,
                      ),
                    ),
                  ),

                  const SizedBox(height: 6),

                  Padding(
                    padding: const EdgeInsets.only(left: 4.0),

                    child: Text(

                      "${capitalize(data.address.landmark)}, "
                          "${capitalize(data.address.locality)}",

                      maxLines: 2,

                      overflow: TextOverflow.ellipsis,

                      style: TextStyle(
                        fontSize: 15.5,
                        color: Colors.grey.shade700,
                        fontWeight: FontWeight.w400,
                        height: 1.4,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),

                  Padding(
                    padding: const EdgeInsets.all(4.0),
                    child: Row(

                      children: [

                        Expanded(

                          child: Text(

                            data.address.city,

                            overflow: TextOverflow.ellipsis,

                            style: TextStyle(
                              fontSize: 15.5,
                              fontWeight: FontWeight.w400,
                              color: Colors.grey.shade700,
                            ),
                          ),
                        ),

                        Text(

                          " ${data.address.pincode}",

                          style: TextStyle(
                            fontSize: 14.5,
                            color: Colors.grey.shade700,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
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
                      fontSize: 16,
                      fontWeight:
                      FontWeight.w700,
                    ),
                  ),

                  const SizedBox(height: 20),

                  buildPriceRow(
                    "Service Price",
                    "₹${data.product.price}",
                  ),

                  const SizedBox(height: 14),

                  buildPriceRow(
                    "Amount Paid",
                    "₹${data.payment.amountPaid}",
                  ),

                  const SizedBox(height: 14),

                  buildPriceRow(
                    "Booking Status",
                    data.bookingStatus,
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
                    "₹${data.payment.amountPaid}",
                    isTotal: true,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),
            //
            // /// PAYMENT METHODS
            // Container(
            //
            //   padding: const EdgeInsets.all(16),
            //
            //   decoration: BoxDecoration(
            //
            //     color: Colors.white,
            //
            //     borderRadius:
            //     BorderRadius.circular(20),
            //
            //     boxShadow: const [
            //
            //       BoxShadow(
            //         color: Colors.black12,
            //         blurRadius: 8,
            //       ),
            //     ],
            //   ),
            //
            //   child: Column(
            //
            //     crossAxisAlignment:
            //     CrossAxisAlignment.start,
            //
            //     children: [
            //
            //       const Text(
            //
            //         "Payment Method",
            //
            //         style: TextStyle(
            //           fontSize: 16,
            //           fontWeight:
            //           FontWeight.bold,
            //         ),
            //       ),
            //
            //       const SizedBox(height: 16),
            //
            //       paymentTile(
            //         index: 0,
            //         icon:
            //         Icons.account_balance_wallet,
            //         title: "UPI / Wallet",
            //       ),
            //
            //       paymentTile(
            //         index: 1,
            //         icon: Icons.credit_card,
            //         title:
            //         "Credit / Debit Card",
            //       ),
            //
            //       paymentTile(
            //         index: 2,
            //         icon: Icons.payments,
            //         title: "Cash on Service",
            //       ),
            //     ],
            //   ),
            // ),

           // const SizedBox(height: 120),
          ],
        ),
      ),
    );
  }
  String capitalize(String text) {

    if (text.isEmpty) return text;

    return text
        .split(" ")
        .map(
          (word) => word.isNotEmpty
          ? word[0].toUpperCase() + word.substring(1)
          : "",
    )
        .join(" ");
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

            fontSize: isTotal ? 16 : 15,

            fontWeight:
            isTotal
                ? FontWeight.bold
                : FontWeight.w400,
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
                : FontWeight.w500,

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
  Widget buildAddressRow({
    required IconData icon,
    required String title,
    required String value,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),

      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,

        children: [

          /// ICON
          Container(
            height: 34,
            width: 34,

            decoration: BoxDecoration(
              color: AppColors.primaryButton.withOpacity(0.08),
              borderRadius: BorderRadius.circular(10),
            ),

            child: Icon(
              icon,
              size: 18,
              color: AppColors.primaryButton,
            ),
          ),

          const SizedBox(width: 12),

          /// TEXT
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,

              children: [

                Text(
                  title,

                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                    fontWeight: FontWeight.w500,
                  ),
                ),

                const SizedBox(height: 2),

                Text(
                  value.isEmpty ? "-" : value,

                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}