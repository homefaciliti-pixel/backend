import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import 'package:userapp/utils/app_colors.dart';
import 'package:userapp/view/services/services_list_screen.dart';
import 'package:userapp/widgets/category_card.dart';

import '../../../services/category/category_auth_api.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  void initState() {
    super.initState();


    Future.microtask(() {
      Provider.of<CategoryViewmodelApi>(
        context,
        listen: false,
      ).fetchCategories();
    });
  }

  @override
  Widget build(BuildContext context) {

    // final List<Map<String, dynamic>> categories = <Map<String, dynamic>>[
    //   {"title": "Plumber"},
    //   {"title": "Electrician"},
    //   {"title": "Salon And Spa"},
    //   {"title": "Cleaning Services"},
    //   {"title": "Architecture"},
    //   {"title": "Carpenter"},
    //   {"title": "Contractor"},
    //   {"title": "Pandit ji"},
    //   {"title": "Driver"},
    //   {"title": "Photographer"},
    //   {"title": "Doctors"},
    //   {"title": "Compounder"},
    //   {"title": "Halbai"},
    //   {"title": "Car Washing"},
    //   {"title": "Mechanic"},
    //   {"title": "Bike Services"},
    // ];

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Colors.transparent,
        elevation: 0,

        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.primaryButton,
                AppColors.secondaryButton,
              ],
            ),
          ),
        ),

        title: const Text(
          "Category",
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),

        centerTitle: true,
      ),
      // appBar: AppBar(
      //   automaticallyImplyLeading: false,
      //   backgroundColor: Colors.transparent,
      //   title: Text("Categories",
      //   style: TextStyle(
      //   fontWeight: FontWeight.bold
      //   ),
      //   ),
      // ),

      body:
      Consumer<CategoryViewmodelApi>(
        builder: (context, serviceVM, child) {

          // if (serviceVM.categoryLoading) {
          //   return const Center(
          //     child: CircularProgressIndicator(),
          //   );
          // }
          if (serviceVM.categoryLoading) {
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.count(
                crossAxisCount: 4,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                children: List.generate(18, (index) {
                  return Shimmer.fromColors(
                    baseColor: Colors.grey.shade300,
                    highlightColor: Colors.grey.shade100,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12), // 👈 rounded square
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // icon placeholder (square with rounded corners)
                          Container(
                            height: 45,
                            width: 45,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),

                          const SizedBox(height: 8),

                          // text placeholder
                          Container(
                            height: 10,
                            width: 35,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ),
            );
          }

          if (serviceVM.categories.isEmpty) {
            return const Center(
              child: Text("No Categories Found"),
            );
          }


          return Padding(
            padding: const EdgeInsets.only(top: 18.0),
            child: Container(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: GridView.count(
                  crossAxisCount: 4,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  children: serviceVM.categories.map((category) {
                    return CategoryCard(
                      title: category.name,
                      imageUrl: category.image, // 👈 add this in widget
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ServicesListScreen(
                              categoryName: category.name,
                            ),
                          ),
                        );
                      },
                    );
                  }).toList(),
                ),
              ),
            ),
          );
        },
      ),

      // Padding(
      //
      //   padding: const EdgeInsets.all(16),
      //   child: GridView.builder(
      //       itemCount: categories.length,
      //       gridDelegate:
      //   SliverGridDelegateWithFixedCrossAxisCount(
      //     crossAxisCount:  4,
      //     crossAxisSpacing: 12,
      //     mainAxisSpacing: 12,childAspectRatio: 0.9,
      //
      //   ), itemBuilder: (context ,index){
      //         final category = categories[index];
      //
      //         return CategoryCard(title: category["title"],
      //           onTap: (){
      //           Navigator.push(context, MaterialPageRoute(builder:
      //           (_)=> ServicesListScreen(categoryName: category["title"],)
      //           ));
      //           }
      //
      //         );
      //
      //   }
      //
      //   ),
      // ),
      //
    );
  }
}
