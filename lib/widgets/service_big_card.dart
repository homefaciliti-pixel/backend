import 'package:flutter/material.dart';

import '../utils/app_colors.dart';

class ServiceBigCard extends StatelessWidget {
  final String title;
  final String price;
  final String image;

  const ServiceBigCard({
    super.key,
    required this.title,
    required this.price,
    required this.image,
  });

  @override
  Widget build(BuildContext context) {
    return
      Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 8,
            offset: Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          ///  IMAGE WITH DARK OVERLAY
          // ClipRRect(
          //   borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
          //   child: Stack(
          //     children: [
          //       SizedBox(
          //         height: 140, //  exact same look
          //         width: double.infinity,
          //         child: Image.network(
          //           image,
          //           fit: BoxFit.cover,
          //           errorBuilder: (context, error, stackTrace) {
          //             return Container(
          //               color: Colors.grey.shade300,
          //             );
          //           },
          //         ),
          //       ),
          //
          //       ///  DARK OVERLAY
          //       Container(
          //         height: 140,
          //         decoration: BoxDecoration(
          //           gradient: LinearGradient(
          //             colors: [
          //               Colors.transparent,
          //               Colors.black.withOpacity(0.7),
          //             ],
          //             begin: Alignment.topCenter,
          //             end: Alignment.bottomCenter,
          //           ),
          //         ),
          //       ),
          //
          //       // /// BIG TITLE (LEFT BOTTOM)
          //       // Positioned(
          //       //   bottom: 10,
          //       //   left: 10,
          //       //   right: 10,
          //       //   child: Text(
          //       //     title,
          //       //     style: TextStyle(
          //       //       color: Colors.white,
          //       //       fontSize: 16, //
          //       //       fontWeight: FontWeight.bold,
          //       //     ),
          //       //   ),
          //       // ),
          //     ],
          //   ),
          // ),
          //
          //                     ///  PRICE
          // Padding(
          //   padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          //   child: Row(
          //     mainAxisAlignment: MainAxisAlignment.spaceBetween,
          //     children: [
          //
          //                            /// PRICE
          //       Text(
          //         price,
          //         style: TextStyle(
          //           fontWeight: FontWeight.bold,
          //           fontSize: 15,
          //         ),
          //       ),
          //
          //
          //     ],
          //   ),
          // ),
          SizedBox(

            height: 145,

            child: ClipRRect(

              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),

              child: Stack(

                children: [

                  /// IMAGE
                  Image.network(

                    image,

                    height: 145,

                    width: double.infinity,

                    fit: BoxFit.cover,

                    /// LOADING
                    loadingBuilder:
                        (context, child, progress) {

                      if (progress == null) {
                        return child;
                      }

                      return Container(

                        color: Colors.grey.shade200,

                        child: const Center(

                          child:
                          CircularProgressIndicator(
                            strokeWidth: 2,
                          ),
                        ),
                      );
                    },

                    /// ERROR
                    errorBuilder:
                        (context, error, stackTrace) {

                      return Container(

                        width: double.infinity,

                        color: Colors.grey.shade100,

                        child: Column(

                          mainAxisAlignment:
                          MainAxisAlignment.center,

                          children: [

                            Icon(

                              Icons
                                  .image_not_supported_outlined,

                              size: 36,

                              color:
                              Colors.grey.shade500,
                            ),

                            const SizedBox(height: 8),

                            Text(

                              "Image unavailable",

                              style: TextStyle(

                                fontSize: 12,

                                color:
                                Colors.grey.shade600,

                                fontWeight:
                                FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),

                  /// DARK OVERLAY
                  Container(
                    height: 145,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withOpacity(0.25),
                        ],
                      ),
                    ),
                  ),
                  /// DISCOUNT TAG
                  Positioned(
                    top: 4,
                    right: 4,
                    child: Container(
                      padding:const EdgeInsets.symmetric(
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
          Padding(

            padding: const EdgeInsets.all(4),

            child: Column(

              crossAxisAlignment:
              CrossAxisAlignment.start,

              children: [
                SizedBox(height: 8,),
                /// TITLE
                Text(

                  title,

                  maxLines: 1,

                  overflow:
                  TextOverflow.ellipsis,

                  style: const TextStyle(

                    fontSize: 14,

                    fontWeight:
                    FontWeight.w600,
                  ),
                ),

                const SizedBox(height: 6),

                /// RATING ROW
                Row(

                  children: [

                    Icon(
                      Icons.star,
                      size: 16,
                      color: Colors.orange,
                    ),

                    const SizedBox(width: 4),

                    const Text(

                      "4.8",

                      style: TextStyle(

                        fontSize: 13,

                        fontWeight:
                        FontWeight.w600,
                      ),
                    ),

                    const SizedBox(width: 4),

                    Text(

                      "(120 Reviews)",

                      style: TextStyle(

                        fontSize: 12,

                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                /// PRICE ROW
                Row(
                  children: [
                    Text(
                      "₹$price",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight:
                        FontWeight.bold,
                        color: AppColors.black,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      "₹${((double.tryParse(
                        price.toString().replaceAll("₹", "").trim(),
                      ) ?? 0) + 100).toInt()}",
                      style: const TextStyle(
                        fontSize: 13,
                        color: Colors.grey,
                        decoration:
                        TextDecoration.lineThrough,
                      ),
                    ),
                    const Spacer(),
                  ],
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}