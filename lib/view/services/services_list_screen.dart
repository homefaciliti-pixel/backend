import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../viewmodel/service_viewmodel.dart';
import '../../widgets/service_big_card.dart';
import '../home/servicesdetail screen/services_detail_screen.dart';

class ServicesListScreen extends StatefulWidget {
  final String categoryName;
  final String? categoryImage;

  const ServicesListScreen({
    super.key,
    required this.categoryName,
    this.categoryImage,
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
        title: Row(
          children: [
            if (widget.categoryImage != null && widget.categoryImage!.isNotEmpty)
              Container(
                width: 32,
                height: 32,
                margin: const EdgeInsets.only(right: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.all(4),
                child: ColorFiltered(
                  colorFilter: const ColorFilter.matrix([
                    0.2126, 0.7152, 0.0722, 0, 0,
                    0.2126, 0.7152, 0.0722, 0, 0,
                    0.2126, 0.7152, 0.0722, 0, 0,
                    0,      0,      0,      1, 0,
                  ]),
                  child: Image.network(
                    widget.categoryImage!,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => const Icon(
                      Icons.category_outlined,
                      size: 20,
                      color: Colors.black54,
                    ),
                  ),
                ),
              ),
            Text(
              widget.categoryName,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),

      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: vm.services.length,

        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 0.73, // Adjusted to prevent layout overflow with rating & cut price
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
              service: service,
            ),
          );
        },
      ),
    );
  }
}