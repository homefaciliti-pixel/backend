import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shimmer/shimmer.dart';
import 'package:userapp/view/address_screen/address_screen.dart';
import 'package:userapp/viewmodel/auth_viewmodel.dart';
import '../../../services/product/product_details_auth.dart';
import '../../../viewmodel/service_viewmodel.dart';
class ServiceDetailScreen extends StatefulWidget {
  final String serviceTitle;
  const ServiceDetailScreen({
    super.key,
    required this.serviceTitle,
  });
  @override
  State<ServiceDetailScreen> createState() =>
      _ServiceDetailScreenState();
}
/// SERVICE API
Future<void> bookingApi({
  required productId,

  required BuildContext context,
  required ServiceViewModel vm,
}) async {

  if (vm.selectedDate == null ||
      vm.selectedSlot == null) {

    ScaffoldMessenger.of(context).showSnackBar(

      const SnackBar(
        content: Text("Select date & slot"),
      ),
    );

    return;
  }

  try {

    final prefs =
    await SharedPreferences.getInstance();

    final token = prefs.getString("token");

    final body = {

      "productId": productId,
      //service.title,

      "date":
      vm.selectedDate!
          .toString()
          .split(" ")[0],

      "timeSlot": vm.selectedSlot,
    };

    final response = await http.post(

      Uri.parse(
        "https://backend-1-ux3b.onrender.com/api/bookings",
      ),

      headers: {

        "Content-Type": "application/json",

        "Authorization": "Bearer $token",
      },

      body: jsonEncode(body),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200 &&
        data["success"] == true) {

      ScaffoldMessenger.of(context).showSnackBar(

        SnackBar(
          content: Text(data["message"]),
        ),
      );

      Navigator.pop(context);

      Navigator.pushReplacement(

        context,

        MaterialPageRoute(
          builder: (_) => AddressScreen(),
        ),
      );

    } else if (response.statusCode == 401) {
      // Session expired / token invalid - force re-login
      final prefs = await SharedPreferences.getInstance();
      await prefs.clear();
      if (context.mounted) {
        final authVM = Provider.of<AuthViewmodel>(context, listen: false);
        await authVM.logout();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Session expired. Please login again."),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 3),
          ),
        );
        await Future.delayed(const Duration(seconds: 1));
        if (context.mounted) {
          Navigator.pushNamedAndRemoveUntil(
            context,
            "/login",
            (route) => false,
          );
        }
      }
    } else {

      ScaffoldMessenger.of(context).showSnackBar(

        SnackBar(
          content: Text(
            data["error"] ??
                data["message"] ??
                "Booking failed",
          ),
        ),
      );
    }

  } catch (e) {

    ScaffoldMessenger.of(context).showSnackBar(

      SnackBar(
        content: Text(e.toString()),
      ),
    );
  }
}
class _ServiceDetailScreenState extends State<ServiceDetailScreen> {

  @override
  void initState() {
    super.initState();

    Future.microtask(() {

      Provider.of<ProductDetailViewModel>(
        context,
        listen: false,
      ).loadProductDetail(widget.serviceTitle);

    });
  }
  @override
  Widget build(BuildContext context) {

    final vm = Provider.of<ProductDetailViewModel>(context);

    final service = vm.product;

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(

        elevation: 0,

        backgroundColor: Colors.white,

        centerTitle: true,

        title:  Text(

          widget.serviceTitle,

          style: TextStyle(
            color: Colors.black,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),

        leading: IconButton(

          icon: const Icon(
            Icons.arrow_back_ios_new,
            color: Colors.black,
            size: 20,
            fontWeight: FontWeight(50),
          ),

          onPressed: () {
            Navigator.pop(context);
          },
        ),
      ),
      body: vm.loading

          ? SingleChildScrollView(

        padding:
        const EdgeInsets.all(16),

        child: Column(

          crossAxisAlignment:
          CrossAxisAlignment.start,

          children: [

            /// IMAGE SHIMMER
            Shimmer.fromColors(

              baseColor:
              Colors.grey.shade300,

              highlightColor:
              Colors.grey.shade100,

              child: Container(

                height: 260,
                width: double.infinity,

                decoration: BoxDecoration(

                  color: Colors.white,

                  borderRadius:
                  BorderRadius.circular(12),
                ),
              ),
            ),

            const SizedBox(height: 20),

            /// TITLE + SHARE
            Row(

              children: [

                Expanded(

                  child: Shimmer.fromColors(

                    baseColor:
                    Colors.grey.shade300,

                    highlightColor:
                    Colors.grey.shade100,

                    child: Container(

                      height: 24,

                      decoration: BoxDecoration(

                        color: Colors.white,

                        borderRadius:
                        BorderRadius.circular(
                            8),
                      ),
                    ),
                  ),
                ),

                const SizedBox(width: 10),

                Shimmer.fromColors(

                  baseColor:
                  Colors.grey.shade300,

                  highlightColor:
                  Colors.grey.shade100,

                  child: Container(

                    height: 45,
                    width: 45,

                    decoration: BoxDecoration(

                      color: Colors.white,

                      borderRadius:
                      BorderRadius.circular(
                          12),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            /// PRICE
            Shimmer.fromColors(

              baseColor:
              Colors.grey.shade300,

              highlightColor:
              Colors.grey.shade100,

              child: Container(

                height: 22,
                width: 120,

                decoration: BoxDecoration(

                  color: Colors.white,

                  borderRadius:
                  BorderRadius.circular(8),
                ),
              ),
            ),

            const SizedBox(height: 20),

            /// RATING
            Shimmer.fromColors(

              baseColor:
              Colors.grey.shade300,

              highlightColor:
              Colors.grey.shade100,

              child: Container(

                height: 18,
                width: 180,

                decoration: BoxDecoration(

                  color: Colors.white,

                  borderRadius:
                  BorderRadius.circular(8),
                ),
              ),
            ),

            const SizedBox(height: 20),

            /// CHIP ROW
            Row(

              children: [

                Expanded(

                  child: Shimmer.fromColors(

                    baseColor:
                    Colors.grey.shade300,

                    highlightColor:
                    Colors.grey.shade100,

                    child: Container(

                      height: 35,

                      decoration: BoxDecoration(

                        color: Colors.white,

                        borderRadius:
                        BorderRadius.circular(
                            30),
                      ),
                    ),
                  ),
                ),

                const SizedBox(width: 12),

                Expanded(

                  child: Shimmer.fromColors(

                    baseColor:
                    Colors.grey.shade300,

                    highlightColor:
                    Colors.grey.shade100,

                    child: Container(

                      height: 35,

                      decoration: BoxDecoration(

                        color: Colors.white,

                        borderRadius:
                        BorderRadius.circular(
                            30),
                      ),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 30),

            /// DESCRIPTION BOX
            Shimmer.fromColors(

              baseColor:
              Colors.grey.shade300,

              highlightColor:
              Colors.grey.shade100,

              child: Container(

                height: 180,
                width: double.infinity,

                decoration: BoxDecoration(

                  color: Colors.white,

                  borderRadius:
                  BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      )


          : service == null

          ? const Center(
        child: Text("No Service Found"),
      )

          :Stack(
        children: [

          SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 100),

            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,

              children: [

                /// IMAGE
                SizedBox(

                  height: 260,
                  width: double.infinity,

                  child: ClipRRect(

                    borderRadius:
                    BorderRadius.circular(1),

                    child: Stack(

                      children: [

                        /// IMAGE
                        Image.network(

                          service.image,

                          height: 260,
                          width: double.infinity,

                          fit: BoxFit.cover,

                          loadingBuilder:
                              (context, child, progress) {

                            if (progress == null) {
                              return child;
                            }

                            return const Center(
                              child:
                              CircularProgressIndicator(),
                            );
                          },

                          errorBuilder:
                              (context, error, stackTrace) {

                            return Container(

                              color: Colors.grey.shade300,

                              child: const Center(

                                child: Icon(
                                  Icons.image_not_supported,
                                  size: 40,
                                ),
                              ),
                            );
                          },
                        ),

                        /// DARK OVERLAY
                        Container(

                          height: 260,

                          decoration: BoxDecoration(

                            gradient: LinearGradient(

                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,

                              colors: [

                                Colors.transparent,

                                Colors.black.withOpacity(0.15),
                              ],
                            ),
                          ),
                        ),

                        /// DISCOUNT TAG
                        Positioned(

                          top: 10,
                          right: 10,

                          child: Container(

                            padding:
                            const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 5,
                            ),

                            decoration: BoxDecoration(

                              color: Colors.green,

                              borderRadius:
                              BorderRadius.circular(20),

                              boxShadow: [

                                BoxShadow(

                                  color:
                                  Colors.black.withOpacity(0.15),

                                  blurRadius: 6,

                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),

                            child: const Text(

                              "20% OFF",

                              style: TextStyle(

                                color: Colors.white,

                                fontSize: 11,

                                fontWeight:
                                FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),
                /// TITLE + PRICE
                Padding(
                  padding:
                  const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment:
                    CrossAxisAlignment.start,

                    children: [
                      Row(

                        children: [

                          /// TITLE
                          Expanded(

                            child: Text(

                              service.title,

                              maxLines: 1,

                              overflow:
                              TextOverflow.ellipsis,

                              style: const TextStyle(

                                fontSize: 20,

                                fontWeight:
                                FontWeight.bold,
                              ),
                            ),
                          ),

                          const SizedBox(width: 8),

                          /// SHARE BUTTON
                          Container(

                            decoration: BoxDecoration(

                              color: Colors.grey.shade100,

                              borderRadius:
                              BorderRadius.circular(12),
                            ),

                            child: IconButton(

                              onPressed: () async {

                                final shareText = """

${service.title}

Price: ₹${service.price}

Book now on HomeFaciliti

https://homefaciliti.com
""";

                                Share.share(shareText);
                              },

                              icon: const Icon(
                                Icons.share,
                                size: 22,
                              ),
                            ),
                          ),
                        ],
                      ),
                      // Text(
                      //   service.title,
                      //
                      //   style: const TextStyle(
                      //     fontSize: 20,
                      //     fontWeight: FontWeight.bold,
                      //   ),
                      // ),

                      const SizedBox(height: 10),

                      Row(

                        children: [

                          /// MAIN PRICE
                          Text(

                            "₹ ${service.price}",

                            style: const TextStyle(

                              fontSize: 20,

                              fontWeight:
                              FontWeight.w700,

                              color: Colors.green,
                            ),
                          ),

                          const SizedBox(width: 10),

                          /// CUT PRICE
                          Text(

                            "₹ ${((double.tryParse(
                              service.price
                                  .toString()
                                  .replaceAll("₹", "")
                                  .trim(),
                            ) ?? 0) + 100).toInt()}",

                            style: const TextStyle(

                              fontSize: 15,

                              color: Colors.grey,

                              decoration:
                              TextDecoration.lineThrough,

                              decorationThickness: 2,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      /// RATING
                      Row(
                        children: [

                          const Icon(
                            Icons.star,
                            color: Colors.orange,
                            size: 20,
                          ),

                          const SizedBox(width: 5),

                          Text(
                            "${service.rating}",

                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                            ),
                          ),

                          const SizedBox(width: 6),

                          Text(
                            "(${service.reviewsCount} reviews)",

                            style: TextStyle(
                              color: Colors.grey.shade700,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      /// CATEGORY + DURATION
                      Row(
                        children: [

                          Chip(
                            backgroundColor: Colors.white,
                            label: Text(service.category),
                          ),

                          const SizedBox(width: 10),

                          Chip(
                            backgroundColor: Colors.white,
                            avatar: const Icon(
                              Icons.access_time,
                              size: 18,
                            ),
                            label: Text(service.duration),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                /// DESCRIPTION
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  color: Colors.white,

                  child: Column(
                    crossAxisAlignment:
                    CrossAxisAlignment.start,

                    children: [

                      const Text(
                        "Description",

                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 12),

                      Text(
                        service.description,

                        style: const TextStyle(
                          fontSize: 15,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 14),

                /// HIGHLIGHTS
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  color: Colors.white,

                  child: Column(
                    crossAxisAlignment:
                    CrossAxisAlignment.start,

                    children: [

                      const Text(
                        "Service Highlights",

                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 12),
                      ...service.highlights.map(
                            (item) => Padding(
                          padding:
                          const EdgeInsets.only(bottom: 10),

                          child: Row(
                            crossAxisAlignment:
                            CrossAxisAlignment.start,

                            children: [

                              const Icon(
                                Icons.check_circle,
                                color: Colors.green,
                                size: 20,
                              ),

                              const SizedBox(width: 10),

                              Expanded(
                                child: Text(
                                  item,

                                  style: const TextStyle(
                                    fontSize: 14,
                                    height: 1.4,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 30),
              ],
            ),
          ),

          /// BOOK BUTTON
          Positioned(
            left: 16,
            right: 16,
            bottom: 10,

            child: SafeArea(
              child: Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Colors.blue, Colors.green],
                  ),

                  borderRadius: BorderRadius.circular(18),
                ),

                child: ElevatedButton(
                  onPressed: () {
                    showBookingBottomSheet(context,service.productId);
                  },

                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    padding:
                    const EdgeInsets.symmetric(vertical: 18),
                  ),

                  child: const Text(
                    "Book Now",

                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
  void showBookingBottomSheet(BuildContext context, String productId) {
    //
    // final vm =
    // Provider.of<ServiceViewModel>(
    //   context,
    //   listen: false,
    // );

    showModalBottomSheet(

      context: context,

      isScrollControlled: true,

      backgroundColor: Colors.white,

      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(20),
        ),
      ),

      builder: (_) {
        final vm = Provider.of<ServiceViewModel>(context, listen: false);
        /// ALL SLOTS
        final List<String> allSlots = [

          "09 AM - 10 AM",
          "10 AM - 11 AM",
          "11 AM - 12 PM",
          "12 PM - 01 PM",
          "01 PM - 02 PM",
          "02 PM - 03 PM",
          "03 PM - 04 PM",
          "04 PM - 05 PM",
          "05 PM - 06 PM",
          "06 PM - 07 PM",
          "07 PM - 08 PM",
        ];

        /// AVAILABLE SLOTS
        List<String> availableSlots = [];

        if (vm.selectedDate != null) {

          final now = DateTime.now();

          final selected = vm.selectedDate!;

          /// CHECK TODAY
          final isToday =

              selected.year == now.year &&
                  selected.month == now.month &&
                  selected.day == now.day;

          if (isToday) {

            availableSlots = allSlots.where((slot) {

              /// GET SLOT START HOUR
              final startTime =
              slot.split(" - ")[0];

              final hour =
              int.parse(startTime.split(" ")[0]);

              final period =
              startTime.split(" ")[1];

              int slotHour = hour;

              /// CONVERT TO 24 HOUR
              if (period == "PM" && hour != 12) {
                slotHour += 12;
              }

              if (period == "AM" && hour == 12) {
                slotHour = 0;
              }

              /// ONLY FUTURE SLOT
              return slotHour > now.hour;

            }).toList();

          } else {

            /// FUTURE DATE
            availableSlots = allSlots;
          }

        } else {

          availableSlots = allSlots;
        }
        return StatefulBuilder(

          builder: (context, setState) {

            return Padding(

              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
                left: 16,
                right: 16,
                top: 16,
              ),

              child: Column(

                mainAxisSize: MainAxisSize.min,

                crossAxisAlignment: CrossAxisAlignment.start,

                children: [

                  /// TITLE
                  const Text(
                    "Select Date",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 12),

                  /// DATE PICKER
                  GestureDetector(

                    onTap: () async {

                      final pickedDate =
                      await showDatePicker(

                        context: context,

                        initialDate: DateTime.now(),

                        firstDate: DateTime.now(),

                        lastDate: DateTime(2030),
                      );

                      if (pickedDate != null) {

                        vm.setDtae(pickedDate);

                        setState(() {});
                      }
                    },

                    child: Container(

                      padding: const EdgeInsets.all(14),

                      width: double.infinity,

                      decoration: BoxDecoration(

                        border: Border.all(
                          color: Colors.grey.shade400,
                        ),

                        borderRadius:
                        BorderRadius.circular(12),
                      ),

                      child: Text(

                        vm.selectedDate == null
                            ? "Choose Date"
                            : vm.selectedDate!
                            .toString()
                            .split(" ")[0],

                        style: const TextStyle(
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  /// SLOT TITLE
                  const Text(
                    "Select Slot",

                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 12),

                  /// SLOT CHIPS
                  // Wrap(
                  //
                  //   spacing: 6,
                  //   runSpacing: 6,
                  //   children: [
                  //     "09 AM - 10 AM",
                  //     "10 AM - 11 AM",
                  //     "11 AM - 12 PM",
                  //     "12 PM - 01 PM",
                  //     "01 PM - 02 PM",
                  //     "02 PM - 03 PM",
                  //     "03 PM - 04 PM",
                  //     "04 PM - 05 PM",
                  //     "05 PM - 06 PM",
                  //     "06 PM - 07 PM",
                  //     "07 PM - 08 PM"
                  //   ].map((slot) {
                  //
                  //     final isSelected =
                  //         vm.selectedSlot == slot;
                  //
                  //     return ChoiceChip(
                  //
                  //       label: Text(slot),
                  //
                  //       selected: isSelected,
                  //
                  //       selectedColor:
                  //       Colors.green.shade100,
                  //
                  //       labelStyle: TextStyle(
                  //
                  //         color: isSelected
                  //             ? Colors.green
                  //             : Colors.black,
                  //       ),
                  //
                  //       onSelected: (_) {
                  //
                  //         vm.setSlot(slot);
                  //
                  //         setState(() {});
                  //       },
                  //     );
                  //
                  //   }).toList(),
                  // ),
                  Wrap(

                    spacing: 6,
                    runSpacing: 6,

                    children: allSlots.map((slot) {

                      final now = DateTime.now();

                      bool isDisabled = false;

                      /// DATE SELECTED ?
                      if (vm.selectedDate != null) {

                        final selectedDate =
                        vm.selectedDate!;

                        /// TODAY CHECK
                        final isToday =

                            selectedDate.year == now.year &&
                                selectedDate.month == now.month &&
                                selectedDate.day == now.day;

                        if (isToday) {

                          /// SLOT START TIME
                          final startTime =
                          slot.split(" - ")[0];

                          final hour =
                          int.parse(startTime.split(" ")[0]);

                          final period =
                          startTime.split(" ")[1];

                          int slotHour = hour;

                          /// 24 HOUR FORMAT
                          if (period == "PM" && hour != 12) {
                            slotHour += 12;
                          }

                          if (period == "AM" && hour == 12) {
                            slotHour = 0;
                          }

                          /// CURRENT TIME SE PAHLE SLOT DISABLE
                          isDisabled = slotHour <= now.hour;
                        }
                      }

                      final isSelected =
                          vm.selectedSlot == slot;

                      return ChoiceChip(

                        label: Text(slot),

                        selected: isSelected,

                        selectedColor:
                        Colors.green.shade100,

                        disabledColor:
                        Colors.grey.shade200,

                        labelStyle: TextStyle(

                          color: isDisabled

                              ? Colors.grey

                              : isSelected
                              ? Colors.green
                              : Colors.black,
                        ),

                        onSelected: isDisabled

                            ? null

                            : (_) {

                          vm.setSlot(slot);

                          setState(() {});
                        },
                      );

                    }).toList(),
                  ),
                  const SizedBox(height: 30),

                  /// CONFIRM BUTTON
                  SafeArea(

                    child: SizedBox(

                      width: double.infinity,

                      child: Container(

                        decoration: BoxDecoration(

                          gradient: const LinearGradient(
                            colors: [
                              Colors.blue,
                              Colors.green,
                            ],
                          ),

                          borderRadius:
                          BorderRadius.circular(14),
                        ),

                        child: ElevatedButton(
                          onPressed: () async {

                            await bookingApi(
                              productId: productId,
                              context: context,
                              vm: vm,
                            );
                          },
                          //
                          // onPressed: () {
                          //
                          //   if (vm.selectedDate == null ||
                          //       vm.selectedSlot == null) {
                          //
                          //     ScaffoldMessenger.of(context)
                          //         .showSnackBar(
                          //
                          //       const SnackBar(
                          //         content: Text(
                          //           "Select date & slot",
                          //         ),
                          //       ),
                          //     );
                          //
                          //     return;
                          //   }
                          //
                          //   Navigator.pop(context);
                          //
                          //   Navigator.pushReplacement(
                          //
                          //     context,
                          //
                          //     MaterialPageRoute(
                          //       builder: (_) =>
                          //           AddressScreen(),
                          //     ),
                          //   );
                          // },

                          style: ElevatedButton.styleFrom(

                            backgroundColor:
                            Colors.transparent,

                            shadowColor:
                            Colors.transparent,

                            padding:
                            const EdgeInsets.symmetric(
                              vertical: 16,
                            ),

                            shape: RoundedRectangleBorder(
                              borderRadius:
                              BorderRadius.circular(14),
                            ),
                          ),
                          child: const Text(
                            "Select Address",
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 15),
                ],
              ),
            );
          },
        );
      },
    );
  }
}


