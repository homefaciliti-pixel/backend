import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/product/category_services_auth.dart';
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
    Future.microtask(() {
      Provider.of<CategoryServicesAuth>(context, listen: false)
          .loadServices(widget.categoryName);
    });
  }
  @override
  Widget build(BuildContext context) {

    final vm = Provider.of<CategoryServicesAuth>(context);

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(

        elevation: 0,

        backgroundColor: Colors.white,

        centerTitle: true,

        title:  Text(

          widget.categoryName,

          style: TextStyle(
            color: Colors.black,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),

        leading: IconButton(

          icon: const Icon(
            Icons.arrow_back_ios_new,
            color: Colors.black,
            size: 20,
            fontWeight: FontWeight(50),
          ),

          onPressed: () {
            Navigator.pop(context);
          },
        ),
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

          return Padding(
            padding: const EdgeInsets.only(left: 8.0),
            child: GestureDetector(
              onTap: () {
                vm.selectService(service);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ServiceDetailScreen(
                      serviceTitle: service.title,
                    ),
                  ),
                );
              },
              child: ServiceBigCard(
                title: service.title,
                price: " ${service.price}",
                image: service.image, // ✅ FIXED HERE
              ),
            ),
          );
          },
      ),
    );
  }
}