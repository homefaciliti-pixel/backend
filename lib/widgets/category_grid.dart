import 'package:flutter/material.dart';
import 'package:userapp/model/categorymodel.dart';
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
        final String title = category is String 
            ? category 
            : (category is CategoryModel ? category.title : (category['name'] ?? category['title'] ?? ''));
        final String? image = category is String 
            ? null 
            : (category is CategoryModel ? category.image : category['image']);
        final String categoryName = category is String 
            ? category 
            : (category is CategoryModel ? category.title : (category['title'] ?? category['name'] ?? ''));

        return CategoryCard(
          title: title,
          image: image != null && image.isNotEmpty ? image : null,
          onTap: (){

            Navigator.push(context, MaterialPageRoute(builder:  (_)=> ServicesListScreen(categoryName: categoryName)));
          },
        );
      },
    );
  }
}