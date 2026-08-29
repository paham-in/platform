// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'class_message_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ClassMessageResponse _$ClassMessageResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('ClassMessageResponse', json, ($checkedConvert) {
  final val = ClassMessageResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$ClassMessageResponseToJson(
  ClassMessageResponse instance,
) => <String, dynamic>{'message': ?instance.message};
