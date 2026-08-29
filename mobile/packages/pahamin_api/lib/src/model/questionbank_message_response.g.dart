// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'questionbank_message_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

QuestionbankMessageResponse _$QuestionbankMessageResponseFromJson(
  Map<String, dynamic> json,
) => $checkedCreate('QuestionbankMessageResponse', json, ($checkedConvert) {
  final val = QuestionbankMessageResponse(
    message: $checkedConvert('message', (v) => v as String?),
  );
  return val;
});

Map<String, dynamic> _$QuestionbankMessageResponseToJson(
  QuestionbankMessageResponse instance,
) => <String, dynamic>{'message': ?instance.message};
