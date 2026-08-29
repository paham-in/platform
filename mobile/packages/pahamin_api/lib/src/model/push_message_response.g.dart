// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'push_message_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PushMessageResponse _$PushMessageResponseFromJson(Map<String, dynamic> json) =>
    $checkedCreate('PushMessageResponse', json, ($checkedConvert) {
      final val = PushMessageResponse(
        message: $checkedConvert('message', (v) => v as String?),
      );
      return val;
    });

Map<String, dynamic> _$PushMessageResponseToJson(
  PushMessageResponse instance,
) => <String, dynamic>{'message': ?instance.message};
