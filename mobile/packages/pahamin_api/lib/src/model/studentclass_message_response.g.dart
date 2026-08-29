// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'studentclass_message_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

StudentclassMessageResponse _$StudentclassMessageResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('StudentclassMessageResponse', json, ($checkedConvert) {
  final val = StudentclassMessageResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$StudentclassMessageResponseToJson(
  StudentclassMessageResponse instance,
) => <String, dynamic>{'message': ?instance.message};
