import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../viewmodel/booking_flow_viewmodel.dart';
import '../../model/booking_status.dart';

class SearchingPartnerScreen extends StatefulWidget {
  const SearchingPartnerScreen({super.key});

  @override
  State<SearchingPartnerScreen> createState() => _SearchingPartnerScreenState();
}

class _SearchingPartnerScreenState extends State<SearchingPartnerScreen> {
  @override
  void initState() {
    super.initState();
    // Booking search and polling are managed automatically by BookingFlowViewModel
  }

  @override
  Widget build(BuildContext context) {
    final vm = Provider.of<BookingFlowViewModel>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Searching Partner"),
      ),
      body: Center(
        child: vm.status == BookingStatus.searching
            ? Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            CircularProgressIndicator(),
            SizedBox(height: 20),
            Text(
              "Searching for nearby partner...",
              style: TextStyle(fontSize: 16),
            ),
          ],
        )
            : Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.person_pin_circle, size: 80),
            const SizedBox(height: 16),
            Text(
              vm.partnerName ?? "",
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(vm.partnerDistance ?? ""),
            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: () {
                vm.acceptPartner();
                Navigator.pushNamed(context, "/tracking");
              },
              child: const Text("Accept & Continue"),
            ),
          ],
        ),
      ),
    );
  }
}