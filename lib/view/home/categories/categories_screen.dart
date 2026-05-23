import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:userapp/utils/app_colors.dart';
import 'package:userapp/view/services/services_list_screen.dart';
import 'package:userapp/widgets/category_card.dart';
import 'package:userapp/viewmodel/service_viewmodel.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ServiceViewModel>(context, listen: false).loadCategories();
    });
  }

  @override
  Widget build(BuildContext context) {
    final serviceVM = Provider.of<ServiceViewModel>(context);
    final List<String> categories = serviceVM.categories;

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

              return CategoryCard(title: category,
                onTap: (){
                Navigator.push(context, MaterialPageRoute(builder:
                (_)=> ServicesListScreen(categoryName: category,)
                ));
                }

              );

        }

        ),
      ),
    );
  }
}
