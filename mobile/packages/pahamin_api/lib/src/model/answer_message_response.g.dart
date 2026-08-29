// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'answer_message_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AnswerMessageResponse _$AnswerMessageResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('AnswerMessageResponse', json, ($checkedConvert) {
  final val = AnswerMessageResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$AnswerMessageResponseToJson(
  AnswerMessageResponse instance,
) => <String, dynamic>{'message': ?instance.message};
