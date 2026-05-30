import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:userapp/view/address_screen/address_screen.dart';
import '../../../viewmodel/service_viewmodel.dart';

class ServiceDetailScreen extends StatelessWidget {
  const ServiceDetailScreen({super.key});


  void showBookingBottomSheet(BuildContext context) {
    final vm = Provider.of<ServiceViewModel>(context, listen: false);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) {
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
                  ///
                  Text("Select Date",
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),

                  SizedBox(height: 10),

                  /// DATE PICKER BUTTON
                  GestureDetector(
                    onTap: () async {
                      final pickedDate = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime.now(),
                        lastDate: DateTime(2030),
                      );

                      if (pickedDate != null) {
                        vm.setDate(pickedDate);
                        final dateStr = pickedDate.toString().split(" ")[0];
                        await vm.loadAvailableSlots(dateStr);
                        setState(() {});
                      }
                    },
                    child: Container(
                      padding: EdgeInsets.all(12),
                      width: double.infinity,
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        vm.selectedDate == null
                            ? "Choose Date"
                            : vm.selectedDate.toString().split(" ")[0],
                      ),
                    ),
                  ),

                  SizedBox(height: 20),

                  /// SLOT TITLE
                  Text("Select Slot",
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),

                  SizedBox(height: 10),

                  /// SLOTS
                  vm.isLoadingSlots
                      ? const Center(child: CircularProgressIndicator())
                      : vm.selectedDate == null
                          ? const Padding(
                              padding: EdgeInsets.symmetric(vertical: 10),
                              child: Text(
                                "Please select a date first to see available slots",
                                style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic),
                              ),
                            )
                          : vm.availableSlots.isEmpty
                              ? const Padding(
                                  padding: EdgeInsets.symmetric(vertical: 10),
                                  child: Text(
                                    "No available slots for this date",
                                    style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                                  ),
                                )
                              : Wrap(
                                  spacing: 10,
                                  runSpacing: 10,
                                  children: vm.availableSlots.map((slotObj) {
                                    final slot = slotObj['time'] as String;
                                    final isSelected = vm.selectedSlot == slot;

                                    return ChoiceChip(
                                      label: Text(slot),
                                      selected: isSelected,
                                      onSelected: (_) {
                                        vm.setSlot(slot);
                                        setState(() {});
                                      },
                                    );
                                  }).toList(),
                                ),

                  SizedBox(height: 20),

                  /// CONFIRM BUTTON

                  SizedBox(

                    width: double.infinity,
                    child :Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors:
                        [Colors.blue,Colors.green

                        ]),
                        borderRadius: BorderRadiusGeometry.circular(12)

                  ),
                    child: ElevatedButton(
                      onPressed: () {

                        if (vm.selectedDate == null || vm.selectedSlot == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text("Select date & slot")),
                          );
                          return;
                        }

                        Navigator.pop(context);

                        ///  NEXT STEP (address screen)


                        Navigator.pushReplacement(context,MaterialPageRoute(builder: (_)=>AddressScreen()));
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                      ),
                      child: Text("Confirm",style: TextStyle(color:Colors.white,fontWeight: FontWeight.bold),),
                    ),
                  ),
                  ),
                  SizedBox(height: 10),
                ],


              ),
            );
          },
        );
      },
    );
  }
  

  

  @override
  Widget build(BuildContext context) {
    

    final vm = Provider.of<ServiceViewModel>(context);
    final service = vm.selectedService;

    if (service == null) {
      return Scaffold(
        body: Center(child: Text("No Service Found")),
      );
    }

    return Scaffold(

      appBar: AppBar(
        title: Text(service.title),
      ),

      body: Stack(
        children: [

          /// SCROLL
          SingleChildScrollView(
            padding: EdgeInsets.only(bottom: 80),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [

                service.image != null && service.image!.isNotEmpty
                    ? (service.image!.startsWith('http')
                        ? Image.network(
                            service.image!,
                            height: 220,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Container(
                              height: 220,
                              width: double.infinity,
                              color: Colors.grey[300],
                              child: const Icon(Icons.image, size: 50, color: Colors.grey),
                            ),
                          )
                        : Image.asset(
                            service.image!,
                            height: 220,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ))
                    : Container(
                        height: 220,
                        width: double.infinity,
                        color: Colors.grey[300],
                        child: const Icon(Icons.image, size: 50, color: Colors.grey),
                      ),

                SizedBox(height: 16),

                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    service.title,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                ),

                //  RATING & REVIEWS ROW
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Colors.amber.shade200),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.star, color: Colors.amber, size: 16),
                            const SizedBox(width: 4),
                            Text(
                              "${service.rating ?? 4.8}",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                color: Colors.amber.shade900,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        "${service.reviewsCount ?? 120} customer reviews",
                        style: const TextStyle(color: Colors.black54, fontSize: 13),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 6),

                //  PRICING HEADER WITH DISCOUNT BADGE
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Text(
                        "₹${service.price}.00",
                        style: const TextStyle(
                          fontSize: 22,
                          color: Colors.green,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (service.cutPrice != null && service.cutPrice! > service.price) ...[
                        const SizedBox(width: 10),
                        Text(
                          "₹${service.cutPrice}.00",
                          style: const TextStyle(
                            fontSize: 16,
                            color: Colors.grey,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Colors.orange.shade700, Colors.red.shade700],
                            ),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            "${service.discount ?? 20}% OFF",
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                SizedBox(height: 16),
                Divider(),
                SizedBox(height: 12,),

                Padding(
                  padding: const EdgeInsets.all(10),
                  child: Text("Description",style: TextStyle(fontSize: 18,fontWeight: FontWeight.bold),),
                ),

                SizedBox(height:12),

                Padding(
                  padding: const EdgeInsets.all(15),
                  child: Text(service.description,
                  style: TextStyle(fontSize: 14,color: Colors.black),
                  ),
                ),




                SizedBox(height: 500),
              ],
            ),
          ),


                             ///  FIXED BUTTON
          Positioned(
            bottom: 20,
            left: 0,
            right: 0,
            child: Container(

              padding: EdgeInsets.all(16),
              color: Colors.white,
              child:Container(decoration: BoxDecoration(
                gradient: LinearGradient(colors:[Colors.blue,Colors.green],
                ),
                borderRadius: BorderRadius.circular(15)

              ),

              child: ElevatedButton(
                onPressed: () {

                  showBookingBottomSheet(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  padding: EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadiusGeometry.circular(12),
                  )
                ),


                child: Text("Book Now"),
              ),
            ),
          ),
          )
        ],
      ),
    );
  }
}