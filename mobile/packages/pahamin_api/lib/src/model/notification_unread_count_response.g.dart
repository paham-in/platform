// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_unread_count_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NotificationUnreadCountResponse _$NotificationUnreadCountResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('NotificationUnreadCountResponse', json, ($checkedConvert) {
  final val = NotificationUnreadCountResponse(
    count: $checkedConvert('count', (v) => (v as num?)?.toInt()),
  );
  return val;
});

Map<String, dynamic> _$NotificationUnreadCountResponseToJson(
  NotificationUnreadCountResponse instance,
) => <String, dynamic>{'count': ?instance.count};
