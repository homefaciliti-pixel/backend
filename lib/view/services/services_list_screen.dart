import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../viewmodel/service_viewmodel.dart';
import '../../widgets/service_big_card.dart';
import '../home/servicesdetail screen/services_detail_screen.dart';

class ServicesListScreen extends StatefulWidget {
  final String categoryName;

  const ServicesListScreen({
    super.key,
    required this.categoryName,
  });

  @override
  State<ServicesListScreen> createState() => _ServicesListScreenState();
}

class _ServicesListScreenState extends State<ServicesListScreen> {

  @override
  void initState() {
    super.initState();

             ///  LOAD DATA FROM VIEWMODEL

    Future.microtask(() {
      Provider.of<ServiceViewModel>(context, listen: false)
          .loadServices(widget.categoryName);
    });
  }

  @override
  Widget build(BuildContext context) {

    final vm = Provider.of<ServiceViewModel>(context);

    return Scaffold(
      backgroundColor: Colors.grey.shade100,

      appBar: AppBar(
        title: Text(widget.categoryName),
      ),

      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: vm.services.length,

        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 0.80,
        ),

        itemBuilder: (context, index) {
               /// service screen add
          ///
          final service = vm.services[index];

          return GestureDetector(
            onTap: () {
              vm.selectService(service);

              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ServiceDetailScreen(),
                ),
              );
            },
            child: ServiceBigCard(
              title: service.title,
              price: "₹ ${service.price}",
              image: (service.image != null && service.image!.isNotEmpty) ? service.image! : "https://via.placeholder.com/150",
            ),
          );
        },
      ),
    );
  }
}