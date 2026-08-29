// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionpackage_message_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionpackageMessageResponse _$QuestionpackageMessageResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('QuestionpackageMessageResponse', json, ($checkedConvert) {
  final val = QuestionpackageMessageResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$QuestionpackageMessageResponseToJson(
  QuestionpackageMessageResponse instance,
) => <String, dynamic>{'message': ?instance.message};
