import 'package:flutter/material.dart';
import 'package:userapp/view/services/services_list_screen.dart';
import 'category_card.dart';

class CategoriesGrid extends StatelessWidget {

  final List categories;

  const CategoriesGrid({
    super.key,
    required this.categories,
  });

  @override
  Widget build(BuildContext context) {

    return GridView.builder(

      itemCount: categories.length,

      shrinkWrap: true,

      physics: const NeverScrollableScrollPhysics(),

      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(

        crossAxisCount: 4,

        crossAxisSpacing: 12,

        mainAxisSpacing: 12,

      ),

      itemBuilder: (context, index) {

        final category = categories[index];

        return CategoryCard(
          title: category['name'],
          imageUrl: category['image'],
          onTap: (){

            Navigator.push(context, MaterialPageRoute(builder:  (_)=> ServicesListScreen(categoryName: category["title"])));
          },
        );
      },
    );
  }
}