// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_list_notifications_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NotificationListNotificationsResponse
_$NotificationListNotificationsResponseFromJson(Map<String, dynamic> json) =>
    $checkedCreate('NotificationListNotificationsResponse', json, (
      $checkedConvert,
    ) {
      final val = NotificationListNotificationsResponse(
        notifications: $checkedConvert(
          'notifications',
          (v) => (v as List<dynamic>?)
              ?.map(
                (e) => NotificationNotificationResponse.fromJson(
                  e as Map<String, dynamic>,
                ),
              )
              .toList(),
        ),
        total: $checkedConvert('total', (v) => (v as num?)?.toInt()),
      );
      return val;
    });

Map<String, dynamic> _$NotificationListNotificationsResponseToJson(
  NotificationListNotificationsResponse instance,
) => <String, dynamic>{
  'notifications': ?instance.notifications?.map((e) => e.toJson()).toList(),
  'total': ?instance.total,
};
