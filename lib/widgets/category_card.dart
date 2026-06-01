import 'package:flutter/material.dart';

import '../utils/app_colors.dart';

class CategoryCard extends StatelessWidget {
  final String title;
  final String? imageUrl;
  final VoidCallback? onTap;

  const CategoryCard({
    super.key,
    required this.title,
    this.onTap,
    this.imageUrl,
  });

  @override
  Widget build(BuildContext context) {

    return InkWell(

      onTap: onTap,

      borderRadius: BorderRadius.circular(12),
      child: Container(
        height:60,
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // TOP CARD
            // Expanded(
            //   child:
              Container(
                height: 68,
                decoration: BoxDecoration(
                  color: Colors.white,

                  borderRadius:
                  BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black12,

                      blurRadius: 6,

                      offset: const Offset(0, 3),
                    ),
                  ],
                ),

                child: Center(

                  child:

                  imageUrl != null

                      ? Padding(

                    padding: const EdgeInsets.all(5),

                    child: Image.network(

                      imageUrl!,

                      fit: BoxFit.contain,
                    //  color:  AppColors.secondaryButton,
                    ),
                  )

                      : const Icon(
                    Icons.home_repair_service,
                    size: 30,
                  ),
                ),
              ),
            //),

            const SizedBox(height: 6),

            // TITLE BELOW CARD
            Center(
              child: Text(

                title,

                textAlign: TextAlign.center,

                maxLines: 1,

                overflow: TextOverflow.ellipsis,

                style: const TextStyle(

                  fontSize: 12,

                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}