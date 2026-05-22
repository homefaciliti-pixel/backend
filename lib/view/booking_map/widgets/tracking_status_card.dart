import 'package:flutter/material.dart';

class TrackingStatusCard extends StatelessWidget {

  final String title;
  final bool isDone;

  const TrackingStatusCard({
    super.key,
    required this.title,
    required this.isDone,
  });

  @override
  Widget build(BuildContext context) {

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),

      child: Row(
        children: [

          /// STATUS ICON
          CircleAvatar(
            radius: 12,

            backgroundColor:
            isDone
                ? Colors.green
                : Colors.grey,

            child: const Icon(
              Icons.check,
              color: Colors.white,
              size: 14,
            ),
          ),

          const SizedBox(width: 12),

          /// STATUS TEXT
          Text(
            title,

            style: TextStyle(
              fontSize: 16,

              color: isDone
                  ? Colors.black
                  : Colors.grey,
            ),
          ),
        ],
      ),
    );
  }
}