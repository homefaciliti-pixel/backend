import 'package:flutter/material.dart';
import '../model/service_model.dart';

class ServiceCard extends StatelessWidget {
  final ServiceModel service;
  final VoidCallback? onTap;

  const ServiceCard({super.key, required this.service, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 160,
        height: 200, // Increased height to accommodate ratings & cut prices
        margin: const EdgeInsets.only(left: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 6,
              offset: const Offset(0, 2),
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
      
            //  IMAGE WITH DISCOUNT BADGE OVERLAY
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  child: service.image != null && service.image!.isNotEmpty
                      ? (service.image!.startsWith('http')
                          ? Image.network(
                              service.image!,
                              height: 100,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => Container(
                                height: 100,
                                width: double.infinity,
                                color: Colors.grey.shade300,
                                child: const Icon(Icons.image, size: 40),
                              ),
                            )
                          : Image.asset(
                              service.image!,
                              height: 100,
                              width: double.infinity,
                              fit: BoxFit.cover,
                            ))
                      : Container(
                          height: 100,
                          width: double.infinity,
                          color: Colors.grey.shade300,
                          child: const Icon(Icons.image, size: 40),
                        ),
                ),
                if (service.discount != null && service.discount! > 0)
                  Positioned(
                    top: 6,
                    left: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
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
      
            Padding(
              padding: const EdgeInsets.all(8),
              child: SizedBox(
                height: 76, // Height adjusted to prevent overflow
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
      
                    //  TITLE
                    Text(
                      service.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
      
                    //  RATING CHIP
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 12),
                        const SizedBox(width: 2),
                        Text(
                          "${service.rating ?? 4.8}",
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 2),
                        Text(
                          "(${service.reviewsCount ?? 120})",
                          style: const TextStyle(fontSize: 10, color: Colors.grey),
                        ),
                      ],
                    ),
      
                    //  PRICE (Add button removed)
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
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}