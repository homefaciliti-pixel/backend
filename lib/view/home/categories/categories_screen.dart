import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:userapp/utils/app_colors.dart';
import 'package:userapp/view/services/services_list_screen.dart';
import 'package:userapp/widgets/category_card.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  @override
  Widget build(BuildContext context) {
    final List<Map<String, dynamic>> categories = <Map<String, dynamic>>[
      {"title": "Plumber"},
      {"title": "Electrician"},
      {"title": "Salon And Spa"},
      {"title": "Cleaning Services"},
      {"title": "Architecture"},
      {"title": "Carpenter"},
      {"title": "Contractor"},
      {"title": "Pandit ji"},
      {"title": "Driver"},
      {"title": "Photographer"},
      {"title": "Doctors"},
      {"title": "Compounder"},
      {"title": "Halbai"},
      {"title": "Car Washing"},
      {"title": "Mechanic"},
      {"title": "Bike Services"},
    ];

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: AppColors.back),
          onPressed: () {
            Navigator.pop(context);
          },
        ),

        title: Text("Categories",
        style: TextStyle(color: AppColors.back,
        fontWeight: FontWeight.bold
        ),
        ),
      ),

      body: Padding(
        padding: const EdgeInsets.all(16),
        child: GridView.builder(
            itemCount: categories.length,
            gridDelegate:
        SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount:  4,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,childAspectRatio: 0.9,

        ), itemBuilder: (context ,index){
              final category = categories[index];

              return CategoryCard(title: category["title"],
                onTap: (){
                Navigator.push(context, MaterialPageRoute(builder:
                (_)=> ServicesListScreen(categoryName: category["title"],)
                ));
                }

              );

        }

        ),
      ),
    );
  }
}
