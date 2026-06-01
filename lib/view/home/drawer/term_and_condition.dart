import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shimmer/shimmer.dart';

import '../../../utils/app_colors.dart';
//import '../utils/app_colors.dart';

class TermsPage extends StatefulWidget {
  const TermsPage({super.key});

  @override
  State<TermsPage> createState() =>
      _TermsPageState();
}

class _TermsPageState extends State<TermsPage> {

  Map<String, dynamic>? terms;

  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchTerms();
  }

  Future<void> fetchTerms() async {

    try {

      final response = await http.get(
        Uri.parse(
          "https://backend-1-ux3b.onrender.com/api/policies/terms",
        ),
      );

      if (response.statusCode == 200) {

        setState(() {
          terms = jsonDecode(response.body);
          isLoading = false;
        });

      } else {

        setState(() {
          isLoading = false;
        });
      }

    } catch (e) {

      setState(() {
        isLoading = false;
      });

      debugPrint("Terms Error: $e");
    }
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      backgroundColor: const Color(0xfff5f7fb),

      body: isLoading

          ? buildShimmerLoader()

          : terms == null

          ? const Center(
        child: Text("Failed to load Terms"),
      )

          : CustomScrollView(

        slivers: [

          /// ================= APP BAR =================
          SliverAppBar(

            expandedHeight: 240,

            pinned: true,

            elevation: 0,

            backgroundColor:
            AppColors.primaryButton,

            leading: IconButton(

              icon: const Icon(
                Icons.arrow_back_ios_new,
                color: Colors.white,
              ),

              onPressed: () {
                Navigator.pop(context);
              },
            ),

            flexibleSpace: FlexibleSpaceBar(

              centerTitle: true,

              title: Text(
                terms!["title"] ?? "Terms & Conditions",

                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),

              background: Container(

                decoration: BoxDecoration(

                  gradient: LinearGradient(
                    colors: [
                      AppColors.primaryButton,
                      AppColors.secondaryButton,
                    ],

                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),

                child: Column(
                  mainAxisAlignment:
                  MainAxisAlignment.center,

                  children: [

                    const SizedBox(height: 45),

                    Container(
                      padding: const EdgeInsets.all(22),

                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius:
                        BorderRadius.circular(25),
                      ),

                      child: const Icon(
                        Icons.description_rounded,
                        color: Colors.white,
                        size: 75,
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Text(
                    //   terms!["title"],
                    //
                    //   style: const TextStyle(
                    //     color: Colors.white,
                    //     fontSize: 28,
                    //     fontWeight: FontWeight.bold,
                    //   ),
                    // ),
                  ],
                ),
              ),
            ),
          ),

          /// ================= BODY =================
          SliverToBoxAdapter(

            child: Padding(
              padding: const EdgeInsets.all(18),

              child: Column(
                crossAxisAlignment:
                CrossAxisAlignment.start,

                children: [

                  /// LAST UPDATED
                  Container(

                    padding:
                    const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),

                    decoration: BoxDecoration(

                      color: AppColors.primaryButton
                          .withOpacity(0.08),

                      borderRadius:
                      BorderRadius.circular(16),
                    ),

                    child: Row(
                      children: [

                        Icon(
                          Icons.update_rounded,
                          color:
                          AppColors.primaryButton,
                        ),

                        const SizedBox(width: 12),

                        Text(
                          "Last Updated: ${terms!["lastUpdated"]}",

                          style: TextStyle(
                            color:
                            AppColors.primaryButton,
                            fontWeight:
                            FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  /// CONTENT
                  Text(
                    terms!["content"],

                    style: TextStyle(
                      fontSize: 16,
                      height: 1.8,
                      color: Colors.grey.shade800,
                    ),
                  ),

                //  const SizedBox(height: 30),

                  /// SECTIONS
                  ListView.builder(

                    shrinkWrap: true,
                    physics:
                    const NeverScrollableScrollPhysics(),

                    itemCount:
                    terms!["sections"].length,

                    itemBuilder: (context, index) {

                      final section =
                      terms!["sections"][index];

                      return Container(

                        margin: const EdgeInsets.only(
                          bottom: 18,
                        ),

                        padding:
                        const EdgeInsets.all(18),

                        decoration: BoxDecoration(

                          color: Colors.white,

                          borderRadius:
                          BorderRadius.circular(20),

                          boxShadow: [

                            BoxShadow(
                              color: Colors.black
                                  .withOpacity(0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),

                        child: Column(
                          crossAxisAlignment:
                          CrossAxisAlignment.start,

                          children: [

                            /// TITLE
                            Row(
                              children: [

                                Container(
                                  width: 8,
                                  height: 35,

                                  decoration: BoxDecoration(
                                    gradient:
                                    LinearGradient(
                                      colors: [
                                        AppColors
                                            .primaryButton,
                                        AppColors
                                            .secondaryButton,
                                      ],
                                    ),
                                    borderRadius:
                                    BorderRadius.circular(20),
                                  ),
                                ),

                                const SizedBox(width: 12),

                                Expanded(
                                  child: Text(
                                    section["title"],

                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight:
                                      FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 14),

                            /// BODY
                            Text(
                              section["body"],

                              style: TextStyle(
                                fontSize: 15.5,
                                height: 1.7,
                                color:
                                Colors.grey.shade700,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 30),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
  Widget buildShimmerLoader() {

    return Shimmer.fromColors(

      baseColor: Colors.grey.shade300,

      highlightColor: Colors.grey.shade100,

      child: ListView(

        padding: const EdgeInsets.all(18),

        children: [

          Container(
            height: 240,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius:
              BorderRadius.circular(20),
            ),
          ),

          const SizedBox(height: 20),

          Container(
            height: 60,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius:
              BorderRadius.circular(14),
            ),
          ),

          const SizedBox(height: 20),

          Container(
            height: 100,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius:
              BorderRadius.circular(14),
            ),
          ),

          const SizedBox(height: 20),

          ...List.generate(

            3,

                (index) => Container(

              margin:
              const EdgeInsets.only(
                bottom: 20,
              ),

              height: 180,

              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius:
                BorderRadius.circular(
                  20,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}