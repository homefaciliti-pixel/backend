import 'package:flutter/material.dart';

class PartnerInfoCard extends StatelessWidget {

  final String partnerName;
  final String distance;

  const PartnerInfoCard({
    super.key,
    required this.partnerName,
    required this.distance,
  });

  @override
  Widget build(BuildContext context) {

    return Container(

      padding: const EdgeInsets.all(16),

      decoration: BoxDecoration(
        color: Colors.white,

        borderRadius: BorderRadius.circular(18),

        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 6,
          ),
        ],
      ),

      child: Row(
        children: [

          /// PARTNER IMAGE
          CircleAvatar(
            radius: 30,
            backgroundColor: Colors.blue.shade100,

            child: const Icon(
              Icons.person,
              size: 35,
            ),
          ),

          const SizedBox(width: 14),

          /// PARTNER DETAILS
          Expanded(
            child: Column(
              crossAxisAlignment:
              CrossAxisAlignment.start,

              children: [

                Text(
                  partnerName,

                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight:
                    FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 5),

                Text(
                  distance,
                  style: TextStyle(
                    color: Colors.grey.shade700,
                  ),
                ),
              ],
            ),
          ),

          /// CALL BUTTON
          Container(
            padding: const EdgeInsets.all(10),

            decoration: BoxDecoration(
              color: Colors.green.shade50,
              shape: BoxShape.circle,
            ),

            child: const Icon(
              Icons.call,
              color: Colors.green,
            ),
          ),
        ],
      ),
    );
  }
}