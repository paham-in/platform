// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_notification_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NotificationNotificationResponse _$NotificationNotificationResponseFromJson(
  Map<String, dynamic> json,
) =>
    $checkedCreate('NotificationNotificationResponse', json, ($checkedConvert) {
      final val = NotificationNotificationResponse(
        body: $checkedConvert('body', (v) => v as String?),
        createdAt: $checkedConvert('created_at', (v) => v as String?),
        id: $checkedConvert('id', (v) => (v as num?)?.toInt()),
        isRead: $checkedConvert('is_read', (v) => v as bool?),
        title: $checkedConvert('title', (v) => v as String?),
        type: $checkedConvert('type', (v) => v as String?),
        url: $checkedConvert('url', (v) => v as String?),
      );
      return val;
    }, fieldKeyMap: const {'createdAt': 'created_at', 'isRead': 'is_read'});

Map<String, dynamic> _$NotificationNotificationResponseToJson(
  NotificationNotificationResponse instance,
) => <String, dynamic>{
  'body': ?instance.body,
  'created_at': ?instance.createdAt,
  'id': ?instance.id,
  'is_read': ?instance.isRead,
  'title': ?instance.title,
  'type': ?instance.type,
  'url': ?instance.url,
};
