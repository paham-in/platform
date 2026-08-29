// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_error_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NotificationErrorResponse _$NotificationErrorResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('NotificationErrorResponse', json, ($checkedConvert) {
  final val = NotificationErrorResponse(
    error: $checkedConvert('error', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$NotificationErrorResponseToJson(
  NotificationErrorResponse instance,
) => <String, dynamic>{'error': ?instance.error};
