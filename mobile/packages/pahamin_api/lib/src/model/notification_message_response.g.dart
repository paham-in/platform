// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_message_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NotificationMessageResponse _$NotificationMessageResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('NotificationMessageResponse', json, ($checkedConvert) {
  final val = NotificationMessageResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$NotificationMessageResponseToJson(
  NotificationMessageResponse instance,
) => <String, dynamic>{'message': ?instance.message};
