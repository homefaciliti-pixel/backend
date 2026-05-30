import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;

    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const initSettings = InitializationSettings(
      android: androidSettings,
    );

    await _plugin.initialize(initSettings);
    _initialized = true;
  }

  Future<void> showPartnerAssigned({
    required String partnerName,
    required String serviceName,
    required String distance,
  }) async {
    await init();

    const androidDetails = AndroidNotificationDetails(
      'partner_channel',
      'Partner Updates',
      channelDescription: 'Notifications when a service partner is assigned',
      importance: Importance.high,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
      icon: '@mipmap/ic_launcher',
    );

    const details = NotificationDetails(android: androidDetails);

    await _plugin.show(
      1001,
      '🎉 Partner Assigned!',
      '$partnerName is on the way for your $serviceName ($distance)',
      details,
    );
  }

  Future<void> showOrderConfirmed({
    required String serviceName,
    required String date,
    required String timeSlot,
  }) async {
    await init();

    const androidDetails = AndroidNotificationDetails(
      'booking_channel',
      'Booking Confirmations',
      channelDescription: 'Notifications for confirmed bookings',
      importance: Importance.high,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
      icon: '@mipmap/ic_launcher',
    );

    const details = NotificationDetails(android: androidDetails);

    await _plugin.show(
      1002,
      '✅ Booking Confirmed!',
      '$serviceName scheduled for $date at $timeSlot',
      details,
    );
  }
}
