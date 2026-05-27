import 'package:flutter/material.dart';
import '../model/service_model.dart';

class ServiceBigCard extends StatelessWidget {
  final ServiceModel service;

  const ServiceBigCard({
    super.key,
    required this.service,
  });

  @override
  Widget build(BuildContext context) {
    final String imagePath = (service.image != null && service.image!.isNotEmpty)
        ? service.image!
        : "https://via.placeholder.com/150";

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 8,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          ///  IMAGE WITH DARK OVERLAY & DISCOUNT BADGE
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Stack(
              children: [
                SizedBox(
                  height: 130, // Adjusted slightly to allow extra space for bottom text
                  width: double.infinity,
                  child: imagePath.startsWith('http')
                      ? Image.network(
                          imagePath,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              color: Colors.grey.shade300,
                              child: const Icon(Icons.image, size: 40, color: Colors.grey),
                            );
                          },
                        )
                      : Image.asset(
                          imagePath,
                          fit: BoxFit.cover,
                        ),
                ),

                ///  DARK OVERLAY
                Container(
                  height: 130,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.transparent,
                        Colors.black.withOpacity(0.6),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                ),

                /// BIG TITLE (LEFT BOTTOM)
                Positioned(
                  bottom: 10,
                  left: 10,
                  right: 10,
                  child: Text(
                    service.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),

                /// DISCOUNT BADGE OVERLAY (TOP LEFT)
                if (service.discount != null && service.discount! > 0)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.orange.shade700, Colors.red.shade700],
                        ),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        "${service.discount}% OFF",
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          ///  RATINGS & PRICE INFO
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                
                // Star Rating row
                Row(
                  children: [
                    const Icon(Icons.star, color: Colors.amber, size: 12),
                    const SizedBox(width: 2),
                    Text(
                      "${service.rating ?? 4.8}",
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                        color: Colors.black80,
                      ),
                    ),
                    const SizedBox(width: 2),
                    Text(
                      "(${service.reviewsCount ?? 120})",
                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                    ),
                  ],
                ),

                const SizedBox(height: 4),

                // Pricing Row (Actual Price + Cut Price)
                Row(
                  children: [
                    Text(
                      "₹ ${service.price}",
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: Colors.green,
                      ),
                    ),
                    if (service.cutPrice != null && service.cutPrice! > service.price) ...[
                      const SizedBox(width: 6),
                      Text(
                        "₹ ${service.cutPrice}",
                        style: const TextStyle(
                          decoration: TextDecoration.lineThrough,
                          color: Colors.grey,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}