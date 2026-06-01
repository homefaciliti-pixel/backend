import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shimmer/shimmer.dart';

import '../../../utils/app_colors.dart';
//import '../utils/app_colors.dart';

class PrivacyPolicyPage extends StatefulWidget {
  const PrivacyPolicyPage({super.key});

  @override
  State<PrivacyPolicyPage> createState() =>
      _PrivacyPolicyPageState();
}

class _PrivacyPolicyPageState
    extends State<PrivacyPolicyPage> {

  Map<String, dynamic>? policy;

  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchPolicy();
  }

  Future<void> fetchPolicy() async {

    try {

      final response = await http.get(
        Uri.parse(
          "https://backend-1-ux3b.onrender.com/api/policies/privacy",
        ),
      );

      if (response.statusCode == 200) {

        setState(() {

          policy = jsonDecode(response.body);

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

      debugPrint("Error: $e");
    }
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      backgroundColor: const Color(0xfff5f7fb),

      body: isLoading

          ? buildShimmerLoader()

          : policy == null

          ? const Center(
        child: Text(
          "Failed to load privacy policy",
        ),
      )

          : CustomScrollView(

        slivers: [

          /// ================= APP BAR =================
          SliverAppBar(

            expandedHeight: 230,

            pinned: true,

            elevation: 0,

            backgroundColor:
            AppColors.primaryButton,

            /// WHITE BACK BUTTON
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

              // title: Text(
              //   policy!["title"] ?? "",
              //
              //   style: const TextStyle(
              //     color: Colors.white,
              //     fontSize: 18,
              //     fontWeight: FontWeight.bold,
              //   ),
              // ),

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

                    /// ICON BOX
                    Container(

                      padding:
                      const EdgeInsets.all(20),

                      decoration: BoxDecoration(

                        color: Colors.white24,

                        borderRadius:
                        BorderRadius.circular(22),
                      ),

                      child: const Icon(
                        Icons.privacy_tip_rounded,
                        color: Colors.white,
                        size: 75,
                      ),
                    ),

                    const SizedBox(height: 20),

                    /// TITLE
                    Text(
                      policy!["title"],

                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 30,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
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

                  /// LAST UPDATED CARD
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

                        Expanded(
                          child: Text(
                            "Last Updated: ${policy!["lastUpdated"]}",

                            style: TextStyle(
                              color:
                              AppColors.primaryButton,
                              fontWeight:
                              FontWeight.w600,
                              fontSize: 15,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 28),

                  /// INTRO TEXT
                  Text(
                    policy!["content"],
                    style: TextStyle(
                      fontSize: 16,
                      height: 1.8,
                      color: Colors.grey.shade800,
                    ),
                  ),

                  //const SizedBox(height: 30),

                  /// POLICY SECTIONS
                  ListView.builder(

                    shrinkWrap: true,

                    physics:
                    const NeverScrollableScrollPhysics(),

                    itemCount:
                    policy!["sections"].length,

                    itemBuilder: (context, index) {

                      final section =
                      policy!["sections"][index];

                      return Container(

                        margin:
                        const EdgeInsets.only(
                          bottom: 20,
                        ),

                        padding:
                        const EdgeInsets.all(18),

                        decoration: BoxDecoration(

                          color: Colors.white,

                          borderRadius:
                          BorderRadius.circular(22),

                          boxShadow: [

                            BoxShadow(
                              color: Colors.black
                                  .withOpacity(0.05),

                              blurRadius: 12,

                              offset:
                              const Offset(0, 4),
                            ),
                          ],
                        ),

                        child: Column(
                          crossAxisAlignment:
                          CrossAxisAlignment.start,

                          children: [

                            /// SECTION TITLE
                            Row(
                              crossAxisAlignment:
                              CrossAxisAlignment.start,

                              children: [

                                Container(
                                  width: 8,
                                  height: 35,

                                  decoration:
                                  BoxDecoration(

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
                                    BorderRadius.circular(
                                      20,
                                    ),
                                  ),
                                ),

                                const SizedBox(width: 14),

                                Expanded(
                                  child: Text(
                                    section["title"],

                                    style:
                                    const TextStyle(
                                      fontSize: 19,
                                      fontWeight:
                                      FontWeight.bold,
                                      color:
                                      Colors.black87,
                                    ),
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 16),

                            /// BODY
                            Text(
                              section["body"],

                              style: TextStyle(
                                fontSize: 15.5,
                                height: 1.8,
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