import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../model/booking_status.dart';
import '../../../viewmodel/booking_flow_viewmodel.dart';

import 'partner_info_card.dart';
import 'tracking_status_card.dart';

class TrackingBottomSheet extends StatelessWidget {
  const TrackingBottomSheet({super.key});

  @override
  Widget build(BuildContext context) {

    final vm =
    Provider.of<BookingFlowViewModel>(context);

    return Container(

      padding: const EdgeInsets.all(16),

      decoration: const BoxDecoration(
        color: Colors.white,

        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),

      child: Column(
        crossAxisAlignment:
        CrossAxisAlignment.start,

        children: [

          /// TOP LINE
          Center(
            child: Container(
              height: 5,
              width: 60,

              decoration: BoxDecoration(
                color: Colors.grey.shade300,

                borderRadius:
                BorderRadius.circular(20),
              ),
            ),
          ),

          const SizedBox(height: 20),

          /// PARTNER CARD
          PartnerInfoCard(
            partnerName:
            vm.partnerName ??
                "Partner Assigned",

            distance:
            vm.partnerDistance ??
                "Nearby",
          ),

          const SizedBox(height: 25),

          const Text(
            "Tracking Status",

            style: TextStyle(
              fontSize: 18,
              fontWeight:
              FontWeight.bold,
            ),
          ),

          const SizedBox(height: 20),

          /// STATUS FLOW
          TrackingStatusCard(
            title: "Searching Partner",
            isDone: true,
          ),

          TrackingStatusCard(
            title: "Partner Assigned",

            isDone:
            vm.status.index >=
                BookingStatus.assigned.index,
          ),

          TrackingStatusCard(
            title: "Partner Accepted",

            isDone:
            vm.status.index >=
                BookingStatus.accepted.index,
          ),

          TrackingStatusCard(
            title: "On The Way",

            isDone:
            vm.status.index >=
                BookingStatus.onTheWay.index,
          ),

          TrackingStatusCard(
            title: "Completed",

            isDone:
            vm.status.index >=
                BookingStatus.completed.index,
          ),

          const Spacer(),

          /// CANCEL BUTTON
          SizedBox(
            width: double.infinity,
            height: 52,

            child: ElevatedButton(

              onPressed: () {

                /// future cancel API
              },

              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
              ),

              child: const Text(
                "Cancel Booking",
              ),
            ),
          ),
        ],
      ),
    );
  }
}