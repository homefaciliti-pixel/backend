import 'package:flutter/material.dart';
import '../model/service_model.dart';

class ServiceCard extends StatelessWidget {
  final ServiceModel service;
  final VoidCallback? onTap;

  const ServiceCard({super.key, required
  this.service,
    this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 160,
        height: 180, //
        margin: const EdgeInsets.only(left: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
      
            //  IMAGE (null safe)
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
      
            Padding(
              padding:  EdgeInsets.all(8),
              child: SizedBox(
                height: 60, //  overflow fix
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
      
                    //  TITLE
                    Expanded(
                      child: Text(
                        service.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
      
                    const SizedBox(height: 4),
      
                    //  PRICE (Add button removed)
                    Text(
                      "₹ ${service.price}",
                      style: const TextStyle(fontWeight: FontWeight.bold),
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